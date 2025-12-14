import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/database';

export async function POST(request) {
  try {
    const { password } = await request.json();
    
    if (password !== 'happyfood2024') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    

    const result = await db.collection('dishes').deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: 'All data deleted successfully',
      data: {
        deletedCount: result.deletedCount,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Admin delete-all error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Delete failed: ' + error.message 
    }, { status: 500 });
  }
} 
