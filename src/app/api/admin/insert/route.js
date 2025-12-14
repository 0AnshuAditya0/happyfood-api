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
    

    let dishes = [];
    const possibleFiles = ['dishes.json', 'bulky1.json', 'dishes_clean.json'];
    
    for (const filename of possibleFiles) {
      try {
        const filePath = path.join(process.cwd(), filename);
        if (fs.existsSync(filePath)) {
          dishes = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          break;
        }
      } catch (error) {
        console.log(`Could not read ${filename}:`, error.message);
      }
    }
    
    if (dishes.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No valid data file found' 
      }, { status: 400 });
    }
    

    const operations = dishes.map(dish => ({
      updateOne: {
        filter: { id: dish.id },
        update: { $set: dish },
        upsert: true
      }
    }));
    
    const result = await db.collection('dishes').bulkWrite(operations);
    
    return NextResponse.json({
      success: true,
      message: 'Data inserted successfully',
      data: {
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        total: result.upsertedCount + result.modifiedCount,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Admin insert error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Insert failed: ' + error.message 
    }, { status: 500 });
  }
} 
