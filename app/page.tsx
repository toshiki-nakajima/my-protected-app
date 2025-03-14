"use client"
// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
//       <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={180}
//           height={38}
//           priority
//         />
//         <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
//           <li className="mb-2 tracking-[-.01em]">
//             Get started by editing{" "}
//             <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
//               app/page.tsx
//             </code>
//             .
//           </li>
//           <li className="tracking-[-.01em]">
//             Save and see your changes instantly.
//           </li>
//         </ol>

//         <div className="flex gap-4 items-center flex-col sm:flex-row">
//           <a
//             className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={20}
//               height={20}
//             />
//             Deploy now
//           </a>
//           <a
//             className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Read our docs
//           </a>
//         </div>
//       </main>
//       <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/file.svg"
//             alt="File icon"
//             width={16}
//             height={16}
//           />
//           Learn
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/window.svg"
//             alt="Window icon"
//             width={16}
//             height={16}
//           />
//           Examples
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/globe.svg"
//             alt="Globe icon"
//             width={16}
//             height={16}
//           />
//           Go to nextjs.org →
//         </a>
//       </footer>
//     </div>
//   );
// }

// app/page.tsx
// import React from 'react';
//
// export default function Home() {
//   return (
//     <div className="container mx-auto p-8 max-w-3xl">
//       <h1 className="text-3xl font-bold mb-4">保護されたページ</h1>
//       <p className="mb-6 text-gray-700">
//         このページはBasic認証で保護されています。認証に成功しました！
//       </p>
//
//       <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
//         <h2 className="text-xl font-semibold mb-3">認証情報</h2>
//         <p className="mb-3">以下の環境変数を使用して認証しています：</p>
//         <ul className="list-disc pl-6 space-y-2">
//           <li>
//             ユーザー名: <code className="bg-gray-200 px-2 py-1 rounded text-sm">process.env.BASIC_AUTH_USER</code>
//           </li>
//           <li>
//             パスワード: <code className="bg-gray-200 px-2 py-1 rounded text-sm">process.env.BASIC_AUTH_PASSWORD</code>
//           </li>
//         </ul>
//       </div>
//     </div>
//   );
// }
import React, { useRef, useState } from 'react';
import jsQR from 'jsqr';

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState('結果がここに表示されます');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const startScan = async () => {
    if (scanning) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setScanning(true);
      setVideoStream(stream);
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
    if (!scanning) return;

    setScanning(false);
    if (videoStream) {
      videoStream.getTracks().forEach((track) => {
        track.stop();
      });
      setVideoStream(null);
    }
    setResult('スキャンを停止しました');
  };

  const tick = () => {
    if (!scanning || !videoRef.current) return;

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

          if (code.data.startsWith('http')) {
            window.open(code.data, '_blank');
          }

          stopScan();
          return;
        }
      }
    }

    requestAnimationFrame(tick);
  };

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">QR/バーコードリーダー</h1>
      <p className="mb-6 text-gray-700">カメラを使ってQRコードやバーコードを読み取ります</p>

      <div id="video-container" className="mb-4">
        <video id="qr-video" ref={videoRef} className="w-full max-w-md border-3 border-gray-300 rounded-lg" playsInline></video>
      </div>

      <div className="mb-4">
        <button onClick={startScan} disabled={scanning} className="bg-green-500 text-white py-2 px-4 rounded mr-2">
          スキャン開始
        </button>
        <button onClick={stopScan} disabled={!scanning} className="bg-gray-500 text-white py-2 px-4 rounded">
          スキャン停止
        </button>
      </div>

      <div id="result" className="p-4 bg-gray-100 rounded shadow-sm">{result}</div>
    </div>
  );
}