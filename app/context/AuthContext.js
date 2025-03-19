'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  onIdTokenChanged,
  getIdToken
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import Cookies from 'js-cookie';

const USER_DATA_CACHE_KEY = 'cachedUserData'
const COOKIE_EXPIRES = 14;

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
  getUserData: async () => Promise.resolve(),
  refreshUserData: async () => Promise.resolve()
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveSession = async (currentUser) => {
    if (currentUser) {
      const token = await getIdToken(currentUser);

      Cookies.set('session', token, {
        expires: COOKIE_EXPIRES,
        secure: process.env.NODE_ENV === 'production',
        samiSite: 'Lax'
      })

      Cookies.set('user_id', currentUser.uid, {
        expires: COOKIE_EXPIRES,
        secure: process.env.NODE_ENV === 'production',
        samiSite: 'Lax'
      })
      return;
    }
    Cookies.remove('session');
    Cookies.remove('user_id');
  };

  // ユーザー登録関数
  const signup = async (email, password, profileData) => {
    try {
      // ユーザー作成
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // ユーザーデータを構築
      const userData = {
        uid: newUser.uid,
        email: newUser.email,
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Firestoreに保存
      await setDoc(doc(db, 'users', newUser.uid), userData);

      // キャッシュは作成しない - onAuthStateChangedイベント時に取得される

      return newUser;
    } catch (error) {
      throw error;
    }
  };

  // ログイン関数
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      // ログイン時にユーザーデータを取得 (すでにキャッシュがあれば使用)
      const data = await getUserData(result.user.uid);
      setUserData(data);

      return result.user;
    } catch (error) {
      throw error;
    }
  };

  // ログアウト関数
  const logout = async () => {
    try {
      await signOut(auth);
      await saveSession(null);
      setUserData(null);
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

  // ユーザーデータを強制的に最新化する関数
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
    console.log("Setting up auth state listener");

    // 認証状態の変更を監視
    const authStateUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed:", currentUser?.email);

      setUser(currentUser);

      if (currentUser) {
        // ユーザーデータを取得（ログイン時）
        try {
          const data = await getUserData(currentUser.uid);
          setUserData(data);
        } catch (error) {
          console.error("Error fetching user data on auth change:", error);
        }
      } else {
        // ログアウト時
        setUserData(null);
      }

      setLoading(false);
    });

    // トークン変更の監視（より効率的なトークン更新方法）
    const tokenUnsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser) {
        // トークンが変更されたらCookieを更新
        try {
          await saveSession(currentUser);
        } catch (error) {
          console.error("Token update error:", error);
        }
      } else {
        // ユーザーがnullになった場合（ログアウト時など）
        Cookies.remove('session');
        Cookies.remove('user_id');
      }
    });

    return () => {
      console.log("Cleaning up auth listeners");
      authStateUnsubscribe();
      tokenUnsubscribe();
    };
  }, []);

  // コンテキスト値を最適化して生成
  const value = useMemo(() => ({
    user,
    userData, // ユーザーデータをコンテキストから直接利用可能に
    loading,
    signup,
    login,
    logout,
    getUserData,
    refreshUserData // 必要時にのみデータを強制更新するための関数
  }), [user, userData, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};