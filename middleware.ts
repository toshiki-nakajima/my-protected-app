// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import {generateCSRFToken} from "@/app/lib/middleware/csrf";
import {checkCSRF, checkReferer} from "@/app/lib/middleware/securityCheck";

export function middleware(request: NextRequest) {

  const nextWithCSRFToken = () => {
    const res = NextResponse.next();
    const csrfToken = request.cookies.get('csrf_token')?.value;
    if (!csrfToken) {
      const csrfToken = generateCSRFToken();
      res.cookies.set("csrf_token", csrfToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: '/'
      })
    }
    return res;
  }

  // APIリクエストの場合はリファラーチェックとCSRFチェックを行う
  if (request.nextUrl.pathname.startsWith('/api/') && request.method !== 'GET') {
    // リファラーチェック
    const refererError = checkReferer(request);
    if (refererError) return refererError;

    // CSRFチェック
    const csrfError = checkCSRF(request);
    if (csrfError) return csrfError;

    return NextResponse.next()
  }

  // セッションクッキーを確認
  const session = request.cookies.get('session');
  const userId = request.cookies.get('user_id');
  const isAuthenticated = session && userId;


  // ログイン済みのユーザーは /login や /signup にアクセスできないようにする
  if (isAuthenticated && (request.nextUrl.pathname === '/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 未ログインユーザーが保護されたルートにアクセスしようとした場合はログインページにリダイレクト
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];

  if (!isAuthenticated && protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Basic認証のヘッダーを確認
  const authHeader = request.headers.get('authorization');

  // members(従業員)の閲覧、登録、編集、削除画面にのみBasic認証を適用
  //  members/list, members/signup, members/edit, members/delete
  if (request.nextUrl.pathname.startsWith('/members')) {
    if (authHeader) {
      // Basic認証のヘッダーをデコード
      const auth = authHeader.split(' ')[1];
      const [user, pwd] = Buffer.from(auth, 'base64').toString().split(':');

      // 環境変数から認証情報を取得
      const USERNAME = process.env.BASIC_AUTH_USER;
      const PASSWORD = process.env.BASIC_AUTH_PASSWORD;

      // 認証情報が一致する場合はリクエストを通す
      if (user === USERNAME && pwd === PASSWORD) {
        return nextWithCSRFToken();
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
  return nextWithCSRFToken();
}

// 特定のパスのみにミドルウェアを適用する場合
export const config = {
  matcher: [
    // 保護したいパスを指定
    // public, _nextなどは除外する
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};