// lib/middleware/securityChecks.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateCSRFToken } from './csrf';

export function checkReferer(request: NextRequest) {
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");
    if (!referer || !host || !referer.includes(host)) {
        return NextResponse.json({success: false, error: "Invalid Referer"}, {status: 403});
    }
    return null; // 問題なし
}

export function checkCSRF(request: NextRequest) {
    const csrfCookie = request.cookies.get("csrf_token")?.value;
    const csrfHeader = request.headers.get("x-csrf-token");

    console.log(csrfCookie);
    console.log(csrfHeader);
    if (!csrfCookie || !csrfHeader) {
        return NextResponse.json({success: false, error: "No Csrf Token"}, {status: 403});
    }

    if (!validateCSRFToken(csrfHeader, csrfCookie)) {
        return NextResponse.json({success: false, error: "Invalid Csrf Token"}, {status: 403});
    }

    return null; // 問題なし
}