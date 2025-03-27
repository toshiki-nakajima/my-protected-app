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
    console.log('POST request received');
    try {
        const body = await request.json();
        console.log('POST request body:', body);

        const openApiActionBasePath = process.env.OPEN_API_ACTION_BASE_PATH;
        const openApiCode = process.env.OPEN_API_CODE
        const openApiTriggerOfAddingPoints = process.env.OPEN_API_TRIGGER_OF_ADDING_POINTS;
        const postUrl = `${openApiActionBasePath}/${openApiCode}/${openApiTriggerOfAddingPoints}`;
        const openApiToken = process.env.OPEN_API_TOKEN;
        // Process the data
        const {uid, points} = body as RequestedBodyFromClient;
        const bodyToRequest: BodyToRequestForOpenApi = {
            uid,
            params: {
                points
            }
        }

        await fetch(postUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openApiToken}`
            },
            body: JSON.stringify(bodyToRequest)
        }).then(res => {
            console.log(res);
            // firestoreのhistoryコレクションに保存
        }).catch(err => {
            console.error(err);
        })


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