import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET(request, { params }) {
  const { id } = params;

  try {
    const db = await getDatabase();
    const collection = db.collection('dishes');

    const recipe = await collection.findOne({ id });

    if (!recipe) {
      // Try to find by _id if id param looks like ObjectId (legacy/fallback)
      // or if user passed ObjectId string. 
      // But we strictly use 'id' string field (e.g. themealdb-123).
      return NextResponse.json(
        { success: false, error: "Recipe not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: recipe
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' // 1 hour cache
      }
    });

  } catch (error) {
    console.error('[API Error] Fetch Recipe:', error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}