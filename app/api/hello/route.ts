import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello API' });
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
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}