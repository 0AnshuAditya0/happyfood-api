export default function Docs() {
  return (
    <div className="min-h-screen bg-[#fefdf8]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#10b981] rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🌿</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1f2937]">FoodAPI</h1>
                <p className="text-[#6b7280] text-xs">API Documentation</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <a href="/" className="text-[#6b7280] hover:text-[#1f2937] transition-colors text-sm">Home</a>
              <a href="/dashboard" className="text-[#6b7280] hover:text-[#1f2937] transition-colors text-sm">Dashboard</a>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#1f2937] mb-4">
            API Documentation
          </h2>
          <p className="text-[#6b7280] max-w-2xl mx-auto">
            Simple, powerful REST API for discovering global recipes.
            Built for developers who love food.
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-[#1f2937] mb-6">Quick Start</h3>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="space-y-4">
              <div>
                <div className="text-[#6b7280] text-sm mb-2">Get all dishes:</div>
                <code className="text-green-700 font-mono text-sm block bg-[#f8f9fa] p-3 rounded border border-slate-200">
                  GET /api/dishes
                </code>
              </div>
              <div>
                <div className="text-[#6b7280] text-sm mb-2">Search recipes:</div>
                <code className="text-green-700 font-mono text-sm block bg-[#f8f9fa] p-3 rounded border border-slate-200">
                  GET /api/dishes/search?q=pizza
                </code>
              </div>
              <div>
                <div className="text-[#6b7280] text-sm mb-2">Get specific dish:</div>
                <code className="text-green-700 font-mono text-sm block bg-[#f8f9fa] p-3 rounded border border-slate-200">
                  GET /api/dishes/pizza-001-margherita-pizza
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Example Response */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-[#1f2937] mb-6">Example Response</h3>
          <div className="bg-white border border-slate-200 rounded-xl p-6 overflow-x-auto">
            <pre className="text-sm font-mono text-[#1f2937] whitespace-pre-wrap">
{`{
  "id": "themealdb-52820-axein1y5",
  "name": "Katsu Chicken curry",
  "description": "Prep:15min  ›  Cook:30min  ›  Ready in:45min...",
  "country": "Japan",
  "region": "East Asia",
  "tags": ["chicken", "japanese"],
  "difficulty": "Hard",
  "parent_dish": "Katsu Chicken curry",
  "calories": 1249,
  "protein": 53,
  "carbs": 147,
  "fat": 49,
  "fiber": 8,
  "dietaryInfo": [],
  "spiceLevel": "Hot",
  "allergens": ["Gluten", "Eggs", "Soy"],
  "cookingMethod": "Frying",
  "mealType": "Dinner",
  "season": "Winter",
  "instructions": "Prep:15min … Pour curry sauce over chicken, serve with white rice and enjoy!",
  "ingredients": [
    { "name": "chicken breast", "amount": "4 pounded to 1cm thickness" },
    { "name": "plain flour", "amount": "2 tablespoons" },
    { "name": "egg", "amount": "1 beaten" }
  ],
  "image": "https://www.themealdb.com/images/media/meals/vwrpps1503068729.jpg",
  "video": "https://www.youtube.com/watch?v=MWzxDFRtVbc",
  "variations": [
    {
      "id": "katsu-chicken-curry-vegetarian-yn1miu8l",
      "name": "Vegetarian Katsu Chicken curry",
      "description": "A vegetarian variation of Katsu Chicken curry...",
      "calories": 601,
      "spiceLevel": "Mild",
      "dietaryInfo": ["Vegetarian"]
    }
  ]
}`}
            </pre>
          </div>
        </div>

        {/* Endpoints */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-[#1f2937] mb-6">Endpoints</h3>
          <div className="space-y-4">
            
            {/* GET /api/dishes */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">GET</span>
                <code className="text-[#f97316] font-mono text-lg">/api/dishes</code>
              </div>
              <p className="text-[#374151] mb-3">Get all dishes with filtering, pagination, and sorting.</p>
              <div className="text-[#6b7280] text-sm">
                <strong>Query params:</strong> page, limit, sort, order, filter[country], filter[dietary], etc.
              </div>
            </div>

            {/* GET /api/dishes/search */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">GET</span>
                <code className="text-[#f97316] font-mono text-lg">/api/dishes/search</code>
              </div>
              <p className="text-[#374151] mb-3">Fuzzy search with typo tolerance.</p>
              <div className="text-[#6b7280] text-sm">
                <strong>Query params:</strong> q (search term)
              </div>
            </div>

            {/* GET /api/dishes/:id */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">GET</span>
                <code className="text-[#f97316] font-mono text-lg">/api/dishes/:id</code>
              </div>
              <p className="text-[#374151] mb-3">Get detailed information about a specific dish.</p>
            </div>

            {/* GET /api/random */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">GET</span>
                <code className="text-[#f97316] font-mono text-lg">/api/random</code>
              </div>
              <p className="text-[#374151] mb-3">Get a random dish for discovery.</p>
            </div>

            {/* POST /api/recipes/share */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-3">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">POST</span>
                <code className="text-[#f97316] font-mono text-lg">/api/recipes/share</code>
              </div>
              <p className="text-[#374151] mb-3">Share your own recipe with the community.</p>
            </div>

            {/* GET /health */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center space-x-4 mb-3">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">GET</span>
                <code className="text-[#f97316] font-mono text-lg">/health</code>
              </div>
              <p className="text-[#374151] mb-3">Check API and database status.</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-[#1f2937] mb-6">Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-lg">⚡</span>
              </div>
              <h4 className="text-[#1f2937] font-semibold mb-2">Fast</h4>
              <p className="text-[#6b7280] text-sm">Sub-100ms response times with caching</p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 text-lg">🔍</span>
              </div>
              <h4 className="text-[#1f2937] font-semibold mb-2">Smart Search</h4>
              <p className="text-[#6b7280] text-sm">Fuzzy search with typo tolerance</p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 text-lg">🎯</span>
              </div>
              <h4 className="text-[#1f2937] font-semibold mb-2">Filtered</h4>
              <p className="text-[#6b7280] text-sm">Advanced filtering by diet, country, etc.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer border-t border-slate-200 bg-[#fafafa] pt-16 pb-8">
          <div className="footer-content grid grid-cols-1 md:grid-cols-4 gap-12 max-w-6xl mx-auto px-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#10b981] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <span className="text-xl font-bold text-[#1f2937]">FoodAPI</span>
              </div>
              <div className="text-[#6b7280] text-[0.95rem] leading-snug max-w-xs mt-2">
                The world's most comprehensive food and recipe API for developers
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#1f2937] mb-6">Product</div>
              <ul className="space-y-1">
                {[
                  { label: "Documentation", href: "/docs" },
                  { label: "Status", href: "/status" },
                  { label: "Changelog", href: "/changelog" },
                ].map((item) => (
                  <li key={item.label}>
                    <a className="footer-link text-base text-[#6b7280] hover:text-[#10b981] transition-colors" href={item.href}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#1f2937] mb-6">Developers</div>
              <ul className="space-y-1">
                {[
                  { label: "API Reference", href: "/docs/api" },
                  { label: "SDKs", href: "/docs/sdks" },
                  { label: "Tutorials", href: "/docs/tutorials" },
                  { label: "Community", href: "/community" },
                ].map((item) => (
                  <li key={item.label}>
                    <a className="footer-link text-base text-[#6b7280] hover:text-[#10b981] transition-colors" href={item.href}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-lg font-semibold text-[#1f2937] mb-6">Company</div>
              <ul className="space-y-1">
                {[
                  { label: "About", href: "/about" },
                  { label: "Blog", href: "/blog" },
                  { label: "Contact", href: "/contact" },
                  { label: "Privacy", href: "/privacy" },
                ].map((item) => (
                  <li key={item.label}>
                    <a className="footer-link text-base text-[#6b7280] hover:text-[#10b981] transition-colors" href={item.href}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <hr className="my-10 border-slate-200 max-w-6xl mx-auto" />
          <div className="text-center text-sm text-[#9ca3af]"> 2024 FoodAPI. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
}
