import { NextResponse } from 'next/server';
import { connectToDatabase, getDatabase } from '../../../../lib/database';

export async function GET(request) {
    try {

        try {
            getDatabase();
        } catch (error) {
            await connectToDatabase();
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        
        if (!query) {
            return NextResponse.json({ 
                success: false, 
                message: "Search query 'q' is required" 
            }, { status: 400 });
        }

        const db = getDatabase();
        


        const pattern = query.split('').join('.*');
        const regex = new RegExp(pattern, 'i');
        
        const dishes = await db.collection('dishes').find({
            $or: [
                { name: regex },
                { description: regex },
                { tags: { $in: [regex] } },
                { country: regex },
                { region: regex }
            ]
        }).toArray();


        const expandedDishes = [];
        dishes.forEach(dish => {

            expandedDishes.push(dish);
            

            if (dish.variations && Array.isArray(dish.variations)) {
                dish.variations.forEach(variation => {
                    const variationDish = {
                        id: `${dish.id}-${variation.name.toLowerCase().replace(/\s+/g, '-')}`,
                        name: variation.name,
                        description: variation.description,
                        country: dish.country,
                        region: dish.region,
                        tags: [...dish.tags, variation.name.toLowerCase()],
                        difficulty: dish.difficulty,
                        parent_dish: dish.name,
                        calories: dish.calories + variation.calories,
                        protein: dish.protein,
                        carbs: dish.carbs,
                        fat: dish.fat,
                        fiber: dish.fiber,
                        dietaryInfo: dish.dietaryInfo,
                        spiceLevel: variation.spiceLevel || dish.spiceLevel,
                        allergens: dish.allergens,
                        cookingMethod: dish.cookingMethod,
                        mealType: dish.mealType,
                        season: dish.season,
                        variations: dish.variations ? [...dish.variations, variation] : [variation]
                    };
                    expandedDishes.push(variationDish);
                });
            }
        });

        return NextResponse.json({
            success: true,
            count: expandedDishes.length,
            query: query,
            dishes: expandedDishes
        });

    } catch (error) {
        console.error("❌ Search error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return NextResponse.json({ success: false, message: "Database not connected" }, { status: 503 });
        }
        return NextResponse.json({ success: false, message: "Database error" }, { status: 500 });
    }
} 
