# 🌿 HappyFood API

A powerful, optimized, and developer-friendly Recipe & Food Data API built with Next.js 15 and MongoDB.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## ✨ Features

- **🚀 High Performance**: Optimized API with pagination, text search caching, and SWR hooks.
- **🧹 Data Quality**: Automated deduplication (fuzzy matching) and content filtering.
- **🔐 Admin Dashboard**: Monitor stats, trigger scrapers, and manage data quality.
- **📦 Multi-Source**: Aggregates data from TheMealDB, Spoonacular, Edamam, and RecipePuppy.
- **🛠️ Developer Ready**: Detailed documentation, clean architecture, and easy deployment.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB Atlas
- **Styling**: Tailwind CSS
- **Scraping**: Node.js scripts
- **Validation**: Joi schemas

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/0AnshuAditya0/happyfood-api.git
   cd happyfood-api
   npm install
   ```

2. **Setup Env**
   Copy `.env.example` to `.env.local` and fill in your keys.

3. **Run Database Setup**
   ```bash
   npm run setup:indexes
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## 🤖 Available Scripts

- `npm run dev`: Start dev server.
- `npm run scrape:all`: Run all scrapers.
- `npm run find:duplicates`: Scan database for duplicates.
- `npm run remove:ingredient`: Remove recipes by ingredient.

## 📚 API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dishes` | GET | List recipes (supports search, sort, filter) |
| `/api/dishes/:id` | GET | Get full recipe details |
| `/api/health` | GET | Check API health status |

## 🛡️ Admin Dashboard

Access the admin dashboard at `/admin` to monitor system health and trigger manual actions.
**Default Password**: `happyfood2024`

## 🤝 Contributing

Contributions are welcome! Please read `SCRAPER_GUIDE.md` for architecture details.

## 📄 License

MIT License.