import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection('dishes');

    const [
      totalDishes,
      byCountry,
      byDifficulty,
      avgCaloriesResult,
      categoriesResult
    ] = await Promise.all([
      collection.countDocuments({}),
      collection.aggregate([
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 } // Top 15 countries
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: "$difficulty", count: { $sum: 1 } } }
      ]).toArray(),
      collection.aggregate([
        { $group: { _id: null, avg: { $avg: "$calories" } } }
      ]).toArray(),

      collection.aggregate([
         { $unwind: "$tags" },
         { $group: { _id: "$tags", count: { $sum: 1 } } },
         { $sort: { count: -1 } },
         { $limit: 10 }
      ]).toArray()
    ]);


    const countryStats = byCountry.reduce((acc, curr) => ({ ...acc, [curr._id || 'Unknown']: curr.count }), {});
    const difficultyStats = byDifficulty.reduce((acc, curr) => ({ ...acc, [curr._id || 'Unknown']: curr.count }), {});
    const avgCalories = avgCaloriesResult.length > 0 ? avgCaloriesResult[0].avg : 0;
    

    const byCategory = categoriesResult.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});
    const topCategories = categoriesResult.slice(0, 5).map((c, i) => ({
        name: c._id, 
        count: c.count, 
        score: Math.min(100, Math.round((c.count / totalDishes) * 500)) // Arbitrary "resonance" score logic
    }));


    const trendData = [45, 52, 38, 65, 48, 59, 63]; 
    const recentCount = 63; // Last day's mock count

    return NextResponse.json({
      success: true,
      stats: {
        totalDishes,
        totalCountries: byCountry.length,
        totalCategories: categoriesResult.length,
        avgCalories,
        byCountry: countryStats,
        byDifficulty: difficultyStats,
        byCategory,
        topCategories,
        trendData,
        recentCount
      }
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}
