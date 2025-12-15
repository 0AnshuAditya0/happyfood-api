import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();
    
    if (body.password !== 'happyfood2024') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { source } = body;
    
    // Define script names only; rely on runtime caching of process.cwd()
    const scriptMap = {
      themealdb: 'scripts/scrapers/themealdb-scraper.js',
      spoonacular: 'scripts/scrapers/spoonacular-scraper.js',
      edamam: 'scripts/scrapers/edamam-scraper.js',
      cleanup: 'scripts/find-duplicates.js'
    };

    if (!scriptMap[source]) {
        return NextResponse.json({ success: false, message: 'Invalid action/source' }, { status: 400 });
    }

    const relativeScriptPath = scriptMap[source];
    // Use path.resolve to ensure absolute path, but do it in a way that bundlers ignore
    // process.cwd() is safe at runtime.
    const fullPath = path.resolve(process.cwd(), relativeScriptPath);
    
    console.log(`[Admin] Spawning: node ${fullPath}`);

    const child = spawn('node', [fullPath], {
      detached: true,
      stdio: 'ignore', // Ignore output, or redirect to a log file if needed
      cwd: process.cwd()
    });
    
    child.unref();

    return NextResponse.json({
      success: true,
      message: `Started ${source} process.`
    });

  } catch (error) {
    console.error('Scrape Trigger Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to start process' }, { status: 500 });
  }
}
