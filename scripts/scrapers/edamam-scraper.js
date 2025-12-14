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

  async run() {
    console.log('🥥 Starting Edamam Scraper...');
    if (!this.appId || !this.appKey) {
      console.error('❌ EDAMAM_APP_ID or EDAMAM_APP_KEY missing');
      return;
    }

    const db = await connectDB();
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
      await closeDB();
    }
  }

  async fetchRecipes(query) {
    const url = `${this.baseUrl}?type=public&q=${query}&app_id=${this.appId}&app_key=${this.appKey}`;
    const res = await fetch(url);
    if (res.status === 429) {
      console.error('❌ Edamam Rate Limit Exceeded');
      return [];
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.hits || [];
  }

  transform(raw) {
    const ingredients = raw.ingredients.map(ing => ({
      name: ing.food,
      amount: `${ing.quantity} ${ing.measure || ''}`.trim()
    }));

    // Edamam provides nutrition per serving? No, mostly total. need to check.
    // Edamam "totalNutrients" is for the whole recipe usually? 
    // And "yield" is servings.
    const servings = raw.yield || 4;
    const getNutrient = (code) => {
      const n = raw.totalNutrients[code];
      return n ? Math.round(n.quantity / servings) : 0;
    };

    return {
      id: `edamam-${raw.uri.split('_')[1] || Date.now()}`,
      name: raw.label,
      description: `A healthy ${raw.cuisineType?.[0] || 'delicious'} dish provided by Edamam.`,
      country: raw.cuisineType?.[0] || 'International',
      region: null,
      tags: [...(raw.dishType || []), ...(raw.mealType || [])],
      difficulty: 'Medium', // Edamam doesn't provide difficulty
      calories: Math.round(raw.calories / servings),
      protein: getNutrient('PROCNT'),
      carbs: getNutrient('CHOCDF'),
      fat: getNutrient('FAT'),
      fiber: getNutrient('FIBTG'),
      
      dietaryInfo: [...(raw.healthLabels || []), ...this.detectDietaryInfo(ingredients)],
      spiceLevel: 'Medium',
      allergens: [...(raw.cautions || []), ...this.detectAllergens(ingredients)],
      cookingMethod: 'Various',
      mealType: raw.mealType?.[0] || 'Dinner',
      season: 'All',
      instructions: raw.url ? `See full instructions at ${raw.url}` : 'No instructions available.',
      variations: [],
      cookTime: raw.totalTime || 30,
      servings: servings,
      source: raw.source || 'Edamam',
      image: raw.image
    };
  }
}

if (require.main === module) {
  const scraper = new EdamamScraper();
  scraper.run();
}

module.exports = EdamamScraper;
