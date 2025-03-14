"use client"
import React, {useEffect, useRef, useState} from 'react';
import jsQR from 'jsqr';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanningRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const [result, setResult] = useState('結果がここに表示されます');
  const scannedUid = useRef<string | null>(null);
  const [pointToAdd, setPointToAdd] = useState<number>(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const startScan = async () => {
    if (scanningRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
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
      console.error('カメラへのアクセスに失敗しました: ', error);
      setResult('エラー: カメラへのアクセスに失敗しました。');
    }
  };

  const stopScan = () => {
    if (!scanningRef.current) return;

    scanningRef.current = false;
    setScanning(false);
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      videoStreamRef.current = null;
    }
    // setResult('スキャンを停止しました');
  };

  const tick = () => {
    if (!scanningRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const canvasElement = document.createElement('canvas');
    const canvas = canvasElement.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvasElement.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      canvas?.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

      const imageData = canvas?.getImageData(0, 0, canvasElement.width, canvasElement.height);
      if (imageData) {
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          console.log('QRコードを検出しました', code);
          setResult(`検出内容: ${code.data}`);

          // if (code.data.startsWith('http')) {
          //   window.open(code.data, '_blank');
          // }
          scannedUid.current = code.data;

          stopScan();
          return;
        }
      }
    }

    requestAnimationFrame(tick);
  };

  useEffect(() => {
    const input = inputRef.current;
    const preventKeydown = (e: KeyboardEvent) => {
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

  const inputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const point = Number(e.target.value);
    setPointToAdd(point);
  }

  const submitHandler = () => {
    if (!scannedUid.current) {
        console.log('QRコードを読み取ってください');
        setResult('QRコードを読み取ってください');
        return;
    }
    console.log('ポイントを追加: ', pointToAdd);
    setResult(`ポイントを追加: ${pointToAdd}P`);
  }
  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">QR/バーコードリーダー</h1>
      <p className="mb-6 text-gray-700">カメラを使ってQRコードやバーコードを読み取ります</p>

      <div id="video-container" className="mb-4">
        <video id="qr-video" ref={videoRef} className="w-full max-w-md border-3 border-gray-300 rounded-lg" playsInline></video>
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

      <div id="result" className="mb-4 p-4 bg-gray-100 rounded shadow-sm">{result}</div>

      <div className="mb-4 flex gap-1 items-center">
        <span>追加するポイント</span>
        <input className="border-3 border-gray-400 p-1 rounded-md" ref={inputRef} onInput={inputHandler} type="number" value={pointToAdd} min="1" max="10"/>
        <span>P</span>
      </div>

      <div className="mb-4">
        <button className="bg-blue-500 text-white py-2 px-4 rounded" onClick={submitHandler}>ポイント追加</button>
      </div>

    </div>
  );
}