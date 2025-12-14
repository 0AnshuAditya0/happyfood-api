# 🍽️ HappyFood Scraper System Guide

## 1. Project Overview
HappyFood API is a comprehensive aggregator of recipe data from multiple sources (TheMealDB, Spoonacular, Edamam, etc.). This system automates the fetching, normalization, and deduplication of food data.

## 2. Architecture
```
[External APIs] 
    ⬇️
[Scrapers (scripts/scrapers/)] -> (Normalize Data) -> (Apply Filters)
    ⬇️
[Upload Pipeline] -> (Deduplicate) -> (Validate Schema)
    ⬇️
[MongoDB Database]
    ⬇️
[Next.js API] -> (Admin Dashboard / Public API)
```

## 3. Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas (or local)
- API Keys for sources

### Environment Variables
See `.env.example` for full list.
- `MONGO_URI`: Connection string
- `SPOONACULAR_API_KEY`: Key for Spoonacular
- `EDAMAM_APP_ID`: App ID for Edamam
- `EDAMAM_APP_KEY`: Key for Edamam

## 4. Scraper System

### How it works
Each scraper (e.g., `themealdb-scraper.js`) extends `BaseScraper`.
1. **Fetch**: Gets data from external API.
2. **Transform**: Converts to standard `dish.schema.js` format.
3. **Filter**: Removes unwanted items (e.g. "pork", "beef") based on `scripts/config/filters.js`.
4. **Upload**: Passes to `UploadPipeline` which handles duplicate checking and insertion.

### Adding a New Scraper
1. Create `scripts/scrapers/your-source-scraper.js`.
2. Extend `BaseScraper`.
3. Implement `scrape()` method.
4. Use `transformDish()` to map fields.
5. Add to `scripts/run-all-scrapers.js`.

## 5. Running Scrapers

### Manual Execution
Run individual scrapers or all at once:
```bash
# Run specific scraper
npm run scrape:themealdb
npm run scrape:spoonacular

# Run all
npm run scrape:all
```

### Admin Dashboard
Login to `/admin` (Password: `happyfood2024`) to trigger scrapers via UI.

## 6. API Documentation

### Public Endpoints
- **GET /api/dishes**: List dishes with filtering.
  - Params: `page`, `limit`, `search`, `country`, `difficulty`
- **GET /api/dishes/:id**: Get single dish details.

### Admin Endpoints (Protected)
- **POST /api/admin/stats**: Get dashboard stats.
- **POST /api/admin/scrape**: Trigger scraper process.

## 7. Data Quality & Maintenance

### Duplicate Detection
The system uses "Fuzzy Matching" (Dice's Coefficient) to find similar titles.
- **Auto-check**: Runs during upload. Exact matches skipped.
- **Manual Scan**: Run `npm run find:duplicates` to generate a report of potential fuzzy matches.

### Bad Data Cleanup
To remove recipes containing a specific ingredient:
```bash
npm run remove:ingredient "pork"
```
This creates a backup before deletion.

## 8. Troubleshooting
- **Scraper 429 Errors**: Rate limits hit. Increase `this.rateLimit` in scraper class.
- **MongoDB Connection Errors**: Check IP whitelist in Atlas.
- **Next.js Image Errors**: Add domain to `next.config.js` `images.remotePatterns`.
