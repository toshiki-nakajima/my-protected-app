import {NextRequest, NextResponse} from "next/server";

export async function GET(req: NextRequest) {
    const csrfToken = req.cookies.get("csrf_token")?.value;
    return NextResponse.json({csrfToken}, {status: 200});
}