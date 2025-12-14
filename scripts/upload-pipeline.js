const fs = require('fs').promises;
const path = require('path');
const Joi = require('joi');
const Joi = require('joi');
const stringSimilarity = require('string-similarity');
const { validateDish } = require('./utils/dish.schema');
const logger = require('../../src/lib/activity-logger');

class UploadPipeline {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('dishes');
    this.logsDir = path.join(__dirname, '../data/logs');
    this.failedPath = path.join(this.logsDir, 'failed-recipes.json');
    this.validateDish = validateDish;
  }

  async init() {
    // Ensure logs dir exists
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }

  async checkDuplicate(recipe) {
    // 1. Exact match check (name + country)
    const exactMatch = await this.collection.findOne({
      name: recipe.name,
      country: recipe.country
    });

    if (exactMatch) return { isDuplicate: true, type: 'exact' };

    // 2. Fuzzy matching
    // Find recipes from same country to limit search space
    // Optimization: Only select name to reduce data transfer
    const sameCountryRecipes = await this.collection
      .find({ country: recipe.country })
      .project({ name: 1 })
      .toArray();
    
    // Check similarity
    for (const existing of sameCountryRecipes) {
      const similarity = stringSimilarity.compareTwoStrings(
        (recipe.name || '').toLowerCase(),
        (existing.name || '').toLowerCase()
      );
      
      if (similarity > 0.85) {
        console.log(`⚠️  Similar: "${recipe.name}" vs "${existing.name}" (${(similarity * 100).toFixed(0)}% match)`);
        return { isDuplicate: true, type: 'fuzzy' };
      }
    }

    return { isDuplicate: false };
  }

  async uploadBatch(recipes, batchSize = 50) {
    if (!this.validateDish) await this.init();

    const stats = {
      total: recipes.length,
      success: 0,
      failed: 0,
      exactDuplicates: 0,
      fuzzyDuplicates: 0,
      batchCount: Math.ceil(recipes.length / batchSize)
    };

    const batches = this.chunkArray(recipes, batchSize);

    console.log(`🚀 Starting upload of ${recipes.length} recipes in ${stats.batchCount} batches...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 Processing Batch ${i + 1}/${stats.batchCount} (${batch.length} items)...`);

      for (const recipe of batch) {
        try {
          // 1. Check Duplicate
          const dupResult = await this.checkDuplicate(recipe);
          if (dupResult.isDuplicate) {
            if (dupResult.type === 'exact') stats.exactDuplicates++;
            if (dupResult.type === 'fuzzy') stats.fuzzyDuplicates++;
            
            if (dupResult.type === 'exact') {
               console.log(`⚠️  Duplicate (Exact): "${recipe.name}" (${recipe.country})`);
               // Log exact duplicate
               await logger.log('duplicate', `Exact duplicate skipped: ${recipe.name}`, { country: recipe.country, type: 'exact' });
            } else if (dupResult.type === 'fuzzy') {
               // Log fuzzy duplicate (already logged to console in checkDuplicate)
               await logger.log('duplicate', `Fuzzy duplicate skipped: ${recipe.name}`, { country: recipe.country, type: 'fuzzy' });
            }
            continue;
          }

          // 2. Validate Schema
          const { error, value } = this.validateDish(recipe);
          if (error) {
            throw new Error(`Validation Error: ${error.message}`);
          }

          // 3. Insert
          await this.collection.insertOne(value);
          stats.success++;
          console.log(`✅ Uploaded: "${value.name}"`);

        } catch (err) {
          stats.failed++;
          console.error(`❌ Failed: "${recipe.name}" - ${err.message}`);
          await logger.log('error', `Upload failed: ${recipe.name}`, { error: err.message });
          await this.saveFailedRecipe(recipe, err.message);
        }
      }

      // Delay between batches
      if (i < batches.length - 1) {
        console.log(`⏳ Waiting 2 seconds...`);
        await this.delay(2000);
      }
    }

    this.logSummary(stats);
    
    await logger.log('scrape', `Batch upload processed`, { 
      total: stats.total, 
      success: stats.success, 
      duplicates: stats.exactDuplicates + stats.fuzzyDuplicates,
      failed: stats.failed 
    });

    return stats;
  }

  async resumeUpload(failedJsonPath) {
    try {
      const content = await fs.readFile(failedJsonPath, 'utf8');
      const failedData = JSON.parse(content);
      const recipes = failedData.map(f => f.recipe);
      
      console.log(`🔄 Resuming upload for ${recipes.length} recipes from ${failedJsonPath}`);
      return await this.uploadBatch(recipes);
    } catch (err) {
      console.error(`❌ Could not read failed recipes file: ${err.message}`);
    }
  }

  async saveFailedRecipe(recipe, reason) {
    const entry = {
      recipe,
      reason,
      timestamp: new Date().toISOString()
    };
    
    let current = [];
    try {
      const data = await fs.readFile(this.failedPath, 'utf8');
      current = JSON.parse(data);
    } catch {
      // ignore
    }
    
    current.push(entry);
    await fs.writeFile(this.failedPath, JSON.stringify(current, null, 2));
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  logSummary(stats) {
    console.log('\n════════════════════════════════');
    console.log('📊 Upload Summary');
    console.log('════════════════════════════════');
    console.log(`Total Processed:   ${stats.total}`);
    console.log(`✅ Success:         ${stats.success}`);
    console.log(`⚠️  Exact Dups:      ${stats.exactDuplicates}`);
    console.log(`⚠️  Fuzzy Dups:      ${stats.fuzzyDuplicates}`);
    console.log(`❌ Failed:          ${stats.failed}`);
    console.log('════════════════════════════════\n');
  }
}

module.exports = UploadPipeline;
