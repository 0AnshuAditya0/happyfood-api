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
    
    let scriptPath;
    if (source === 'themealdb') {
        scriptPath = path.join(process.cwd(), 'scripts', 'scrapers', 'themealdb-scraper.js');
    } else if (source === 'spoonacular') {
        scriptPath = path.join(process.cwd(), 'scripts', 'scrapers', 'spoonacular-scraper.js');
    } else if (source === 'edamam') {
        scriptPath = path.join(process.cwd(), 'scripts', 'scrapers', 'edamam-scraper.js');
    } else if (source === 'cleanup') {
        scriptPath = path.join(process.cwd(), 'scripts', 'find-duplicates.js');
    } else {
        return NextResponse.json({ success: false, message: 'Invalid action/source' }, { status: 400 });
    }

    // fullPath is now scriptPath because we constructed it absolutely above
    const fullPath = scriptPath;
    
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
