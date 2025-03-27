import {NextRequest, NextResponse} from 'next/server';
import {validateCSRFToken} from "@/app/libs/csrf";

export async function GET(request: NextRequest) {
    console.log('GET request received');
    return NextResponse.json({message: 'Hello API'});
}

export async function POST(req: NextRequest) {
    console.log("hello");
    // referer check
    const referer = req.headers.get("referer");
    const host = req.headers.get("host");
    if (!referer || !host || !referer.includes(host)) {
        return NextResponse.json({success: false, error: "Invalid Referer"}, {status: 403});
    }

    // csrf check
    const csrfCookie = req.cookies.get("csrf_token")?.value;
    const csrfHeader = req.headers.get("x-csrf-token");
    if (!csrfCookie || !csrfHeader) {
        return NextResponse.json({success: false, error: "No Csrf Token"}, {status: 403});
    }
    if (!validateCSRFToken(csrfHeader, csrfCookie)) {
        return NextResponse.json({success: false, error: "Invalid Csrf Token"}, {status: 403});
    }

    try {
        const body = await req.json();
        console.log(body);
        return NextResponse.json({
            success: true,
            data: body
        }, {status: 200});
    } catch (error) {
        console.log(error);
        return NextResponse.json({success: false, error: "Invalid Request"}, {status:400});
    }
}