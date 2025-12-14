const fs = require('fs').promises;
const path = require('path');

// Ensure log directory is correct relative to where this script might be imported from.
// Since it's used by both scripts (root/scripts) and Next.js (root/src), 
// process.cwd() is the safest bet for the project root in standard executions.
const LOG_FILE = path.join(process.cwd(), 'data/logs/activity.json');
const MAX_ENTRIES = 100;

async function log(type, message, metadata = {}) {
  try {
    let logs = [];
    try {
      const content = await fs.readFile(LOG_FILE, 'utf8');
      logs = JSON.parse(content);
    } catch (err) {
      // File doesn't exist yet or is corrupt, start fresh
      await fs.mkdir(path.dirname(LOG_FILE), { recursive: true }).catch(() => {});
    }
    
    logs.unshift({
      timestamp: new Date().toISOString(),
      type, // 'scrape', 'filter', 'duplicate', 'api', 'error'
      message,
      metadata
    });
    
    // Keep only last MAX_ENTRIES
    if (logs.length > MAX_ENTRIES) {
      logs = logs.slice(0, MAX_ENTRIES);
    }
    
    await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    // Fail silently to not impact main flow, but print to stderr
    console.error('Activity log error:', error.message);
  }
}

module.exports = { log };
