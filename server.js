const express = require('express');
const cors = require('cors');
const { connectToDatabase, getDatabase } = require('./database');
const app = express();
const fs = require("fs");
const { removeDuplicates } = require('./database');

// Middleware
app.use(cors());
app.use(express.json());

let dbConnection = null;

// Remove this function since we'll connect once at startup
// async function ensureDbConnection() {
//     if (!dbConnection) {
//         dbConnection = await connectToDatabase();
//     }
//     return dbConnection;
// }

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

// Pagination and sorting helper
const applyPaginationAndSorting = (dishes, page = 1, limit = 20, sort = 'name', order = 'asc') => {
    // Sort dishes
    const sortedDishes = dishes.sort((a, b) => {
        let aValue = a[sort];
        let bValue = b[sort];
        
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        if (order === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDishes = sortedDishes.slice(startIndex, endIndex);
    
    return {
        dishes: paginatedDishes,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(sortedDishes.length / limit),
            totalItems: sortedDishes.length,
            itemsPerPage: limit,
            hasNext: endIndex < sortedDishes.length,
            hasPrev: page > 1
        }
    };
};

// Filter dishes helper
const applyFilters = (dishes, filters) => {
    return dishes.filter(dish => {
        // Country filter
        if (filters.country && !dish.country.toLowerCase().includes(filters.country.toLowerCase())) {
            return false;
        }
        
        // Meal type filter
        if (filters.mealType && dish.mealType !== filters.mealType) {
            return false;
        }
        
        // Dietary info filter
        if (filters.dietary && !dish.dietaryInfo.some(diet => 
            diet.toLowerCase().includes(filters.dietary.toLowerCase())
        )) {
            return false;
        }
        
        // Allergen filter
        if (filters.allergen && dish.allergens.some(allergen => 
            allergen.toLowerCase().includes(filters.allergen.toLowerCase())
        )) {
            return false;
        }
        
        // Difficulty filter
        if (filters.difficulty && dish.difficulty !== filters.difficulty) {
            return false;
        }
        
        // Spice level filter
        if (filters.spiceLevel && dish.spiceLevel !== filters.spiceLevel) {
            return false;
        }
        
        // Cooking method filter
        if (filters.cookingMethod && dish.cookingMethod !== filters.cookingMethod) {
            return false;
        }
        
        // Calorie range filter
        if (filters.caloriesMin && dish.calories < parseInt(filters.caloriesMin)) {
            return false;
        }
        if (filters.caloriesMax && dish.calories > parseInt(filters.caloriesMax)) {
            return false;
        }
        
        // Protein range filter
        if (filters.proteinMin && dish.protein < parseInt(filters.proteinMin)) {
            return false;
        }
        if (filters.proteinMax && dish.protein > parseInt(filters.proteinMax)) {
            return false;
        }
        
        return true;
    });
};

// Get all dishes with expanded variations
const getAllDishesWithVariations = async () => {
    const db = getDatabase();
    // Only return main dishes, not expanded variations
    return await db.collection('dishes').find({}).toArray();
};

// API Routes
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to HappyFood API! 🍽️",
        version: "3.0.0",
        database: "MongoDB Atlas",
        endpoints: {
            "GET /api/dishes": "Get all dishes with pagination & filtering",
            "GET /api/dishes/:id": "Get specific dish",
            "GET /api/dishes/search?q=term": "Search dishes",
            "GET /api/dishes/country/:country": "Get dishes by country",
            "GET /api/dishes/dietary/:diet": "Get dishes by dietary requirement",
            "GET /api/dishes/allergens/:allergen": "Get dishes by allergen-free",
            "GET /api/dishes/meal-type/:type": "Get dishes by meal type",
            "GET /api/dishes/difficulty/:level": "Get dishes by difficulty",
            "GET /api/dishes/spice/:level": "Get dishes by spice level",
            "GET /api/dishes/cooking-method/:method": "Get dishes by cooking method",
            "GET /api/dishes/similar/:id": "Get similar dishes",
            "GET /api/dishes/seasonal": "Get seasonal dishes",
            "GET /api/dishes/healthy": "Get healthy dishes",
            "GET /api/dishes/quick": "Get quick/easy dishes",
            "GET /api/stats/countries": "Get dish statistics by country",
            "GET /api/stats/cuisines": "Get cuisine statistics",
            "GET /api/stats/nutritional": "Get nutritional statistics",
            "GET /api/random": "Get random dish"
        }
    });
});

// Enhanced get all dishes with pagination and filtering
app.get('/api/dishes', async (req, res) => {
    try {
        // Remove the ensureDbConnection call since we connect at startup
        // await ensureDbConnection();
        
        const {
            page = 1,
            limit = 20,
            sort = 'name',
            order = 'asc',
            'filter[country]': country,
            'filter[mealType]': mealType,
            'filter[dietary]': dietary,
            'filter[allergen]': allergen,
            'filter[difficulty]': difficulty,
            'filter[spiceLevel]': spiceLevel,
            'filter[cookingMethod]': cookingMethod,
            'calories[min]': caloriesMin,
            'calories[max]': caloriesMax,
            'protein[min]': proteinMin,
            'protein[max]': proteinMax
        } = req.query;

        let allDishes = await getAllDishesWithVariations();
        
        // Apply filters
        const filters = {
            country, mealType, dietary, allergen, difficulty, 
            spiceLevel, cookingMethod, caloriesMin, caloriesMax,
            proteinMin, proteinMax
        };
        
        const filteredDishes = applyFilters(allDishes, filters);
        
        // Apply pagination and sorting
        const result = applyPaginationAndSorting(
            filteredDishes, 
            parseInt(page), 
            parseInt(limit), 
            sort, 
            order
        );

        res.json({
            success: true,
            count: result.dishes.length,        // Number of dishes in current page
            totalCount: result.pagination.totalItems, // Total dishes after filtering
            dishes: result.dishes,
            pagination: result.pagination
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Search dishes (MUST be before /:id route!)
app.get('/api/dishes/search', async (req, res) => {
    try {
        // Remove ensureDbConnection call
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

// Get dishes by dietary requirement
app.get('/api/dishes/dietary/:diet', async (req, res) => {
    try {
        const diet = req.params.diet.toLowerCase();
        const allDishes = await getAllDishesWithVariations();
        
        const filteredDishes = allDishes.filter(dish => 
            dish.dietaryInfo && dish.dietaryInfo.some(d => 
                d.toLowerCase().includes(diet)
            )
        );

        res.json({
            success: true,
            diet: diet,
            count: filteredDishes.length,
            dishes: filteredDishes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Get dishes by allergen-free
app.get('/api/dishes/allergens/:allergen', async (req, res) => {
    try {
        const allergen = req.params.allergen.toLowerCase();
        const allDishes = await getAllDishesWithVariations();
        
        const filteredDishes = allDishes.filter(dish => 
            !dish.allergens || !dish.allergens.some(a => 
                a.toLowerCase().includes(allergen)
            )
        );

        res.json({
            success: true,
            allergenFree: allergen,
            count: filteredDishes.length,
            dishes: filteredDishes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Get dishes by meal type
app.get('/api/dishes/meal-type/:type', async (req, res) => {
    try {
        const mealType = req.params.type.toLowerCase();
        const allDishes = await getAllDishesWithVariations();
        
        const filteredDishes = allDishes.filter(dish => 
            dish.mealType && dish.mealType.toLowerCase() === mealType
        );

        res.json({
            success: true,
            mealType: mealType,
            count: filteredDishes.length,
            dishes: filteredDishes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Get dishes by difficulty
app.get('/api/dishes/difficulty/:level', async (req, res) => {
    try {
        const difficulty = req.params.level.toLowerCase();
        const allDishes = await getAllDishesWithVariations();
        
        const filteredDishes = allDishes.filter(dish => 
            dish.difficulty && dish.difficulty.toLowerCase() === difficulty
        );

        res.json({
            success: true,
            difficulty: difficulty,
            count: filteredDishes.length,
            dishes: filteredDishes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Get dishes by spice level
app.get('/api/dishes/spice/:level', async (req, res) => {
    try {
        const spiceLevel = req.params.level.toLowerCase();
        const allDishes = await getAllDishesWithVariations();
        
        const filteredDishes = allDishes.filter(dish => 
            dish.spiceLevel && dish.spiceLevel.toLowerCase() === spiceLevel
        );

        res.json({
            success: true,
            spiceLevel: spiceLevel,
            count: filteredDishes.length,
            dishes: filteredDishes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Get dishes by cooking method
app.get('/api/dishes/cooking-method/:method', async (req, res) => {
    try {
        const cookingMethod = req.params.method.toLowerCase();
        const allDishes = await getAllDishesWithVariations();
        
        const filteredDishes = allDishes.filter(dish => 
            dish.cookingMethod && dish.cookingMethod.toLowerCase() === cookingMethod
        );

        res.json({
            success: true,
            cookingMethod: cookingMethod,
            count: filteredDishes.length,
            dishes: filteredDishes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Get similar dishes
app.get('/api/dishes/similar/:id', async (req, res) => {
    try {
        const dishId = req.params.id;
        const allDishes = await getAllDishesWithVariations();
        
        const targetDish = allDishes.find(dish => dish.id === dishId);
        if (!targetDish) {
            return res.status(404).json({ success: false, message: "Dish not found" });
        }
        
        const similarDishes = allDishes.filter(dish => 
            dish.id !== dishId && (
                dish.country === targetDish.country ||
                dish.mealType === targetDish.mealType ||
                dish.cookingMethod === targetDish.cookingMethod ||
                dish.tags.some(tag => targetDish.tags.includes(tag))
            )
        ).slice(0, 10);

        res.json({
            success: true,
            baseDish: targetDish.name,
            count: similarDishes.length,
            dishes: similarDishes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Get seasonal dishes
app.get('/api/dishes/seasonal', async (req, res) => {
    try {
        const allDishes = await getAllDishesWithVariations();
        
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        let currentSeason;
        
        if (currentMonth >= 3 && currentMonth <= 5) currentSeason = 'spring';
        else if (currentMonth >= 6 && currentMonth <= 8) currentSeason = 'summer';
        else if (currentMonth >= 9 && currentMonth <= 11) currentSeason = 'autumn';
        else currentSeason = 'winter';
        
        const seasonalDishes = allDishes.filter(dish => 
            dish.season && dish.season.toLowerCase() === currentSeason
        );

        res.json({
            success: true,
            currentSeason: currentSeason,
            count: seasonalDishes.length,
            dishes: seasonalDishes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Get healthy dishes
app.get('/api/dishes/healthy', async (req, res) => {
    try {
        const allDishes = await getAllDishesWithVariations();
        
        const healthyDishes = allDishes.filter(dish => 
            dish.calories <= 400 && dish.protein >= 15 && dish.fiber >= 5
        );

        res.json({
            success: true,
            criteria: "Low calorie (≤400), High protein (≥15g), High fiber (≥5g)",
            count: healthyDishes.length,
            dishes: healthyDishes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Get quick/easy dishes
app.get('/api/dishes/quick', async (req, res) => {
    try {
        const allDishes = await getAllDishesWithVariations();
        
        const quickDishes = allDishes.filter(dish => 
            dish.difficulty && dish.difficulty.toLowerCase() === 'easy'
        );

        res.json({
            success: true,
            criteria: "Easy difficulty level",
            count: quickDishes.length,
            dishes: quickDishes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Statistics - Countries
app.get('/api/stats/countries', async (req, res) => {
    try {
        const allDishes = await getAllDishesWithVariations();
        
        const countryStats = allDishes.reduce((stats, dish) => {
            const country = dish.country;
            stats[country] = (stats[country] || 0) + 1;
            return stats;
        }, {});
        
        const sortedStats = Object.entries(countryStats)
            .sort(([,a], [,b]) => b - a)
            .map(([country, count]) => ({ country, count }));

        res.json({
            success: true,
            totalCountries: sortedStats.length,
            countries: sortedStats
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Statistics - Nutritional
app.get('/api/stats/nutritional', async (req, res) => {
    try {
        const allDishes = await getAllDishesWithVariations();
        
        const total = allDishes.length;
        const avgCalories = allDishes.reduce((sum, dish) => sum + dish.calories, 0) / total;
        const avgProtein = allDishes.reduce((sum, dish) => sum + dish.protein, 0) / total;
        const avgCarbs = allDishes.reduce((sum, dish) => sum + dish.carbs, 0) / total;
        const avgFat = allDishes.reduce((sum, dish) => sum + dish.fat, 0) / total;
        const avgFiber = allDishes.reduce((sum, dish) => sum + dish.fiber, 0) / total;

        res.json({
            success: true,
            totalDishes: total,
            averageNutrition: {
                calories: Math.round(avgCalories),
                protein: Math.round(avgProtein * 10) / 10,
                carbs: Math.round(avgCarbs * 10) / 10,
                fat: Math.round(avgFat * 10) / 10,
                fiber: Math.round(avgFiber * 10) / 10
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Database error" });
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
        const allDishes = await getAllDishesWithVariations();

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

// Data insertion routes (keeping original functionality)
app.get("/insert-data", async (req, res) => {
    try {
        const db = getDatabase();
        const dishes = JSON.parse(fs.readFileSync("bulky1.json", "utf-8"));

        const operations = dishes.map(dish => ({
            updateOne: {
                filter: { id: dish.id },
                update: { $set: dish },
                upsert: true
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

app.get("/insert-data-check", async (req, res) => {
    try {
        const db = getDatabase();
        const dishes = JSON.parse(fs.readFileSync("dishes.json", "utf-8"));

        const existingDishes = await db.collection("dishes").find({}, { projection: { id: 1 } }).toArray();
        const existingIds = new Set(existingDishes.map(dish => dish.id));

        const newDishes = dishes.filter(dish => !existingIds.has(dish.id));

        if (newDishes.length === 0) {
            return res.json({ 
                success: true, 
                message: "ℹ️ No new dishes to insert. All dishes already exist.",
                existing: existingIds.size
            });
        }

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

app.get("/reset-data", async (req, res) => {
    try {
        const db = getDatabase();
        const dishes = JSON.parse(fs.readFileSync("dishes.json", "utf-8"));

        await db.collection("dishes").deleteMany({});
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

app.get("/deleto", async (req, res) => {
    try {
        const db = getDatabase();
        // Delete all documents from the "dishes" collection
        const result = await db.collection("dishes").deleteMany({});
        res.json({
            success: true,
            message: "🗑️ All data deleted from the database.",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("❌ Error Deleting All Data:", error);
        res.status(500).json({ success: false, message: "Database error" });
    }
});





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
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;