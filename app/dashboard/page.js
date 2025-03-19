'use client';

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, userData, logout, refreshUserData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // ユーザーデータの強制更新
  const handleRefreshData = async () => {
    setRefreshing(true);
    await refreshUserData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          ログアウト
        </button>
      </div>

      {userData ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">ユーザー情報</h2>
            {/*<button*/}
            {/*  onClick={handleRefreshData}*/}
            {/*  disabled={refreshing}*/}
            {/*  className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"*/}
            {/*>*/}
            {/*  {refreshing ? '更新中...' : 'データを更新'}*/}
            {/*</button>*/}
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <p><strong>名前:</strong> {userData.name}</p>
            <p><strong>メールアドレス:</strong> {userData.email}</p>
            <p><strong>ユーザーID:</strong> {userData.uid}</p>
            <p><strong>登録日:</strong> {new Date(userData.createdAt).toLocaleString('ja-JP')}</p>
            {userData.cachedAt && (
              <p className="text-xs text-gray-500 mt-2">
                データ取得日時: {new Date(userData.cachedAt).toLocaleString('ja-JP')}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p>ユーザーデータが見つかりません。</p>
      )}
    </div>
  );
}