import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        server: 'running',
        database: 'configured',
        ai: 'ready',
        automation: 'ready'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
