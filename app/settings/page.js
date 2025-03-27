'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Settings() {
  // 使うことを想定してないのでコメントアウト
  // const { user, userData, refreshUserData } = useAuth();
  // const [name, setName] = useState('');
  // const [saving, setSaving] = useState(false);
  // const [message, setMessage] = useState({ type: '', text: '' });
  // const router = useRouter();
  //
  // // ユーザーデータをフォームにセット
  // useEffect(() => {
  //   if (userData) {
  //     setName(userData.name || '');
  //   }
  // }, [userData]);
  //
  // // ユーザー設定の更新
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setSaving(true);
  //   setMessage({ type: '', text: '' });
  //
  //   try {
  //     // Firestoreにデータを更新
  //     await updateDoc(doc(db, 'users', user.uid), {
  //       name,
  //       updatedAt: new Date().toISOString()
  //     });
  //
  //     // 最新データを取得（キャッシュもこの時点で更新される）
  //     await refreshUserData();
  //
  //     setMessage({
  //       type: 'success',
  //       text: 'プロフィールを更新しました。'
  //     });
  //   } catch (error) {
  //     console.error('Update error:', error);
  //     setMessage({
  //       type: 'error',
  //       text: '更新に失敗しました。' + error.message
  //     });
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">ユーザー設定</h1>

      {/*{message.text && (*/}
      {/*  <div className={`p-4 mb-4 rounded ${*/}
      {/*    message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'*/}
      {/*  }`}>*/}
      {/*    {message.text}*/}
      {/*  </div>*/}
      {/*)}*/}

      {/*<form onSubmit={handleSubmit}>*/}
      {/*  <div className="mb-4">*/}
      {/*    <label className="block text-gray-700 mb-2" htmlFor="name">*/}
      {/*      名前*/}
      {/*    </label>*/}
      {/*    <input*/}
      {/*      id="name"*/}
      {/*      type="text"*/}
      {/*      value={name}*/}
      {/*      onChange={(e) => setName(e.target.value)}*/}
      {/*      className="w-full px-3 py-2 border border-gray-300 rounded"*/}
      {/*      required*/}
      {/*    />*/}
      {/*  </div>*/}

      {/*  <div className="flex space-x-4">*/}
      {/*    <button*/}
      {/*      type="submit"*/}
      {/*      disabled={saving}*/}
      {/*      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"*/}
      {/*    >*/}
      {/*      {saving ? '保存中...' : '保存する'}*/}
      {/*    </button>*/}

      {/*    <button*/}
      {/*      type="button"*/}
      {/*      onClick={() => router.push('/dashboard')}*/}
      {/*      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"*/}
      {/*    >*/}
      {/*      キャンセル*/}
      {/*    </button>*/}
      {/*  </div>*/}
      {/*</form>*/}
    </div>
  );
}