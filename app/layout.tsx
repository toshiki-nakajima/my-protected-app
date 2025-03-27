import {AuthProvider} from "@/app/context/AuthContext";
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from "react";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '保護されたアプリ',
  description: 'Next.js App Routerとfireauthで保護されたアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <main className="min-h-screen bg-white">
          <AuthProvider>{children}</AuthProvider>
        </main>
      </body>
    </html>
  );
}