import { NextResponse } from 'next/server';
import { getDatabase, removeDuplicates } from '../../../../lib/database';

export async function POST(request) {
  try {
    const { password } = await request.json();
    
    if (password !== 'happyfood2024') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const result = await removeDuplicates();
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Admin cleanup error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Cleanup failed: ' + error.message 
    }, { status: 500 });
  }
} 
