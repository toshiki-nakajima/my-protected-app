import {NextRequest, NextResponse} from "next/server";
import {db} from "../../fireadmin/config";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
    try {
        const {id, password, profileData} = await request.json();
        const result = register(id, password, profileData);
        if (!result) {
            return NextResponse.json({message: 'signup failed'}, {status: 400});
        }
        return NextResponse.json({success: true}, {status: 200});
    } catch (e) {
        console.error("signup failed", e);
        return NextResponse.json({message: 'Internal Server Error'}, {status: 500});
    }
}

//todo: interface for profileData
const register = async (id: string, password: string, profileData: Object) => {
    const uid = await generateUUID();

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    db.collection('users').where('id', '==', id).get()
        .then((querySnapShot) => {
            if (!querySnapShot.empty) {
                throw new Error('id already exists');
            }
        });
    const userdata = {
        id: id,
        password: hashedPassword,
        ...profileData,
        createdAt: new Date().toLocaleString("ja-JP", {timeZone: "Asia/Tokyo"}),
        updatedAt: new Date().toLocaleString("ja-JP", {timeZone: "Asia/Tokyo"})
    };

    // firestoreに保存
    await db.collection('users').doc(uid).set(userdata);

    return true;
}

const generateUUID = async () => {
    const UUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    if (await isUserDocumentIDExists(UUID)) {
        // すでに存在する場合は再生成
        return generateUUID();
    }
    return UUID;
}

const isUserDocumentIDExists = async (uid: string) => {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        return userDoc.exists;
    } catch (e) {
        console.error('Error checking user', e);
        throw e;
    }
}
