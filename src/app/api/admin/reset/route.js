import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/database';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { password } = await request.json();
    
    if (password !== 'happyfood2024') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    

    const dishesPath = path.join(process.cwd(), 'dishes.json');
    const dishes = JSON.parse(fs.readFileSync(dishesPath, 'utf-8'));
    

    await db.collection('dishes').deleteMany({});
    

    const result = await db.collection('dishes').insertMany(dishes);
    
    return NextResponse.json({
      success: true,
      message: 'Database reset successfully',
      data: {
        inserted: result.insertedCount,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Admin reset error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Reset failed: ' + error.message 
    }, { status: 500 });
  }
} 
