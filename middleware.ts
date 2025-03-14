// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Basic認証のヘッダーを確認
  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    // Basic認証のヘッダーをデコード
    const auth = authHeader.split(' ')[1];
    const [user, pwd] = Buffer.from(auth, 'base64').toString().split(':');

    // 環境変数から認証情報を取得
    const USERNAME = process.env.BASIC_AUTH_USER;
    const PASSWORD = process.env.BASIC_AUTH_PASSWORD;

    // 認証情報が一致する場合はリクエストを通す
    if (user === USERNAME && pwd === PASSWORD) {
      return NextResponse.next();
    }
  }

  // 認証失敗時のレスポンス
  return new NextResponse('認証が必要です', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// 特定のパスのみにミドルウェアを適用する場合
export const config = {
  matcher: [
    // 保護したいパスを指定
    // public, _nextなどは除外する
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};