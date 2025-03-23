'use client';

import {createContext, useContext, useEffect, useState, useMemo} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {doc, getDoc} from 'firebase/firestore';
import {auth, db} from '../firebase/config';
import {signInWithCustomToken, getIdToken} from 'firebase/auth';
import Cookies from 'js-cookie';

const USER_DATA_CACHE_KEY = 'cachedUserData'
const COOKIE_EXPIRES = 1; // 1 day
const ACCESS_TOKEN_EXPIRES_AT = 'access_token_expires_at';

// ユーザーデータのキャッシュ管理関数
const getUserDataFromCache = (uid) => {
  try {
    const cache = localStorage.getItem(USER_DATA_CACHE_KEY);
    if (cache) {
      const parsedCache = JSON.parse(cache);
      if (parsedCache[uid]) {
        return parsedCache[uid];
      }
    }
    return null;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
};

const saveUserDataToCache = (uid, data) => {
  try {
    // 既存キャッシュの取得
    const existingCache = localStorage.getItem(USER_DATA_CACHE_KEY);
    const cacheObj = existingCache ? JSON.parse(existingCache) : {};

    // 新しいデータで更新
    cacheObj[uid] = {
      ...data,
      cachedAt: new Date().toISOString()
    };

    // キャッシュを保存
    localStorage.setItem(USER_DATA_CACHE_KEY, JSON.stringify(cacheObj));
  } catch (error) {
    console.error('Cache save error:', error);
  }
};

// コンテキストの初期値
const AuthContext = createContext({
  user: null,
  loading: true,
  userData: null,
  signup: async () => Promise.resolve(),
  login: async () => Promise.resolve(),
  logout: async () => Promise.resolve(),
  refreshUserData: async () => Promise.resolve()
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const saveSession = async (currentUser) => {
    if (currentUser) {
      const token = await getIdToken(currentUser);

      Cookies.set('session', token, {
        expires: COOKIE_EXPIRES,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
      })

      Cookies.set('user_id', currentUser.uid, {
        expires: COOKIE_EXPIRES,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
      })
      return;
    }
    Cookies.remove('session');
    Cookies.remove('user_id');
  };

  // ユーザー登録関数
  const signup = async (id , password, profileData) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({id, password, profileData}),
        credentials: 'include' // これいらないかも
      });
      if (!response.ok) {
        response.json().then((data) => {
          throw new Error(`Signup failed: ${data.message}`);
        });
      }
      return true;
    } catch (error) {
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // ログイン関数
  const login = async (id, password) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({id, password}),
        credentials: 'include' // これいらないかも
      })
      if (!response.ok) {
        const data = await response.json();
        console.log(data);
        throw new Error(`Login failed: ${data.message}`);
      }

      const {accessToken, expiresIn} = await response.json();

      const userCredential = await signInWithCustomToken(auth, accessToken);
      await saveSession(userCredential.user);
      const expiredAt = String(Date.now() + expiresIn * 1000);
      localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT, expiredAt);

      setUpAccessTokenRefresh();

      return true;
    } catch (error) {
      console.log('Login error:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const setUpAccessTokenRefresh = () => {
    if (window.accessTokenRefresher) {
      clearTimeout(window.accessTokenRefresher);
    }
    const expiresAt = localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT);
    if (!expiresAt) {
      return;
    }
    // トークンの有効期限が切れる5分前にリフレッシュ
    const timeToRefresh = expiresAt - Date.now() - (5 * 60 * 1000);
    // 既に期限切れに近い場合はすぐにリフレッシュ
    const delay = Math.max(0, timeToRefresh);
    window.accessTokenRefresher = setTimeout(refreshAccessToken, delay);
  }

  const refreshAccessToken = async () => {
    try {
      // 実はgetIdToken()を使ってもリフレッシュトークンは取得できる?
      const response = await fetch('/api/refresh', {
        method: 'POST',
        credentials: 'include'
      })
      if (!response.ok) {
        response.json().then((data) => {
          console.log('Refresh token failed:', data);
        });
        await logout();
        return;
      }
      const {accessToken, expiresIn} = await response.json();
      await auth.signInWithCustomToken(accessToken);
      localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT, String(Date.now() + expiresIn * 1000));
      setUpAccessTokenRefresh();
    } catch (e) {
      console.error('Refresh token error:', e);
      await logout();
    }
  }

    // ログアウト関数
  const logout = async () => {
      try {
        if (window.accessTokenRefresher) {
          clearTimeout(window.accessTokenRefresher);
        }
        await auth.signOut();
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include'
        })
        localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT);
        deleteUserDataCache();
        await saveSession(null);
      } catch (error) {
        throw error;
      }
    };

  // ユーザーデータを取得する関数 (キャッシュを活用)
  const getUserData = async (uid, skipCache = false) => {
    // スキップ要求がなければキャッシュを確認
    if (!skipCache) {
      const cachedData = getUserDataFromCache(uid);
      if (cachedData) {
        console.log('Using cached user data');
        return cachedData;
      }
    }

    try {
      console.log('Fetching user data from Firestore');
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // キャッシュに保存
        saveUserDataToCache(uid, data);
        return data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const deleteUserDataCache = () => {
    try {
      localStorage.removeItem(USER_DATA_CACHE_KEY);
    } catch (error) {
      console.error('Cache deletion error:', error);
    }
  }

  // ユーザーデータを強制的に最新化する関数
  // 実質使ってない
  const refreshUserData = async () => {
    if (!user) return null;

    try {
      // キャッシュをスキップして最新データを取得
      const freshData = await getUserData(user.uid, true);
      setUserData(freshData);
      return freshData;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  };

  // 認証状態の監視
  useEffect(() => {
    // 認証状態の変更を監視
    const authStateUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // アプリ起動時、ログイン時、ログアウト時に呼ばれる
      console.log("Auth state changed:", currentUser);

      setUser(currentUser);

      if (currentUser) {
        // ユーザーデータを取得（ログイン状態）
        try {
          const data = await getUserData(currentUser.uid);
          setUserData(data);
        } catch (error) {
          console.error("Error fetching user data on auth change:", error);
        }
      } else {
        // ログアウト状態
        setUserData(null);
      }

      // Cookieが削除されていた時のためにセッションを保存
      // あくまでログイン状態はFirebaseの認証情報で管理
      await saveSession(currentUser)
      setLoading(false);
    });

      return () => {
        console.log("Cleaning up auth listeners");
        authStateUnsubscribe();
      };
    }, []
  );

    // コンテキスト値を最適化して生成
  const value = useMemo(() => ({
    user,
    userData, // ユーザーデータをコンテキストから直接利用可能に
    loading,
    signup,
    login,
    logout,
    refreshUserData // 必要時にのみデータを強制更新するための関数
  }), [user, userData, loading]);

  const style = {
    opacity: 0.5,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {
        loading || submitting
        ?(<div className="fixed inset-0 bg-gray-50 z-10" style={style}>
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          </div>)
          : null
      }
    </AuthContext.Provider>
  );
};