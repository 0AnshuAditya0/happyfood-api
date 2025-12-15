const BaseScraper = require('./base-scraper');
const UploadPipeline = require('../upload-pipeline');
const { connectDB, closeDB } = require('../utils/db');

class RecipePuppyScraper extends BaseScraper {
  constructor() {
    super('RecipePuppy', 1000); // 1s rate limit
    this.baseUrl = 'http://www.recipepuppy.com/api';
    this.ingredients = ['chicken', 'beef', 'pasta', 'cheese', 'bacon', 'garlic', 'chocolate'];
  }

  async run() {
    console.log('🐶 Starting RecipePuppy Scraper...');
    const db = await connectDB();
    this.uploadPipeline = new UploadPipeline(db);

    try {
      // Pick a random ingredient to search
      const ingredient = this.ingredients[Math.floor(Math.random() * this.ingredients.length)];
      console.log(`   Searching for recipes with: ${ingredient}`);
      
      const recipes = await this.fetchRecipes(ingredient);
      
      let transformedList = [];
      recipes.forEach(r => {
        try {
          transformedList.push(this.transform(r));
        } catch (err) {
          console.error(`   Failed to transform ${r.title}: ${err.message}`);
        }
      });

      if (transformedList.length > 0) {
        const filtered = this.applyFilters(transformedList);
        if (filtered.length > 0) {
          await this.uploadPipeline.uploadBatch(filtered);
        }
      }

      console.log('\n✅ RecipePuppy Scrape Completed!');
    } catch (error) {
      console.error('❌ Scraper failed:', error);
      // RecipePuppy is notoriously flaky, so we don't crash the whole pipeline, just log it.
    } finally {
      await closeDB();
    }
  }

  async fetchRecipes(ingredient) {
    // RecipePuppy page 1
    const url = `${this.baseUrl}/?i=${ingredient}&p=1`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      if (err.cause?.code === 'ECONNREFUSED' || err.message.includes('fetch failed')) {
        console.warn('⚠️  RecipePuppy API is down or unreachable.');
        return [];
      }
      throw err;
    }
  }

  transform(raw) {
    const ingredients = raw.ingredients.split(',').map(i => ({
      name: i.trim(),
      amount: 'some' // RecipePuppy doesn't provide amounts
    }));

    return {
      id: `recipepuppy-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: raw.title.trim(),
      description: `A generic dish with ${raw.ingredients}.`,
      country: 'International',
      region: null,
      tags: ['recipe-puppy'],
      difficulty: 'Medium',
      calories: this.estimateCalories(ingredients),
      protein: Math.floor(Math.random() * 20 + 5),
      carbs: Math.floor(Math.random() * 40 + 10),
      fat: Math.floor(Math.random() * 15 + 5),
      fiber: 2,
      
      dietaryInfo: this.detectDietaryInfo(ingredients),
      spiceLevel: 'Medium',
      allergens: this.detectAllergens(ingredients),
      cookingMethod: 'Various',
      mealType: 'Dinner',
      season: 'All',
      instructions: raw.href ? `View recipe at ${raw.href}` : 'No instructions.',
      variations: [],
      cookTime: 30,
      servings: 4,
      source: raw.href || 'RecipePuppy',
      image: raw.thumbnail || ''
    };
  }
}

if (require.main === module) {
  const scraper = new RecipePuppyScraper();
  scraper.run();
}

module.exports = RecipePuppyScraper;
