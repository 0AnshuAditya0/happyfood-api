import { NextResponse } from 'next/server';
import { connectToDatabase, getDatabase } from '../../../../lib/database';
import Joi from 'joi';


const recipeSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).required(),
    ingredients: Joi.array().items(
        Joi.object({
            name: Joi.string().min(1).required(),
            amount: Joi.string().min(1).required()
        })
    ).min(1).required(),
    image: Joi.string().uri().required(),
    country: Joi.string().min(2).required(),
    region: Joi.string().min(2).required(),
    tags: Joi.array().items(Joi.string()).min(1).required(),
    difficulty: Joi.string().required(),
    calories: Joi.number().required(),
    protein: Joi.number().required(),
    carbs: Joi.number().required(),
    fat: Joi.number().required(),
    fiber: Joi.number().required(),
    dietaryInfo: Joi.array().items(Joi.string()).min(1).required(),
    spiceLevel: Joi.string().required(),
    allergens: Joi.array().items(Joi.string()).required(),
    cookingMethod: Joi.string().required(),
    mealType: Joi.string().required(),
    season: Joi.string().required(),
    instructions: Joi.string().min(10).required(),
    variations: Joi.array().items(Joi.object()).required(),
    cookTime: Joi.number().required(),
    servings: Joi.number().required(),
    source: Joi.string().required()
});

export async function POST(request) {
    try {

        try {
            getDatabase();
        } catch (error) {
            await connectToDatabase();
        }

        const body = await request.json();
        

        const { error, value } = recipeSchema.validate(body, { abortEarly: false });
        if (error) {
            return NextResponse.json({ 
                success: false, 
                message: 'Validation error', 
                details: error.details.map(d => d.message) 
            }, { status: 400 });
        }

        const db = getDatabase();
        

        const id = `${value.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        const newRecipe = { ...value, id };
        

        await db.collection('dishes').insertOne(newRecipe);
        
        return NextResponse.json({ 
            success: true, 
            message: 'Recipe shared successfully!', 
            recipe: newRecipe 
        });

    } catch (error) {
        console.error('❌ Error sharing recipe:', error.stack || error);
        return NextResponse.json({ 
            success: false, 
            message: 'Database error' 
        }, { status: 500 });
    }
} 
