const BaseScraper = require('./base-scraper');
const UploadPipeline = require('../upload-pipeline');
const { connectDB, closeDB } = require('../utils/db');

class TheMealDBScraper extends BaseScraper {
  constructor() {
    super('TheMealDB', 200); // 200ms rate limit
    this.baseUrl = 'https://www.themealdb.com/api/json/v1/1';
    this.categories = [
      'Beef', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 
      'Vegetarian', 'Breakfast', 'Goat', 'Vegan', 'Side', 'Starter'
    ];
  }

  /**
   * Main execution method
   * @param {Object} [injectedDb] - Optional injected DB connection
   */
  async run(injectedDb) {
    console.log('🥣 Starting TheMealDB Scraper...');
    
    // Connect to DB or use injected
    let db = injectedDb;
    let localConnection = false;

    if (!db) {
        db = await connectDB();
        localConnection = true;
    }

    this.uploadPipeline = new UploadPipeline(db);
    
    try {
      for (let i = 0; i < this.categories.length; i++) {
        const category = this.categories[i];
        console.log(`\n📂 Processing Category: ${category} (${i + 1}/${this.categories.length})`);
        
        // 1. Fetch Summary List
        const summaries = await this.fetchCategory(category);
        console.log(`   Found ${summaries.length} recipes in ${category}`);
        
        let recipes = [];
        
        const { shouldExclude } = require('../config/filters');
        
        // 2. Fetch Details for each
        for (let j = 0; j < summaries.length; j++) {
          const summary = summaries[j];
          
          // Early filter by name
          if (shouldExclude({ name: summary.strMeal })) {
            process.stdout.write('x'); // x for excluded
            continue;
          }

          // Rate limit
          await this.delay(this.rateLimit);
          
          try {
            const raw = await this.fetchDetail(summary.idMeal);
            if (raw) {
              const transformed = this.transform(raw, category);
              recipes.push(transformed);
              
              if ((j + 1) % 10 === 0) process.stdout.write('.');
            }
          } catch (err) {
            console.error(`\n   ❌ Failed to fetch meal ${summary.idMeal}: ${err.message}`);
          }
        }
        console.log(''); // Newline
        
        // 3. Upload Batch
        if (recipes.length > 0) {
          const filtered = this.applyFilters(recipes);
          if (filtered.length > 0) {
            await this.uploadPipeline.uploadBatch(filtered);
          }
        }
      }
      
      console.log('\n✅ TheMealDB Scrape Completed!');
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

// Allow standalone execution only if directly run
if (require.main === module) {
  const scraper = new TheMealDBScraper();
  scraper.run();
}

module.exports = TheMealDBScraper;
