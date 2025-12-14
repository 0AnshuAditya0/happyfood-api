const express = require('express');
const cors = require('cors');
const { connectToDatabase, getDatabase, removeDuplicates, isDatabaseConnected } = require('./database');
const app = express();
const fs = require("fs");
const winston = require('winston');
const transports = [
  new winston.transports.Console()
];

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production') {
  // Only use file logging locally or in non-serverless environments
  const fs = require('fs');
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
  }
  transports.push(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports
});
const Joi = require('joi');
const NodeCache = require('node-cache');
const apiCache = new NodeCache({ stdTTL: 120 }); // 2 minutes TTL
const compression = require('compression');

// Joi schema for recipe validation
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

// Middleware
app.use(cors());
app.use(express.json());
app.use(compression()); // Enable gzip compression

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

// Enhanced applyFilters: supports multiple values for filters and fuzzy name search
const applyFilters = (dishes, filters) => {
    return dishes.filter(dish => {
        // Fuzzy name search (if provided)
        if (filters.name) {
            // Fuzzy: allow for typos by using a regex with the letters in order
            // e.g., 'ape' matches 'apple', 'grape', etc.
            const pattern = filters.name.split('').join('.*');
            const regex = new RegExp(pattern, 'i');
            if (!regex.test(dish.name)) return false;
        }
        // Country filter (multi)
        if (filters.country) {
            const countries = Array.isArray(filters.country) ? filters.country : String(filters.country).split(',');
            if (!countries.some(c => dish.country && dish.country.toLowerCase().includes(c.toLowerCase()))) {
                return false;
            }
        }
        // Meal type filter (multi)
        if (filters.mealType) {
            const mealTypes = Array.isArray(filters.mealType) ? filters.mealType : String(filters.mealType).split(',');
            if (!mealTypes.some(mt => dish.mealType && dish.mealType.toLowerCase() === mt.toLowerCase())) {
                return false;
            }
        }
        // Dietary info filter (multi)
        if (filters.dietary) {
            const diets = Array.isArray(filters.dietary) ? filters.dietary : String(filters.dietary).split(',');
            if (!dish.dietaryInfo || !diets.some(diet => dish.dietaryInfo.some(d => d.toLowerCase().includes(diet.toLowerCase())))) {
                return false;
            }
        }
        // Allergen filter (multi)
        if (filters.allergen) {
            const allergens = Array.isArray(filters.allergen) ? filters.allergen : String(filters.allergen).split(',');
            if (!dish.allergens || !allergens.some(allergen => dish.allergens.some(a => a.toLowerCase().includes(allergen.toLowerCase())))) {
                return false;
            }
        }
        // Difficulty filter (multi)
        if (filters.difficulty) {
            const diffs = Array.isArray(filters.difficulty) ? filters.difficulty : String(filters.difficulty).split(',');
            if (!diffs.some(diff => dish.difficulty && dish.difficulty.toLowerCase() === diff.toLowerCase())) {
                return false;
            }
        }
        // Spice level filter (multi)
        if (filters.spiceLevel) {
            const spices = Array.isArray(filters.spiceLevel) ? filters.spiceLevel : String(filters.spiceLevel).split(',');
            if (!spices.some(spice => dish.spiceLevel && dish.spiceLevel.toLowerCase() === spice.toLowerCase())) {
                return false;
            }
        }
        // Cooking method filter (multi)
        if (filters.cookingMethod) {
            const methods = Array.isArray(filters.cookingMethod) ? filters.cookingMethod : String(filters.cookingMethod).split(',');
            if (!methods.some(method => dish.cookingMethod && dish.cookingMethod.toLowerCase() === method.toLowerCase())) {
                return false;
            }
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
        // Tags filter (multi)
        if (filters.tags) {
            const tags = Array.isArray(filters.tags) ? filters.tags : String(filters.tags).split(',');
            if (!dish.tags || !tags.some(tag => dish.tags.some(t => t.toLowerCase() === tag.toLowerCase()))) {
                return false;
            }
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

// Helper to build pagination links
function buildPaginationLinks(req, pagination) {
    const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl.split('?')[0]);
    const params = new URLSearchParams(req.query);
    const links = {};
    if (pagination.hasNext) {
        params.set('page', pagination.currentPage + 1);
        links.next = url.pathname + '?' + params.toString();
    }
    if (pagination.hasPrev) {
        params.set('page', pagination.currentPage - 1);
        links.prev = url.pathname + '?' + params.toString();
    }
    return links;
}

// API Routes
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to HappyFood API! 🍽️",
        version: "3.0.0",
        database: "MongoDB Atlas",
        documentation: "https://github.com/0anshuaditya0/happyfood-api",
        endpoints: [
            {
                method: "GET",
                path: "/api/dishes",
                description: "Get all dishes with pagination & advanced filtering (supports ?name=, ?tags=, ?dietary=, etc.)",
                example: "curl http://localhost:3000/api/dishes?page=1&limit=10&tags=vegan,gluten-free"
            },
            {
                method: "GET",
                path: "/api/dishes/:id",
                description: "Get a specific dish by ID",
                example: "curl http://localhost:3000/api/dishes/pizza-001-margherita-pizza"
            },
            {
                method: "GET",
                path: "/api/dishes/search?q=term",
                description: "Fuzzy search dishes by name (typo-tolerant)",
                example: "curl \"http://localhost:3000/api/dishes/search?q=ape\""
            },
            {
                method: "GET",
                path: "/api/dishes/country/:country",
                description: "Get dishes by country",
                example: "curl http://localhost:3000/api/dishes/country/Italy"
            },
            {
                method: "GET",
                path: "/api/dishes/dietary/:diet",
                description: "Get dishes by dietary requirement",
                example: "curl http://localhost:3000/api/dishes/dietary/vegan"
            },
            {
                method: "GET",
                path: "/api/dishes/allergens/:allergen",
                description: "Get allergen-free dishes",
                example: "curl http://localhost:3000/api/dishes/allergens/peanut"
            },
            {
                method: "GET",
                path: "/api/dishes/meal-type/:type",
                description: "Get dishes by meal type",
                example: "curl http://localhost:3000/api/dishes/meal-type/Dessert"
            },
            {
                method: "GET",
                path: "/api/dishes/difficulty/:level",
                description: "Get dishes by difficulty",
                example: "curl http://localhost:3000/api/dishes/difficulty/Easy"
            },
            {
                method: "GET",
                path: "/api/dishes/spice/:level",
                description: "Get dishes by spice level",
                example: "curl http://localhost:3000/api/dishes/spice/Mild"
            },
            {
                method: "GET",
                path: "/api/dishes/cooking-method/:method",
                description: "Get dishes by cooking method",
                example: "curl http://localhost:3000/api/dishes/cooking-method/Baking"
            },
            {
                method: "GET",
                path: "/api/dishes/similar/:id",
                description: "Get similar dishes by ID",
                example: "curl http://localhost:3000/api/dishes/similar/pizza-001-margherita-pizza"
            },
            {
                method: "GET",
                path: "/api/dishes/seasonal",
                description: "Get seasonal dishes",
                example: "curl http://localhost:3000/api/dishes/seasonal"
            },
            {
                method: "GET",
                path: "/api/dishes/healthy",
                description: "Get healthy dishes",
                example: "curl http://localhost:3000/api/dishes/healthy"
            },
            {
                method: "GET",
                path: "/api/dishes/quick",
                description: "Get quick/easy dishes",
                example: "curl http://localhost:3000/api/dishes/quick"
            },
            {
                method: "GET",
                path: "/api/stats/countries",
                description: "Get dish statistics by country",
                example: "curl http://localhost:3000/api/stats/countries"
            },
            {
                method: "GET",
                path: "/api/stats/nutritional",
                description: "Get nutritional statistics",
                example: "curl http://localhost:3000/api/stats/nutritional"
            },
            {
                method: "GET",
                path: "/api/random",
                description: "Get a random dish",
                example: "curl http://localhost:3000/api/random"
            },
            {
                method: "POST",
                path: "/api/recipes/share",
                description: "Share a new recipe (all fields required, see README for schema)",
                example: "curl -X POST http://localhost:3000/api/recipes/share -H 'Content-Type: application/json' -d '{...}'"
            },
            {
                method: "GET",
                path: "/health",
                description: "Health check (DB status)",
                example: "curl http://localhost:3000/health"
            }
        ]
    });
});

// Enhanced get all dishes with pagination and filtering
app.get('/api/dishes', async (req, res) => {
    try {
        // Use full URL as cache key (includes query params)
        const cacheKey = req.originalUrl;
        const cached = apiCache.get(cacheKey);
        if (cached) {
            logger.info(`Cache hit for ${cacheKey}`);
            return res.json(cached);
        }
        
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
            'filter[name]': name, // Added for fuzzy search
            'filter[tags]': tags, // Added for multi-tag search
            'calories[min]': caloriesMin,
            'calories[max]': caloriesMax,
            'protein[min]': proteinMin,
            'protein[max]': proteinMax
        } = req.query;

        let allDishes = await getAllDishesWithVariations();
        
        // Apply filters
        const filters = {
            country, mealType, dietary, allergen, difficulty, 
            spiceLevel, cookingMethod, name, tags, caloriesMin, caloriesMax,
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

        // Add pagination links
        const links = buildPaginationLinks(req, result.pagination);
        const response = {
            success: true,
            count: result.dishes.length,        // Number of dishes in current page
            totalCount: result.pagination.totalItems, // Total dishes after filtering
            dishes: result.dishes,
            pagination: {
                ...result.pagination,
                ...links
            }
        };
        apiCache.set(cacheKey, response);
        logger.info(`Cache set for ${cacheKey}`);
        res.json(response);
    } catch (error) {
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        // Escape special regex characters to prevent invalid patterns
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const dishes = await db.collection('dishes').find({
            $or: [
                { name: { $regex: escapedSearchTerm, $options: 'i' } },
                { description: { $regex: escapedSearchTerm, $options: 'i' } },
                { country: { $regex: escapedSearchTerm, $options: 'i' } },
                { tags: { $elemMatch: { $regex: escapedSearchTerm, $options: 'i' } } }
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
        logger.error('Search error:', error);
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
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
        res.status(500).json({ success: false, message: "Database error" });
    }
});

app.get('/api/stats/countries', async (req, res) => {
    try {
        const db = getDatabase();
        const pipeline = [
            { $group: { _id: "$country", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ];
        const agg = await db.collection('dishes').aggregate(pipeline).toArray();
        const countries = agg.map(doc => ({ country: doc._id || "Unknown", count: doc.count }));
        res.json({ success: true, totalCountries: countries.length, countries });
    } catch (error) {
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Statistics - Nutritional (optimized with aggregation)
app.get('/api/stats/nutritional', async (req, res) => {
    try {
        const db = getDatabase();
        const pipeline = [
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    avgCalories: { $avg: "$calories" },
                    avgProtein: { $avg: "$protein" },
                    avgCarbs: { $avg: "$carbs" },
                    avgFat: { $avg: "$fat" },
                    avgFiber: { $avg: "$fiber" },
                }
            }
        ];
        const [result] = await db.collection('dishes').aggregate(pipeline).toArray();
        const total = result?.total || 0;
        res.json({
            success: true,
            totalDishes: total,
            averageNutrition: {
                calories: Math.round((result?.avgCalories || 0)),
                protein: Math.round(((result?.avgProtein || 0)) * 10) / 10,
                carbs: Math.round(((result?.avgCarbs || 0)) * 10) / 10,
                fat: Math.round(((result?.avgFat || 0)) * 10) / 10,
                fiber: Math.round(((result?.avgFiber || 0)) * 10) / 10,
            }
        });
    } catch (error) {
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
        res.status(500).json({ success: false, message: "Database error" });
    }
});

// Get specific dish by ID
app.get('/api/dishes/:id', async (req, res) => {
    try {
        const cacheKey = req.originalUrl;
        const cached = apiCache.get(cacheKey);
        if (cached) {
            logger.info(`Cache hit for ${cacheKey}`);
            return res.json(cached);
        }
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

        const response = {
            success: true,
            dish: dishWithoutVariations
        };
        apiCache.set(cacheKey, response);
        logger.info(`Cache set for ${cacheKey}`);
        res.json(response);
    } catch (error) {
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        logger.error("❌ Error:", error.stack || error);
        if (error.message && error.message.includes('Database not connected')) {
            return res.status(503).json({ success: false, message: "Database not connected" });
        }
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
        logger.error("❌ Error Inserting Data:", error);
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
        logger.error("❌ Error Inserting Data:", error);
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
        logger.error("❌ Error Resetting Data:", error);
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
        logger.error("❌ Error Deleting All Data:", error);
        res.status(500).json({ success: false, message: "Database error" });
    }
});





app.get('/cleanup-duplicates', async (req, res) => {
    try {
        const result = await removeDuplicates();
        res.json({ success: true, result });
    } catch (error) {
        logger.error("❌ Error cleaning up duplicates:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Recipe sharing endpoint
app.post('/api/recipes/share', async (req, res) => {
    try {
        const { error, value } = recipeSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ success: false, message: 'Validation error', details: error.details.map(d => d.message) });
        }
        const db = getDatabase();
        // Generate a unique id for the new recipe
        const id = `${value.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        const newRecipe = { ...value, id };
        await db.collection('dishes').insertOne(newRecipe);
        res.json({ success: true, message: 'Recipe shared successfully!', recipe: newRecipe });
    } catch (error) {
        logger.error('❌ Error sharing recipe:', error.stack || error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    try {
        if (!isDatabaseConnected()) {
            return res.status(503).json({ status: 'error', db: 'not connected' });
        }
        res.json({ status: 'ok', db: 'connected' });
    } catch (e) {
        logger.error("❌ Health check failed:", e);
        res.status(500).json({ status: 'error', db: 'not connected', error: e.message });
    }
});

// Start server and connect to database
const PORT = process.env.API_PORT || process.env.PORT || 4000;

async function startServer() {
    try {
        await connectToDatabase();
        app.listen(PORT, () => {
            logger.info(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;