import {NextResponse} from 'next/server';
import {cookies} from "next/headers";
import {db, auth} from '../../fireadmin/config';
import jwt from 'jsonwebtoken';

export async function POST() {
    try {
        const cookie = await cookies();
        const refreshToken = cookie.get('refreshToken');
        if (!refreshToken) {
            return NextResponse.json({
                success: false,
                message: 'Invalid refresh token: cannot find the token in the cookie'
            }, {status: 401});
        }

        const jwtSecret = process.env.REFRESH_TOKEN_SECRET as string;
        let decoded;
        try {
            // @ts-ignore
            decoded = jwt.verify(refreshToken, jwtSecret);
        } catch (err) {
            console.error("Invalid refresh token when verifying", err);
            return NextResponse.json({
                success: false,
                message: 'Invalid refresh token when verifying'
            }, {status: 401});
        }
        const refreshTokenDocId = (decoded as any).refreshTokenDocId;
        const refreshTokenDoc = await db.collection('refreshTokens').doc(refreshTokenDocId).get();
        if (!refreshTokenDoc.exists) {
            return NextResponse.json({
                success: false,
                message: 'Invalid refresh token: cannot find the refresh token'
            }, {status: 401});
        }
        const refreshTokenData = refreshTokenDoc.data();
        const isMatched = refreshToken === refreshTokenData?.token;
        if (!isMatched) {
            return NextResponse.json({
                success: false,
                message: 'Invalid refresh token: token is not matched'
            }, {status: 401});
        }
        const userDocID = refreshTokenDocId;
        const userDoc = await db.collection('users').doc(userDocID).get();
        if (!userDoc.exists) {
            // ユーザが削除されてたらrefreshTokenも削除
            await db.collection('refreshTokens').doc(refreshTokenDocId).delete();
            cookie.delete('refreshToken');
            return NextResponse.json({
                success: false,
                message: 'Invalid user: user is deleted'
            }, {status: 401});
        }
        const accessToken = await auth.createCustomToken(userDocID);
        return NextResponse.json({
            success: true,
            accessToken,
            expiresIn: 3600
        }, {status: 200});
    } catch (e) {
        console.error("internal server error", e);
        return NextResponse.json({
            success: false,
            message: 'Internal Server Error'
        }, {status: 500});
    }
}