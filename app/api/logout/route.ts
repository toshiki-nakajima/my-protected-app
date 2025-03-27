import {NextResponse} from 'next/server';
import {cookies} from "next/headers";
import {db} from '../../fireadmin/config';
import jwt from 'jsonwebtoken';

export async function POST() {
    try {
        const cookie = await cookies();
        const refreshToken = cookie.get('refreshToken');
        if (!refreshToken) {
            return NextResponse.json({
                success: false,
                message: 'Invalid refresh token: cannot find the token in the cookie'
            })
        }
        let decoded;
        try {
            const jwtSecret = process.env.REFRESH_TOKEN_SECRET as string;
            // @ts-ignore
            decoded = jwt.verify(refreshToken.value, jwtSecret);
        } catch (e) {
            console.error('Invalid refresh token when verifying', e);
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
        // refresh tokenの削除
        await db.collection('refreshTokens').doc(refreshTokenDocId).delete();
        cookie.delete('refreshToken');
        return NextResponse.json({
            success: true,
        }, {status: 200});
    } catch (e) {
        console.error("internal server error",e);
        return NextResponse.json({
            success: false,
            message: 'Internal Server error'
        }, {status: 500});
    }
}