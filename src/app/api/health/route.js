import { NextResponse } from 'next/server';
import { connectToDatabase, getDatabase, isDatabaseConnected } from '../../../lib/database';

export async function GET() {
    try {

        try {
            getDatabase();
        } catch (error) {

            await connectToDatabase();
        }
        
        return NextResponse.json({ 
            status: 'ok', 
            db: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("❌ Health check failed:", error);
        return NextResponse.json({ 
            status: 'error', 
            db: 'not connected', 
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 503 });
    }
} 
