import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// Import scrapers directly
import TheMealDBScraper from '@/scripts/scrapers/themealdb-scraper';
import SpoonacularScraper from '@/scripts/scrapers/spoonacular-scraper';
import EdamamScraper from '@/scripts/scrapers/edamam-scraper';
import findDuplicates from '@/scripts/find-duplicates';

export const maxDuration = 300; // 5 minutes max for Vercel Pro, 10-60s for Hobby (be careful)

export async function POST(request) {
  try {
    const body = await request.json();
    
    if (body.password !== 'happyfood2024') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { source } = body;
    const db = await getDatabase();
    
    // We can't await the entire scrape because Vercel functions have short timeouts (10-60s).
    // Ideally these should be background workers (Vercel cron or QStash), but for now:
    // We will await them but assume the scraper handles internal timeouts/limits or we rely on "maxDuration" config if using Vercel Pro.
    // Given user constraints, we'll try to run it. If it times out, Vercel kills it.

    let message = '';

    if (source === 'themealdb') {
        const scraper = new TheMealDBScraper();
        // Run without awaiting fully if we want "fire and forget" usually, 
        // but Vercel freezes execution after response. So we MUST await.
        await scraper.run(db);
        message = 'TheMealDB Scrape Completed';
    } else if (source === 'spoonacular') {
        const scraper = new SpoonacularScraper();
        await scraper.run(db);
        message = 'Spoonacular Scrape Completed';
    } else if (source === 'edamam') {
        const scraper = new EdamamScraper();
        await scraper.run(db);
        message = 'Edamam Scrape Completed';
    } else if (source === 'cleanup') {
        const duplicates = await findDuplicates(db);
        message = `Cleanup Scan: Found ${duplicates.length} potential duplicates.`;
    } else {
        return NextResponse.json({ success: false, message: 'Invalid action/source' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: message
    });

  } catch (error) {
    console.error('Scrape Trigger Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to complete process: ' + error.message }, { status: 500 });
  }
}
