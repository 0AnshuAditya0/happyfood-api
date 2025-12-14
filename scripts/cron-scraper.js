const cron = require('node-cron');
const { exec } = require('child_process');

console.log('🕰️  Cron Job Service Started');
console.log('📅 Schedule: Every day at 2:00 AM');

// Run every day at 2:00 AM
cron.schedule('0 2 * * *', () => {
  console.log('⏰ Starting Daily Scrape Job...');
  
  exec('node scripts/run-all-scrapers.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Cron Job Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️  Stderr: ${stderr}`);
    }
    console.log(`✅ Job Output:\n${stdout}`);
  });
});

// Run a small scrape immediately on start to verify
// console.log('🧪 Running meaningful start-up test...');
// require('./scrapers/themealdb-scraper').run();
