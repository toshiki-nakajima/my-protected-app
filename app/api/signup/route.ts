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

const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'welcome',
    'password123', '12345678', 'abc123', 'letmein', 'monkey'
];

const checkPasswordStrength = (password: string, options = {}) => {
    const defaults = {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        checkCommonPasswords: true
    };

    // Merge provided options with defaults
    const config = { ...defaults, ...options };

    // Check password against criteria
    const hasMinLength = password.length >= config.minLength;
    const hasUppercase = config.requireUppercase ? /[A-Z]/.test(password) : true;
    const hasLowercase = config.requireLowercase ? /[a-z]/.test(password) : true;
    const hasNumbers = config.requireNumbers ? /[0-9]/.test(password) : true;
    const hasSpecialChars = config.requireSpecialChars ? /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) : true;
    const isCommonPassword = config.checkCommonPasswords ?
        commonPasswords.includes(password.toLowerCase()) : false;

    // Calculate score (0-5)
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumbers) score++;
    if (hasSpecialChars) score++;
    // Deduct points for common password
    if (isCommonPassword) score = Math.max(0, score - 3);

    // Determine strength level
    let strength = 'Very Weak';
    if (score === 5) strength = 'Very Strong';
    else if (score === 4) strength = 'Strong';
    else if (score === 3) strength = 'Medium';
    else if (score === 2) strength = 'Weak';

    return {
        isValid: hasMinLength && hasUppercase && hasLowercase && hasNumbers && hasSpecialChars && !isCommonPassword,
        score,
        strength,
        details: {
            hasMinLength,
            hasUppercase,
            hasLowercase,
            hasNumbers,
            hasSpecialChars,
            isCommonPassword
        },
        feedback: generateFeedback({
            hasMinLength,
            hasUppercase,
            hasLowercase,
            hasNumbers,
            hasSpecialChars,
            isCommonPassword
        }, config.minLength)
    };
}

function generateFeedback(details: any, minLength: number) {
    const feedback = [];

    if (!details.hasMinLength) {
        feedback.push(`Password should be at least ${minLength} characters long.`);
    }

    if (!details.hasUppercase) {
        feedback.push('Include at least one uppercase letter (A-Z).');
    }

    if (!details.hasLowercase) {
        feedback.push('Include at least one lowercase letter (a-z).');
    }

    if (!details.hasNumbers) {
        feedback.push('Include at least one number (0-9).');
    }

    if (!details.hasSpecialChars) {
        feedback.push('Include at least one special character (e.g., !@#$%^&*).');
    }

    if (details.isCommonPassword) {
        feedback.push('This is a commonly used password. Please choose something more unique.');
    }

    return feedback;
}
