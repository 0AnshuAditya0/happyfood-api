import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  console.log('[ADMIN API] Stats endpoint called');
  try {
    const body = await request.json();
    


    if (body.password !== 'happyfood2024') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    console.log('[ADMIN API] Database connected');
    const collection = db.collection('dishes');


    const [
      totalRecipes,
      byCountry,
      byDifficulty,
      avgCaloriesResult,
      topTags
    ] = await Promise.all([
      collection.countDocuments({}),
      collection.aggregate([
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
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
    const avgCalories = avgCaloriesResult.length > 0 ? Math.round(avgCaloriesResult[0].avg) : 0;
    const tagsList = topTags.map(t => t._id);



    const [missingImages, lowCalories, potentialDuplicatesCount] = await Promise.all([
      collection.countDocuments({ $or: [{ image: null }, { image: "" }] }),
      collection.countDocuments({ calories: { $lt: 50 } }),
      fs.promises.readFile(path.join(process.cwd(), 'data/logs/potential-duplicates.json'), 'utf8')
        .then(data => JSON.parse(data).length)
        .catch(() => 0) // File might not exist
    ]);


    let activityLog = [];
    try {
      const logContent = await fs.promises.readFile(path.join(process.cwd(), 'data/logs/activity.json'), 'utf8');
      activityLog = JSON.parse(logContent).slice(0, 20);
    } catch (e) {

    }

    return NextResponse.json({
      success: true,
      stats: {
        totalRecipes,
        byCountry: countryStats,
        byDifficulty: difficultyStats,
        avgCalories,
        topTags: tagsList,
        dataQuality: {
          missingImages,
          lowCalories,
          potentialDuplicates: potentialDuplicatesCount
        },
        recentActivity: activityLog
      }
    });

  } catch (error) {
    console.error('[ADMIN API] Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}
