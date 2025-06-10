const express = require('express');
const cors = require('cors');
const { connectToDatabase, getDatabase } = require('./database');
const app = express();
const fs = require("fs");
const { removeDuplicates } = require('./database');
// Middleware
app.use(cors());
app.use(express.json());

// Helper Functions
const createVariationDish = (dish, variation) => ({
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

});

// API Routes
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to HappyFood API! 🍽️",
        version: "2.0.0",
        database: "MongoDB Atlas",
        endpoints: {
            "GET /api/dishes": "Get all dishes",
            "GET /api/dishes/:id": "Get specific dish",
            "GET /api/dishes/search?q=term": "Search dishes",
            "GET /api/dishes/country/:country": "Get dishes by country",
            "GET /api/random": "Get random dish"
        }
    });
});

// Get all dishes
app.get('/api/dishes', async (req, res) => {
    try {
        const db = getDatabase();
        const dishes = await db.collection('dishes').find({}).toArray();

        // Expand variations as separate dishes
        let allDishes = [...dishes];
        dishes.forEach(dish => {
            if (dish.variations) {
                dish.variations.forEach(variation => {
                    allDishes.push(createVariationDish(dish, variation));
                });
            }
        });

        res.json({
            success: true,
            count: allDishes.length,
            dishes: allDishes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Search dishes (MUST be before /:id route!)
app.get('/api/dishes/search', async (req, res) => {
    try {
        const searchTerm = req.query.q;
        if (!searchTerm) {
            return res.status(400).json({ success: false, message: "Search term required. Use ?q=your_search_term" });
        }

        const db = getDatabase();
        const dishes = await db.collection('dishes').find({
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
                { country: { $regex: searchTerm, $options: 'i' } },
                { tags: { $elemMatch: { $regex: searchTerm, $options: 'i' } } }
            ]
        }).toArray();

        // Also search in variations
        let matchingDishes = [...dishes];
        const allDishes = await db.collection('dishes').find({}).toArray();

        allDishes.forEach(dish => {
            if (dish.variations) {
                dish.variations.forEach(variation => {
                    if (variation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        variation.description.toLowerCase().includes(searchTerm.toLowerCase())) {
                        matchingDishes.push(createVariationDish(dish, variation));
                    }
                });
            }
        });

        // Remove duplicates
        const uniqueDishes = matchingDishes.filter((dish, index, self) =>
            index === self.findIndex(d => d.id === dish.id)
        );

        res.json({
            success: true,
            count: uniqueDishes.length,
            searchTerm: searchTerm,
            dishes: uniqueDishes
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: "Database search error" });
    }
});

// Get specific dish by ID
app.get('/api/dishes/:id', async (req, res) => {
    try {
        const db = getDatabase();
        const dishId = req.params.id;

        // First try to find main dish
        let dish = await db.collection('dishes').findOne({ id: dishId });

        // If not found, check if it's a variation
        if (!dish) {
            const allDishes = await db.collection('dishes').find({}).toArray();
            for (let mainDish of allDishes) {
                if (mainDish.variations) {
                    const variation = mainDish.variations.find(v =>
                        `${mainDish.id}-${v.name.toLowerCase().replace(/\s+/g, '-')}` === dishId
                    );
                    if (variation) {
                        dish = createVariationDish(mainDish, variation);
                        break;
                    }
                }
            }
        }

        if (!dish) {
            return res.status(404).json({ success: false, message: "Dish not found" });
        }

        // Return ONLY the specific dish, not variations
        const { variations, ...dishWithoutVariations } = dish;

        res.json({
            success: true,
            dish: dishWithoutVariations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});



// Get dishes by country
app.get('/api/dishes/country/:country', async (req, res) => {
    try {
        const country = req.params.country;
        const db = getDatabase();

        const dishes = await db.collection('dishes').find({
            country: { $regex: country, $options: 'i' }
        }).toArray();

        // Expand variations
        let allDishes = [...dishes];
        dishes.forEach(dish => {
            if (dish.variations) {
                dish.variations.forEach(variation => {
                    allDishes.push(createVariationDish(dish, variation));
                });
            }
        });

        res.json({
            success: true,
            country: country,
            count: allDishes.length,
            dishes: allDishes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Get random dish
app.get('/api/random', async (req, res) => {
    try {
        const db = getDatabase();
        const dishes = await db.collection('dishes').find({}).toArray();

        // Expand all variations
        let allDishes = [...dishes];
        dishes.forEach(dish => {
            if (dish.variations) {
                dish.variations.forEach(variation => {
                    allDishes.push(createVariationDish(dish, variation));
                });
            }
        });

        if (allDishes.length === 0) {
            return res.status(404).json({ success: false, message: "No dishes found" });
        }

        const randomIndex = Math.floor(Math.random() * allDishes.length);
        const randomDish = allDishes[randomIndex];

        res.json({
            success: true,
            dish: randomDish
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Option 1: Upsert approach (recommended)
app.get("/insert-data", async (req, res) => {
  try {
    const db = getDatabase();
    const dishes = JSON.parse(fs.readFileSync("dishes_clean.json", "utf-8"));

    // Use bulkWrite with upsert to prevent duplicates
    const operations = dishes.map(dish => ({
      updateOne: {
        filter: { id: dish.id }, // Use unique ID as filter
        update: { $set: dish },
        upsert: true // Insert if doesn't exist, update if it does
      }
    }));

    const result = await db.collection("dishes").bulkWrite(operations);
    
    res.json({ 
      success: true, 
      message: "✅ Data Inserted/Updated Successfully!",
      details: {
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        total: result.upsertedCount + result.modifiedCount
      }
    });
  } catch (error) {
    console.error("❌ Error Inserting Data:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Option 2: Check and insert only new items
app.get("/insert-data-check", async (req, res) => {
  try {
    const db = getDatabase();
    const dishes = JSON.parse(fs.readFileSync("dishes.json", "utf-8"));

    // Get existing dish IDs
    const existingDishes = await db.collection("dishes").find({}, { projection: { id: 1 } }).toArray();
    const existingIds = new Set(existingDishes.map(dish => dish.id));

    // Filter out dishes that already exist
    const newDishes = dishes.filter(dish => !existingIds.has(dish.id));

    if (newDishes.length === 0) {
      return res.json({ 
        success: true, 
        message: "ℹ️ No new dishes to insert. All dishes already exist.",
        existing: existingIds.size
      });
    }

    // Insert only new dishes
    const result = await db.collection("dishes").insertMany(newDishes);
    
    res.json({ 
      success: true, 
      message: `✅ ${newDishes.length} new dishes inserted successfully!`,
      details: {
        inserted: result.insertedCount,
        skipped: dishes.length - newDishes.length,
        total: dishes.length
      }
    });
  } catch (error) {
    console.error("❌ Error Inserting Data:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Option 3: Clear and re-insert (use with caution)
app.get("/reset-data", async (req, res) => {
  try {
    const db = getDatabase();
    const dishes = JSON.parse(fs.readFileSync("dishes.json", "utf-8"));

    // Clear existing data
    await db.collection("dishes").deleteMany({});
    
    // Insert fresh data
    const result = await db.collection("dishes").insertMany(dishes);
    
    res.json({ 
      success: true, 
      message: "✅ Data Reset and Inserted Successfully!",
      inserted: result.insertedCount
    });
  } catch (error) {
    console.error("❌ Error Resetting Data:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// Utility function to clean up duplicates (run once if needed)
app.get('/cleanup-duplicates', async (req, res) => {
  try {
    const result = await removeDuplicates();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});





// Start server and connect to database
const PORT = process.env.PORT || 3000;

async function startServer() {
    await connectToDatabase();
}
module.exports = app;
startServer();
