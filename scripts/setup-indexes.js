require('dotenv').config({ path: '.env.local' });

const { connectDB, closeDB } = require('./utils/db');

async function setupIndexes() {
  try {
    const db = await connectDB();
    const collection = db.collection('dishes');

    console.log('📊 Creating indexes...');

    // 1. Compound index for deduplication (name + country)
    // unique: false (initially) or true? User asked for "Check duplicate", but usually unique index enforces it.
    // However, clean data might not exist yet. I'll make it unique to prevent duplicates at DB level if desired,
    // but the scraping logic "Check duplicate" implies manual check. 
    // User request: "Add compound index... for deduplication" implies usage for querying. 
    // I will add it as non-unique first to avoid crashing if duplicates exist, unless "Deduplication System" implies enforcement.
    // Actually Phase 2 step 2 says: "Check duplicate... uses the index". So index is for performance of that check.
    // I'll make it background to be safe.
    await collection.createIndex({ name: 1, country: 1 }, { background: true });
    console.log('✅ Created index: { name: 1, country: 1 }');

    // 2. ID index (should be unique)
    await collection.createIndex({ id: 1 }, { unique: true, background: true });
    console.log('✅ Created index: { id: 1 } (Unique)');

    // 3. Country index
    await collection.createIndex({ country: 1 }, { background: true });
    console.log('✅ Created index: { country: 1 }');

    // 4. Difficulty index
    await collection.createIndex({ difficulty: 1 }, { background: true });
    console.log('✅ Created index: { difficulty: 1 }');

    // 5. Calories index
    await collection.createIndex({ calories: 1 }, { background: true });
    console.log('✅ Created index: { calories: 1 }');

    // 6. Tags index
    await collection.createIndex({ tags: 1 }, { background: true });
    console.log('✅ Created index: { tags: 1 }');

    // 7. Text index for search
    await collection.createIndex(
      { name: "text", description: "text" },
      { weights: { name: 2, description: 1 }, background: true }
    );
    console.log('✅ Created text index: { name: "text", description: "text" }');

    console.log('🎉 All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
    process.exit(1);
  }
}

setupIndexes();
