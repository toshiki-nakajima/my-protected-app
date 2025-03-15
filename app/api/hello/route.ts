import {NextRequest, NextResponse} from 'next/server';

export async function GET(request: NextRequest) {
    console.log('GET request received');
    return NextResponse.json({message: 'Hello API'});
}

interface RequestedBodyFromClient {
    uid: string;
    points: number;
    timestamp: string;
}
interface BodyToRequestForOpenApi {
    uid: string;
    params: ParamsForOpenApi;
}
interface ParamsForOpenApi {
    points: number;
}
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // Process the data
        return NextResponse.json({
            success: true,
            data: body,
            receivedAt: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json(
            {success: false, error: 'Invalid request body'},
            {status: 400}
        );
    }
}