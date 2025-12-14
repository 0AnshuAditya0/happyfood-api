const { connectDB, closeDB } = require('./utils/db');
const stringSimilarity = require('string-similarity');
const fs = require('fs').promises;
const path = require('path');

async function findDuplicates() {
  console.log('🔍 Starting Duplicate Search...');
  
  const db = await connectDB();
  const collection = db.collection('dishes');
  const logsPath = path.join(__dirname, '../data/logs/potential-duplicates.json');
  
  try {
    // 1. Fetch all recipes
    const recipes = await collection.find({}, { projection: { id: 1, name: 1, country: 1 } }).toArray();
    console.log(`📦 Scanning ${recipes.length} recipes...`);

    // Group by country to optimize
    const byCountry = {};
    recipes.forEach(r => {
      const country = r.country || 'Unknown';
      if (!byCountry[country]) byCountry[country] = [];
      byCountry[country].push(r);
    });

    const potentialDuplicates = [];
    const threshold = 0.85;

    // 2. Scan each country group
    for (const [country, list] of Object.entries(byCountry)) {
      if (list.length < 2) continue;
      
      // Compare each pair
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const r1 = list[i];
          const r2 = list[j];
          
          const similarity = stringSimilarity.compareTwoStrings(
            r1.name.toLowerCase(),
            r2.name.toLowerCase()
          );

          if (similarity > threshold) {
            potentialDuplicates.push({
              recipe1: { id: r1.id, name: r1.name },
              recipe2: { id: r2.id, name: r2.name },
              similarity: parseFloat(similarity.toFixed(2)),
              country
            });
            process.stdout.write('⚠️'); // indicate match
          }
        }
      }
    }

    // 3. Output results
    console.log('\n');
    if (potentialDuplicates.length > 0) {
      await fs.mkdir(path.dirname(logsPath), { recursive: true });
      await fs.writeFile(logsPath, JSON.stringify(potentialDuplicates, null, 2));
      console.log(`✅ Found ${potentialDuplicates.length} potential duplicates.`);
      console.log(`📄 Detailed Report: ${logsPath}`);
      
      // Preview first 3
      console.log('\n👀 Preview:');
      potentialDuplicates.slice(0, 3).forEach(d => {
        console.log(`   "${d.recipe1.name}" == "${d.recipe2.name}" (${(d.similarity*100).toFixed(0)}%)`);
      });
    } else {
      console.log('✅ No duplicates found!');
    }

  } catch (err) {
    console.error('❌ Error finding duplicates:', err);
  } finally {
    await closeDB();
    process.exit(0);
  }
}

findDuplicates();
