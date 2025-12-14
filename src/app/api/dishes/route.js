import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { log } from '@/lib/activity-logger';

export async function GET(request) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);


  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search');
  const country = searchParams.get('country');
  const difficulty = searchParams.get('difficulty');
  const maxCalories = parseInt(searchParams.get('maxCalories') || '0');
  const dietary = searchParams.get('dietary');
  const sortParam = searchParams.get('sort');
  const detailed = searchParams.get('detailed') === 'true';

  try {
    const db = await getDatabase();
    const collection = db.collection('dishes');


    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (country) {
      query.country = country;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (maxCalories > 0) {
      query.calories = { $lte: maxCalories };
    }

    if (dietary) {

      query.dietaryInfo = dietary;
    }


    const skip = (page - 1) * limit;


    let sort = {};
    if (search) {

      sort = { score: { $meta: "textScore" } };
    } else if (sortParam) {

      const field = sortParam.startsWith('-') ? sortParam.substring(1) : sortParam;
      const order = sortParam.startsWith('-') ? -1 : 1;
      sort[field] = order;
    } else {

      sort = { id: 1 };
    }


    let projection = {};
    if (search) {
      projection.score = { $meta: "textScore" };
    }
    
    if (!detailed) {

      projection = {
        ...projection,
        id: 1, 
        name: 1, 
        image: 1, 
        country: 1, 
        difficulty: 1, 
        calories: 1, 
        cookTime: 1, 
        tags: 1, 
        dietaryInfo: 1




      };
    }



    
    const [recipes, total] = await Promise.all([
      collection.find(query)
        .project(Object.keys(projection).length > 0 ? projection : null)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query)
    ]);

    const duration = Date.now() - startTime;
    console.log(`[API] GET /api/dishes - ${duration}ms - Search: ${search || 'none'}, Count: ${recipes.length}`);

    if (duration > 500) {
       log('api', `Slow Query: ${duration}ms`, { filters: { search, country, difficulty }, duration }).catch(console.error);
    }


    return NextResponse.json({
      success: true,
      data: recipes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      },
      filters: {
        search,
        country,
        difficulty,
        maxCalories,
        dietary
      }
    }, {

      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    });

  } catch (error) {
    console.error('[API Error]', error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
