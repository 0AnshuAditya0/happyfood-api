const BaseScraper = require('./base-scraper');
const UploadPipeline = require('../upload-pipeline');
const { connectDB, closeDB } = require('../utils/db');

class SpoonacularScraper extends BaseScraper {
  constructor() {
    super('Spoonacular', 1000); // 1s rate limit
    this.apiKey = process.env.SPOONACULAR_API_KEY;
    this.baseUrl = 'https://api.spoonacular.com/recipes';
  }

  async run(injectedDb) {
    console.log('🥄 Starting Spoonacular Scraper...');
    if (!this.apiKey) {
      console.error('❌ SPOONACULAR_API_KEY is missing in .env.local');
      return;
    }

    let db = injectedDb;
    let localConnection = false;

    if (!db) {
      db = await connectDB();
      localConnection = true;
    }

    this.uploadPipeline = new UploadPipeline(db);

    try {
      // Fetch random recipes since we have a daily limit
      // 50 recipes per run is safe (cost: 1 point per recipe usually, limit 150 points/day)
      // /random endpoint cost is 1 point + 0.01 per recipe? Let's assume 1 point per recipe.
      const batchSize = 10; 
      const batches = 3; // Total 30 recipes
      
      console.log(`fetching ${batches * batchSize} random recipes...`);

      let allRecipes = [];

      for (let i = 0; i < batches; i++) {
        console.log(`   Fetching batch ${i+1}/${batches}...`);
        const recipes = await this.fetchRandom(batchSize);
        if (recipes) {
          recipes.forEach(r => {
            try {
              allRecipes.push(this.transform(r));
            } catch (err) {
              console.error(`   Failed to transform ${r.title}: ${err.message}`);
            }
          });
        }
        await this.delay(this.rateLimit);
      }

      if (allRecipes.length > 0) {
        const filtered = this.applyFilters(allRecipes);
        if (filtered.length > 0) {
          await this.uploadPipeline.uploadBatch(filtered);
        }
      }

      console.log('\n✅ Spoonacular Scrape Completed!');
    } catch (error) {
      console.error('❌ Scraper failed:', error);
    } finally {
      if (localConnection) {
        await closeDB();
      }
    }
  }

  // ... (rest of methods)

}

// Allow standalone execution
if (require.main === module) {
  const scraper = new SpoonacularScraper();
  scraper.run();
}

module.exports = SpoonacularScraper;
