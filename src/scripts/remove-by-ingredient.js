const { connectDB, closeDB } = require('./utils/db');
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ingredient = process.argv[2];

if (!ingredient) {
  console.log('❌ Please provide an ingredient to search for.');
  console.log('Usage: node scripts/remove-by-ingredient.js <ingredient>');
  process.exit(1);
}

async function removeByIngredient() {
  console.log(`🔍 Searching for recipes containing "${ingredient}"...`);
  
  const db = await connectDB();
  const collection = db.collection('dishes');
  
  try {
    // Search in name AND ingredients array (which is array of objects { name, amount })
    // We need to use $elemMatch for ingredients array or regex on name
    const query = {
      $or: [
        { name: { $regex: ingredient, $options: 'i' } },
        { 
          ingredients: { 
            $elemMatch: { 
              name: { $regex: ingredient, $options: 'i' } 
            } 
          } 
        },
        // Also check if ingredients is just an array of strings (legacy/fallback)
        { ingredients: { $in: [new RegExp(ingredient, 'i')] } }
      ]
    };

    const recipes = await collection.find(query).toArray();
    
    if (recipes.length === 0) {
      console.log('✅ No matching recipes found.');
      process.exit(0);
    }
    
    console.log(`⚠️  Found ${recipes.length} recipes containing "${ingredient}":`);
    
    // Show preview
    recipes.slice(0, 10).forEach(r => console.log(`   - ${r.name} (${r.country})`));
    if (recipes.length > 10) console.log(`   ... and ${recipes.length - 10} more.`);

    rl.question(`\n🗑️  Are you sure you want to PERMANENTLY DELETE these ${recipes.length} recipes? (y/N): `, async (answer) => {
      if (answer.toLowerCase() === 'y') {
        // Backup first
        const backupPath = path.join(__dirname, '../data/logs', `removed-${ingredient}-${Date.now()}.json`);
        await fs.writeFile(backupPath, JSON.stringify(recipes, null, 2));
        console.log(`📦 Backup saved to ${backupPath}`);
        
        // Delete
        const result = await collection.deleteMany({ id: { $in: recipes.map(r => r.id) } }); // safer to delete by ID list we found
        console.log(`✅ Removed ${result.deletedCount} recipes.`);
      } else {
        console.log('❌ Operation cancelled.');
      }
      
      await closeDB();
      rl.close();
      process.exit(0);
    });

  } catch (err) {
    console.error('❌ Error:', err);
    await closeDB();
    process.exit(1);
  }
}

removeByIngredient();
