const BaseScraper = require('./base-scraper');
const UploadPipeline = require('../upload-pipeline');
const { connectDB, closeDB } = require('../utils/db');

class SpoonacularScraper extends BaseScraper {
  constructor() {
    super('Spoonacular', 1000); // 1s rate limit
    this.apiKey = process.env.SPOONACULAR_API_KEY;
    this.baseUrl = 'https://api.spoonacular.com/recipes';
  }

  async run() {
    console.log('🥄 Starting Spoonacular Scraper...');
    if (!this.apiKey) {
      console.error('❌ SPOONACULAR_API_KEY is missing in .env.local');
      return;
    }

    const db = await connectDB();
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
      await closeDB();
    }
  }

  async fetchRandom(number) {
    const url = `${this.baseUrl}/random?number=${number}&apiKey=${this.apiKey}&includeNutrition=true`;
    const res = await fetch(url);
    if (res.status === 402) {
      console.error('❌ Spoonacular Quota Exceeded');
      return [];
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.recipes || [];
  }

  transform(raw) {
    const ingredients = raw.extendedIngredients.map(ing => ({
      name: ing.nameClean || ing.name,
      amount: `${ing.amount} ${ing.unit}`
    }));
    
    // Instructions might be HTML or simple text
    let instructions = raw.instructions || raw.summary || 'No instructions provided.';
    instructions = instructions.replace(/<[^>]*>?/gm, ''); // Strip HTML tags

    const description = raw.summary ? raw.summary.replace(/<[^>]*>?/gm, '').substring(0, 200) + '...' : raw.title;

    return {
      id: `spoonacular-${raw.id}`,
      name: raw.title,
      description: description,
      country: 'International', // Spoonacular mostly doesn't enforce country, usually Western
      region: null,
      tags: raw.dishTypes || [],
      difficulty: this.estimateDifficulty(instructions),
      calories: raw.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || this.estimateCalories(ingredients),
      protein: raw.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
      carbs: raw.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
      fat: raw.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0,
      fiber: raw.nutrition?.nutrients?.find(n => n.name === 'Fiber')?.amount || 0,
      
      dietaryInfo: [...(raw.diets || []), ...this.detectDietaryInfo(ingredients)],
      spiceLevel: 'Medium',
      allergens: this.detectAllergens(ingredients),
      cookingMethod: 'Various',
      mealType: raw.dishTypes && raw.dishTypes.length > 0 ? raw.dishTypes[0] : 'Dinner',
      season: 'All',
      instructions: instructions,
      variations: [],
      cookTime: raw.readyInMinutes || 30,
      servings: raw.servings || 4,
      source: raw.sourceUrl || 'Spoonacular',
      image: raw.image
    };
  }
}

if (require.main === module) {
  const scraper = new SpoonacularScraper();
  scraper.run();
}

module.exports = SpoonacularScraper;
