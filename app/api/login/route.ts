import {NextRequest, NextResponse} from 'next/server';
import {cookies} from "next/headers";
import {db, auth, admin} from '../../fireadmin/config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
    try {
        const {id, password} = await req.json();
        console.log('login request received:', id, password);
        const result = await validateAndGetUser(id, password);
        if (result.type === 'failure') {
            console.log(result);
            return NextResponse.json({
                success: false,
                message: result.message,
            }, {status: 401});
        }
        const userData = result.data;
        const docId = userData.docId;
        const accessToken = await auth.createCustomToken(docId);

        const refreshToken = generateRefreshToken(docId);
        // Save the refresh token to Firestore
        // todo: jwtの保存にTTLをつけたい
        await db.collection('refreshTokens').doc(docId).set({
            token: refreshToken,
            createAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Set the refresh token to the cookie
        const cookie = await cookies()
        cookie.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: getEndOfTheDate(),
            path: `/`
        });

        return NextResponse.json({
            success: true,
            accessToken,
            expiresIn: 3600
        }, {status: 200});
    } catch(e) {
        console.error(e);
        return NextResponse.json({
            success: false,
            message: 'Internal Server Error'
        }, {status: 500});
    }
}

interface Success {
    type: 'success',
    data: any, // todo: ここも型をちゃんと定義したい
}
interface Failure {
    type: 'failure',
    message: string,
    data: null,
}
type ValidationResult = Success | Failure;
// todo: 責務が二つになってるが考えるのがめんどくさかった。分割したい。
const validateAndGetUser = async (id: string, password: string):Promise<ValidationResult> => {
    try {
        const userSnapshot = await db.collection('users').where('id', '==', id).limit(1).get();
        if (userSnapshot.empty) {
            return {
                type: 'failure',
                message: 'IDが正しくありません',
                data: null

            }
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();

        // Check the password
        const isMatched = bcrypt.compareSync(password, userData.password);
        if (!isMatched) {
            return {
                type: 'failure',
                message: 'パスワードが正しくありません',
                data: null
            }
        }
        const data = {
            docId: userDoc.id, // ドキュメントIDを追加
            ...userData
        }
        return {
            type: 'success',
            data
        }
    } catch (e) {
        console.error("error while validating user", e);
        throw e;
    }
}

const generateRefreshToken = (userDocId: string) => {
    const now = new Date();
    const endOfTheDate = getEndOfTheDate();
    const expiresIn = Math.floor((endOfTheDate.getTime() - now.getTime()) / 1000); // 秒単位
    const payload = {
        refreshTokenDocId: userDocId,
        type: 'refresh',
    }
    const options = {
        expiresIn,
    }
    const jwtSecret = process.env.REFRESH_TOKEN_SECRET as string;
    return jwt.sign(payload, jwtSecret, options);
}

const getEndOfTheDate = () => {
    const endOfTheDay = new Date();
    endOfTheDay.setHours(23, 59, 59, 999);
    return endOfTheDay;
}
