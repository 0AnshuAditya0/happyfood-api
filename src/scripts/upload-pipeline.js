const fs = require('fs').promises;
const path = require('path');
const Joi = require('joi');

const stringSimilarity = require('string-similarity');
const { validateDish } = require('./utils/dish.schema');
const logger = require('../lib/activity-logger');

class UploadPipeline {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('dishes');
    this.logsDir = path.join(__dirname, '../data/logs');
    this.failedPath = path.join(this.logsDir, 'failed-recipes.json');
    this.validateDish = validateDish;
  }

  async init() {
    // Ensure logs dir exists - skip in Vercel/serverless if read-only
    if (process.env.VERCEL) return;
    
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') console.warn('⚠️ Could not create logs directory:', err.message);
    }
  }

  // ... (checkDuplicate and uploadBatch remain mostly the same, but logging calls need care) ...

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
    // Skip file writing in Vercel/Serverless environment
    if (process.env.VERCEL) {
        console.warn(`[Vercel] Failed recipe not saved to disk: ${recipe.name} (${reason})`);
        return;
    }

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
    
    try {
        await fs.writeFile(this.failedPath, JSON.stringify(current, null, 2));
    } catch (err) {
        console.warn(`⚠️ Failed to save failed recipe to disk: ${err.message}`);
    }
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
