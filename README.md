# HappyFood API

Welcome to **HappyFood API**! 🍽️

A modern, feature-rich RESTful API for discovering, filtering, and sharing global recipes. Built with Node.js, Express, and MongoDB, HappyFood API is designed for speed, flexibility, and developer happiness.

---

## 🚀 Features
- Get, search, and filter thousands of recipes from around the world
- Advanced filtering (diet, allergens, nutrition, etc.)
- Fuzzy search for user-friendly queries
- Pagination with next/prev links
- Recipe sharing endpoint (user submissions)
- Image hosting via Cloudinary (free tier)
- In-memory caching for fast responses
- Gzip compression for efficient data transfer
- Robust error logging with Winston
- Health check endpoint

---

## 📚 Endpoints Overview

| Method | Endpoint                        | Description                                 |
|--------|----------------------------------|---------------------------------------------|
| GET    | `/api/dishes`                   | List all recipes (with filtering, pagination)|
| GET    | `/api/dishes/:id`               | Get a specific recipe by ID                 |
| GET    | `/api/dishes/search?q=term`     | Search recipes (fuzzy, multi-field)         |
| GET    | `/api/dishes/country/:country`  | Get recipes by country                      |
| GET    | `/api/dishes/dietary/:diet`     | Get recipes by dietary requirement          |
| GET    | `/api/dishes/allergens/:allergen`| Allergen-free recipes                      |
| GET    | `/api/dishes/meal-type/:type`   | Get recipes by meal type                    |
| GET    | `/api/dishes/difficulty/:level` | Get recipes by difficulty                   |
| GET    | `/api/dishes/spice/:level`      | Get recipes by spice level                  |
| GET    | `/api/dishes/cooking-method/:method` | By cooking method                     |
| GET    | `/api/dishes/similar/:id`       | Get similar recipes                         |
| GET    | `/api/dishes/seasonal`          | Get seasonal recipes                        |
| GET    | `/api/dishes/healthy`           | Get healthy recipes                         |
| GET    | `/api/dishes/quick`             | Get quick/easy recipes                      |
| GET    | `/api/stats/countries`          | Recipe stats by country                     |
| GET    | `/api/stats/nutritional`        | Nutritional stats                           |
| GET    | `/api/random`                   | Get a random recipe                         |
| POST   | `/api/recipes/share`            | Share a new recipe (user submission)        |
| GET    | `/health`                       | Health check (DB status)                    |

---

## ⚡️ Quick Start

1. **Clone the repo:**
   ```bash
   git clone https://github.com/yourusername/happyfood-api.git
   cd happyfood-api
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your MongoDB and Cloudinary credentials.
4. **Start the server:**
   ```bash
   npm start
   ```
5. **Visit:** [http://localhost:3000/api/dishes](http://localhost:3000/api/dishes)

---

## 🛠️ Usage Examples

**Get all dishes (first page):**
```bash
curl http://localhost:3000/api/dishes
```

**Search for "pizza":**
```bash
curl "http://localhost:3000/api/dishes/search?q=pizza"
```

**Share a new recipe (example):**
```bash
curl -X POST http://localhost:3000/api/recipes/share \
  -H "Content-Type: application/json" \
  -d '{ "name": "My Special Pasta", "ingredients": [...], ... }'
```

---

## 🖼️ Image Hosting
- All recipe images are hosted on [Cloudinary](https://cloudinary.com/) (free tier).
- When sharing a recipe, upload your image and include the Cloudinary URL in your submission.
- No images are stored in the database—only URLs.

---

## 🚦 Caching & Performance
- Popular endpoints are cached in-memory for fast responses (using `node-cache`).
- All responses are compressed with gzip for efficient transfer.
- Async/await is used throughout for non-blocking performance.

---

## 🩺 Health & Logging
- Check `/health` for real-time DB status.
- All errors and important events are logged with Winston (see `logs/error.log`).

---

## 👤 About Me
**HappyFood API** is built and maintained by Anshu Baka.

- 📧 Email: anshubaka2004@gmail.com

---

## 📄 License
MIT (or your preferred license)

---

## 🙌 Contributions
Pull requests and suggestions are welcome! Open an issue or submit a PR to help improve HappyFood API. 