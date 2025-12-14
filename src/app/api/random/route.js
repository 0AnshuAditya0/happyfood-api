import { NextResponse } from 'next/server';
import { connectToDatabase, getDatabase } from '../../../lib/database';

export async function GET() {
    try {

        try {
            getDatabase();
        } catch (error) {
            await connectToDatabase();
        }

        const db = getDatabase();
        

        const totalCount = await db.collection('dishes').countDocuments();
        
        if (totalCount === 0) {
            return NextResponse.json({ 
                success: false, 
                message: "No dishes found in database" 
            }, { status: 404 });
        }


        const randomDishes = await db.collection('dishes').aggregate([
            { $sample: { size: 1 } }
        ]).toArray();

        const randomDish = randomDishes[0];

        return NextResponse.json({
            success: true,
            dish: randomDish,
            totalDishes: totalCount
        });

    } catch (error) {
        console.error("❌ Error fetching random dish:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return NextResponse.json({ success: false, message: "Database not connected" }, { status: 503 });
        }
        return NextResponse.json({ success: false, message: "Database error" }, { status: 500 });
    }
} 
