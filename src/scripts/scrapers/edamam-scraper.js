const BaseScraper = require('./base-scraper');
const UploadPipeline = require('../upload-pipeline');
const { connectDB, closeDB } = require('../utils/db');

class EdamamScraper extends BaseScraper {
  constructor() {
    super('Edamam', 6000); // 6s rate limit (Free tier 10/min)
    this.appId = process.env.EDAMAM_APP_ID;
    this.appKey = process.env.EDAMAM_APP_KEY;
    this.baseUrl = 'https://api.edamam.com/api/recipes/v2';
    this.queries = ['chicken', 'salad', 'soup', 'pasta', 'fish'];
  }

  async run(injectedDb) {
    console.log('🥥 Starting Edamam Scraper...');
    if (!this.appId || !this.appKey) {
      console.error('❌ EDAMAM_APP_ID or EDAMAM_APP_KEY missing');
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
      const query = this.queries[Math.floor(Math.random() * this.queries.length)];
      console.log(`   Searching for: ${query}`);
      
      const recipes = await this.fetchRecipes(query);
      
      let transformedList = [];
      recipes.forEach(r => {
        try {
          transformedList.push(this.transform(r.recipe));
        } catch (err) {
          console.error(`   Failed to transform ${r.recipe.label}: ${err.message}`);
        }
      });

      if (transformedList.length > 0) {
        const filtered = this.applyFilters(transformedList);
        if (filtered.length > 0) {
           await this.uploadPipeline.uploadBatch(filtered);
        }
      }

      console.log('\n✅ Edamam Scrape Completed!');
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

if (require.main === module) {
  const scraper = new EdamamScraper();
  scraper.run();
}

module.exports = EdamamScraper;
