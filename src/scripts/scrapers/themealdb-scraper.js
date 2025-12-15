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

  async fetchCategory(category) {
    const url = `${this.baseUrl}/filter.php?c=${category}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.meals || [];
  }

  async fetchDetail(id) {
    const url = `${this.baseUrl}/lookup.php?i=${id}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.meals && data.meals[0] ? data.meals[0] : null;
  }

  transform(raw, category) {
    const ingredients = [];
    
    // Extract 20 ingredients
    for (let i = 1; i <= 20; i++) {
      const name = raw[`strIngredient${i}`];
      const measure = raw[`strMeasure${i}`];
      
      if (name && name.trim()) {
        ingredients.push({
          name: name.trim(),
          amount: measure ? measure.trim() : 'to taste'
        });
      }
    }

    const instructions = raw.strInstructions || '';
    
    // Use helpers
    const allergens = this.detectAllergens(ingredients);
    const dietaryInfo = this.detectDietaryInfo(ingredients, category);
    
    return {
      id: `themealdb-${raw.idMeal}`,
      name: raw.strMeal,
      description: `A delicious ${category} dish from ${raw.strArea || 'Unknown'}.`,
      country: raw.strArea || 'International',
      region: raw.strArea || null,
      tags: raw.strTags ? raw.strTags.split(',').map(t => t.trim()) : [category.toLowerCase()],
      difficulty: this.estimateDifficulty(instructions),
      calories: this.estimateCalories(ingredients),
      // Basic nutrition estimation (randomized / placeholders as we don't have real data)
      protein: Math.floor(Math.random() * 30 + 10),
      carbs: Math.floor(Math.random() * 50 + 20),
      fat: Math.floor(Math.random() * 20 + 5),
      fiber: Math.floor(Math.random() * 10 + 2),
      
      dietaryInfo: dietaryInfo,
      spiceLevel: 'Medium', // Default
      allergens: allergens,
      cookingMethod: 'Stovetop', // Default
      mealType: category,
      season: 'All',
      instructions: instructions,
      variations: [],
      cookTime: this.estimateCookTime(instructions),
      servings: 4, // Default
      source: raw.strSource || 'TheMealDB',
      image: raw.strMealThumb
    };
  }

}

// Allow standalone execution only if directly run
if (require.main === module) {
  const scraper = new TheMealDBScraper();
  scraper.run();
}

module.exports = TheMealDBScraper;
