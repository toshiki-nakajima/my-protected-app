'use client';

import React, {useState, useRef, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '../context/AuthContext';
import jsQR from 'jsqr';

export default function Dashboard() {
  const {user, userData, logout, refreshUserData} = useAuth();
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

  const videoRef = useRef(null);
  const scanningRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const videoStreamRef = useRef(null);
  const [result, setResult] = useState("結果がここに表示されます");
  const scannedUid = useRef(null);
  const [pointToAdd, setPointToAdd] = useState(1);
  const inputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);

  const startScan = async () => {
    if (scanningRef.current) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'environment'}
      })
      scanningRef.current = true;
      setScanning(true);
      videoStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setResult("エラー: カメラのアクセスに失敗しました");
      scanningRef.current = false;
      setScanning(false);
    }

  }

  const stopScan = () => {
    if (!scanningRef.current) return;

    scanningRef.current = false;
    setScanning(false);

    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
    }
    videoStreamRef.current = null;
  }

  const tick = () => {
    if (!scanningRef.current || !videoRef.current) return;
    const canvasElement = document.createElement('canvas');
    const canvas = canvasElement.getContext('2d');
    const video = videoRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvasElement.width = video.videoWidth;
      canvasElement.height = video.videoHeight;
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);

      if (imageData) {
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code) {
          console.log('QR code detected:', code);
          setResult(`検出内容: ${code.data}`);
          scannedUid.current = code.data;

          stopScan();
          return;
        }
      }
    }

    setTimeout(() => {
      requestAnimationFrame(tick);
    }, 100)
  }

  useEffect(() => {
    const input = inputRef.current;
    const preventKeydown = (e) => {
      e.preventDefault();
    }
    if (input) {
      input.addEventListener('keydown', preventKeydown);
    }
    return () => {
      if (input) {
        input.removeEventListener('keydown', preventKeydown);
      }
    }
  }, []);

  const inputHandler = (e) => {
    const point = Number(e.target.value);
    setPointToAdd(point);
  }

  const addOnePointHandler = () => {
    setPointToAdd(pointToAdd + 1);
  }

  const removeOnePointHandler = () => {
    setPointToAdd(pointToAdd - 1);
  }

  const getFormattedJST = () => {
    return new Date().toLocaleString(
      "ja-JP",
      {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }
    ).replace(/\//g, '-');
  }

  const submitHandler = async () => {
    if (!scannedUid.current) {
      console.log('QRコードを読み取ってください');
      setResult('QRコードを読み取ってください');
      return;
    }

    setIsSubmitting(true);
    setResult('送信中...');

    try {
      // Create data object to send
      const postData = {
        uid: scannedUid.current,
        points: pointToAdd,
        timestamp: getFormattedJST()
      };
      console.log('Sending data:', postData);

      // Make POST request to our local API endpoint
      const response = await fetch('/api/hello', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response:', data);

      // Set success message
      setApiResponse(JSON.stringify(data, null, 2));
      setResult(`ポイント ${pointToAdd}P を追加しました！`);

      // スキャン済みのUIDをクリア
      scannedUid.current = null;
      // ポイント追加フォームをリセット
      setPointToAdd(1);
    } catch (error) {
      console.error('送信エラー:', error);
      setResult(`エラー: ポイント追加に失敗しました`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">QR/バーコードリーダー</h1>
          <p className="mb-6 text-gray-700">カメラを使ってQRコードやバーコードを読み取ります</p>
        </div>


        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          ログアウト
        </button>
      </div>

      <div id="video-container" className="mb-4">
        <video id="qr-video" ref={videoRef} className="w-full max-w-md border-3 border-gray-300 rounded-lg"
               playsInline></video>
      </div>

      <div className="mb-4 flex">
        <button onClick={startScan} disabled={scanning} className="bg-green-500 text-white py-2 px-4 rounded mr-2">
          スキャン開始
        </button>
        <button onClick={stopScan} disabled={!scanning} className="bg-gray-500 text-white py-2 px-4 rounded">
          スキャン停止
        </button>
        {scanningRef.current && <div className="recording-mark m-4 w-4 h-4 bg-red-500 rounded-full"></div>}
      </div>

      <div id="result" className="mb-4 p-4 bg-gray-100 rounded shadow-sm text-black">{result}</div>

      <div className="mb-4 flex gap-1 items-center text-black">
        <span>追加するポイント</span>
        <input className="border-3 border-gray-400 p-1 rounded-md" ref={inputRef} onInput={inputHandler} type="number"
               value={pointToAdd} min="1" max="10"/>
        <span>P</span>
      </div>

      <div className="mb-4 flex justify-between items-center text-black">
        <button
          className={`py-2 px-4 rounded ${isSubmitting ? 'bg-gray-400' : scannedUid.current ? 'bg-blue-500' : 'bg-gray-400'} text-white`}
          onClick={submitHandler}
          disabled={isSubmitting || !scannedUid.current}
        >
          {isSubmitting ? '送信中...' : 'ポイント追加'}
        </button>

        <div className="flex gap-2">
          <button
            className={`py-2 px-4 rounded ${isSubmitting ? 'bg-gray-400' : scannedUid.current ? 'bg-blue-500' : 'bg-gray-400'} text-white`}
            onClick={addOnePointHandler} disabled={isSubmitting || !scannedUid.current}>
            +1
          </button>
          <button
            className={`py-2 px-4 rounded ${isSubmitting ? 'bg-gray-400' : scannedUid.current ? 'bg-blue-500' : 'bg-gray-400'} text-white`}
            onClick={removeOnePointHandler} disabled={isSubmitting || !scannedUid.current}>
            -1
          </button>
        </div>
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
            <p><strong>ID:</strong> {userData.id}</p>
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