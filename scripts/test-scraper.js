const TheMealDBScraper = require('./scrapers/themealdb-scraper');

async function testScraper() {
  console.log('🧪 Starting Scraper Test (Breakfast Only)...');
  
  const scraper = new TheMealDBScraper();
  
  // Override categories for testing
  scraper.categories = ['Breakfast'];
  
  await scraper.run();
}

testScraper();
