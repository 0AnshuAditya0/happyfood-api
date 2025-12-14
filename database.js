const { MongoClient } = require('mongodb');
require('dotenv').config();

const password = encodeURIComponent(process.env.MONGO_PASSWORD);

// MongoDB connection string
const connectionString = `mongodb+srv://happyfood-admin:${password}@happyfood-cluster.rzidvqb.mongodb.net/happyfood?retryWrites=true&w=majority&appName=happyfood-cluster`;

let db;
let client;

/**
 * Connect to MongoDB Atlas with optimized settings
 */
async function connectToDatabase() {
    try {
        const options = {
            // Timeouts
            serverSelectionTimeoutMS: 60000,
            connectTimeoutMS: 60000,
            socketTimeoutMS: 60000,
            
            // Connection pool
            maxPoolSize: 10,
            minPoolSize: 2,
            maxIdleTimeMS: 30000,
            
            // SSL/TLS
            tls: true,
            
            // Retry settings
            retryWrites: true,
            retryReads: true,
            
            // Performance
            directConnection: false,
            heartbeatFrequencyMS: 10000,
            family: 4 // Force IPv4
        };

        console.log('🔄 Connecting to MongoDB Atlas...');
        client = new MongoClient(connectionString, options);
        // Add MongoDB client event listeners for robust error handling
        client.on('close', () => {
            console.error('❌ MongoDB connection closed!');
        });
        client.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        client.on('timeout', () => {
            console.error('❌ MongoDB connection timeout!');
        });
        
        // Connect with timeout protection
        await Promise.race([
            client.connect(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout after 60 seconds')), 60000)
            )
        ]);
        
        // Test connection
        await client.db("admin").command({ ping: 1 });
        
        db = client.db('happyfood');
        console.log('✅ Successfully connected to MongoDB Atlas!');

        // Check existing data
        const count = await db.collection('dishes').countDocuments();
        console.log(`📊 Database contains ${count} dishes`);
        
        return db;
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        
        // Provide specific error guidance
        if (error.message.includes('authentication')) {
            console.log('🔑 Check: Username/password and URL encoding');
        }
        if (error.message.includes('IP') || error.message.includes('network')) {
            console.log('🌐 Check: IP whitelist and network connectivity');
        }
        if (error.message.includes('SSL') || error.message.includes('TLS')) {
            console.log('🔒 Check: SSL/TLS settings and firewall');
        }
        
        throw error;
    }
}

/**
 * Get database instance
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not connected. Call connectToDatabase() first.');
    }
    return db;
}

/**
 * ✅ FIXED: Insert dishes with proper duplicate prevention
 */
async function insertDishesFromJSON() {
    try {
        if (!db) {
            throw new Error('Database not connected');
        }

        // ✅ Load only ONE file - your main dishes.json
        const dishes = require('./dishes.json');
        
        console.log(`📥 Loading ${dishes.length} dishes from dishes.json`);
        
        // ✅ Use upsert to prevent duplicates
        const operations = dishes.map(dish => ({
            updateOne: {
                filter: { id: dish.id },
                update: { $set: dish },
                upsert: true
            }
        }));

        const result = await db.collection('dishes').bulkWrite(operations);
        
        console.log(`✅ Operation completed!`);
        console.log(`   - Inserted: ${result.upsertedCount} new dishes`);
        console.log(`   - Updated: ${result.modifiedCount} existing dishes`);
        console.log(`   - Total processed: ${dishes.length} dishes`);
        
        return {
            inserted: result.upsertedCount,
            updated: result.modifiedCount,
            total: dishes.length
        };
        
    } catch (error) {
        console.error('❌ Error inserting dishes:', error.message);
        throw error;
    }
}

/**
 * ✅ FIXED: Insert from multiple files safely (if needed)
 */
async function insertMultipleFiles(filePaths = []) {
    try {
        if (!db) {
            throw new Error('Database not connected');
        }

        let allDishes = [];
        const seenIds = new Set();
        
        // Load and deduplicate from multiple files
        for (const filePath of filePaths) {
            try {
                const dishes = require(filePath);
                console.log(`📥 Loading ${dishes.length} dishes from ${filePath}`);
                
                // Filter out duplicates based on ID
                const uniqueDishes = dishes.filter(dish => {
                    if (seenIds.has(dish.id)) {
                        console.log(`⚠️ Skipping duplicate ID: ${dish.id} from ${filePath}`);
                        return false;
                    }
                    seenIds.add(dish.id);
                    return true;
                });
                
                allDishes.push(...uniqueDishes);
            } catch (err) {
                console.log(`⚠️ Could not load ${filePath}: ${err.message}`);
            }
        }
        
        if (allDishes.length === 0) {
            throw new Error('No dishes loaded from any file');
        }

        // Use upsert for safe insertion
        const operations = allDishes.map(dish => ({
            updateOne: {
                filter: { id: dish.id },
                update: { $set: dish },
                upsert: true
            }
        }));

        const result = await db.collection('dishes').bulkWrite(operations);
        
        console.log(`✅ Multi-file operation completed!`);
        console.log(`   - Files processed: ${filePaths.length}`);
        console.log(`   - Unique dishes: ${allDishes.length}`);
        console.log(`   - Inserted: ${result.upsertedCount}`);
        console.log(`   - Updated: ${result.modifiedCount}`);
        
        return {
            inserted: result.upsertedCount,
            updated: result.modifiedCount,
            total: allDishes.length,
            filesProcessed: filePaths.length
        };
        
    } catch (error) {
        console.error('❌ Error inserting from multiple files:', error.message);
        throw error;
    }
}

/**
 * ✅ FIXED: Get all dishes with connection check
 */
async function getAllDishes() {
    try {
        if (!db) {
            throw new Error('Database not connected');
        }
        
        const dishes = await db.collection('dishes').find({}).toArray();
        return dishes;
    } catch (error) {
        console.error('❌ Error fetching dishes:', error.message);
        throw error;
    }
}

/**
 * ✅ FIXED: Get dish by ID with connection check
 */
async function getDishById(id) {
    try {
        if (!db) {
            throw new Error('Database not connected');
        }
        
        const dish = await db.collection('dishes').findOne({ id: id });
        return dish;
    } catch (error) {
        console.error('❌ Error fetching dish:', error.message);
        throw error;
    }
}

/**
 * ✅ FIXED: Search dishes with correct field names
 */
async function searchDishes(criteria = {}) {
    try {
        if (!db) {
            throw new Error('Database not connected');
        }
        
        const query = {};
        
        // ✅ Fixed field names to match your data structure
        if (criteria.country) query.country = criteria.country;
        if (criteria.cuisine) query.country = criteria.cuisine; // Map cuisine to country
        if (criteria.spiceLevel) query.spiceLevel = criteria.spiceLevel;
        if (criteria.difficulty) query.difficulty = criteria.difficulty;
        if (criteria.mealType) query.mealType = criteria.mealType;
        if (criteria.cookingMethod) query.cookingMethod = criteria.cookingMethod;
        
        // ✅ Dietary info search
        if (criteria.dietaryInfo) {
            if (Array.isArray(criteria.dietaryInfo)) {
                query.dietaryInfo = { $in: criteria.dietaryInfo };
            } else {
                query.dietaryInfo = { $in: [criteria.dietaryInfo] };
            }
        }
        
        // ✅ Calorie range search
        if (criteria.maxCalories) {
            query.calories = { $lte: parseInt(criteria.maxCalories) };
        }
        if (criteria.minCalories) {
            query.calories = { ...query.calories, $gte: parseInt(criteria.minCalories) };
        }
        
        // ✅ Text search across multiple fields
        if (criteria.search) {
            query.$or = [
                { name: { $regex: criteria.search, $options: 'i' } },
                { description: { $regex: criteria.search, $options: 'i' } },
                { tags: { $in: [new RegExp(criteria.search, 'i')] } },
                { country: { $regex: criteria.search, $options: 'i' } },
                { region: { $regex: criteria.search, $options: 'i' } }
            ];
        }
        
        // ✅ Add sorting and limiting
        const options = {};
        if (criteria.sortBy) {
            const sortOrder = criteria.sortOrder === 'desc' ? -1 : 1;
            options.sort = { [criteria.sortBy]: sortOrder };
        }
        if (criteria.limit) {
            options.limit = parseInt(criteria.limit);
        }
        
        const dishes = await db.collection('dishes').find(query, options).toArray();
        return dishes;
        
    } catch (error) {
        console.error('❌ Error searching dishes:', error.message);
        throw error;
    }
}

/**
 * ✅ NEW: Clean up duplicate dishes
 */
 async function removeDuplicates() {
  const db = getDatabase();
  const collection = db.collection('dishes');

  const allDishes = await collection.find({}).toArray();

  const seenNames = new Set();
  const duplicateIds = [];

  for (const dish of allDishes) {
    const dishName = dish.name.trim().toLowerCase(); // normalize casing
    if (seenNames.has(dishName)) {
      duplicateIds.push(dish._id); // mark for deletion
    } else {
      seenNames.add(dishName);
    }
  }

  if (duplicateIds.length === 0) {
    return { message: "🎉 No duplicates found by name!" };
  }

  const result = await collection.deleteMany({ _id: { $in: duplicateIds } });

  return {
    message: `🧹 Removed ${result.deletedCount} duplicate dishes by name`,
    deletedCount: result.deletedCount
  };
}

// Export a function to check if DB is connected
function isDatabaseConnected() {
    return !!db;
}


// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Shutting down gracefully...');
    if (client) {
        await client.close();
        console.log('📴 MongoDB connection closed');
    }
    process.exit(0);
});

module.exports = { 
    connectToDatabase, 
    getDatabase,
    insertDishesFromJSON,
    insertMultipleFiles,
    getAllDishes,
    getDishById,
    searchDishes,
    removeDuplicates,
    isDatabaseConnected // new
};
