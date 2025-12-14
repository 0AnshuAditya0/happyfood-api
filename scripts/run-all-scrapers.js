const TheMealDBScraper = require('./scrapers/themealdb-scraper');
const SpoonacularScraper = require('./scrapers/spoonacular-scraper');
const EdamamScraper = require('./scrapers/edamam-scraper');

async function runAll() {
  console.log('🚀 Starting All Scrapers Pipeline...');
  const start = Date.now();

  try {
    console.log('\n════════════════════════════════');
    await new TheMealDBScraper().run();
    
    console.log('\n════════════════════════════════');
    await new SpoonacularScraper().run();

    console.log('\n════════════════════════════════');
    await new EdamamScraper().run();

    console.log('\n════════════════════════════════');
    // Basic implementation available but API is often unstable
    const RecipePuppyScraper = require('./scrapers/recipepuppy-scraper');
    await new RecipePuppyScraper().run();

  } catch (err) {
    console.error('❌ Pipeline Error:', err);
  }

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n🏁 All scrapers finished in ${duration}s`);
  process.exit(0);
}

runAll();
