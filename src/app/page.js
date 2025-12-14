'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { theme } from '@/styles/theme';

export default function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => data.success && setStats(data.stats))
      .catch(err => console.error(err));
  }, []);

  return (
    <main className="min-h-screen bg-white font-sans selection:bg-rose-100 selection:text-rose-900">
      
      <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
         
         <div className="absolute inset-0 z-0">
            <img 
              src="/strayb.jpeg" 
              alt="Background" 
              className="w-full h-full object-cover brightness-[0.85]"
            />
         </div>

         <header className="absolute top-6 left-0 right-0 z-50 flex justify-center px-4">
            <div className="w-full max-w-7xl flex items-center justify-between">
               
               <Link href="/" className="flex items-center gap-2 group">
                 <span className="text-2xl font-bold text-white tracking-tight drop-shadow-md">HappyFood</span>
               </Link>

               <nav className="hidden md:flex items-center gap-8 bg-white/10 backdrop-blur-md px-8 py-3 rounded-full shadow-lg border border-white/20">
                  <Link href="/demo" className="text-sm font-medium text-white hover:text-rose-200 transition-colors">Explore</Link>
                  <Link href="/dashboard" className="text-sm font-medium text-white hover:text-rose-200 transition-colors">Dashboard</Link>
                  <Link href="/docs" className="text-sm font-medium text-white hover:text-rose-200 transition-colors">Docs</Link>
               </nav>

               <div className="flex items-center gap-6">
                  <Link href="/admin" className="hidden md:block bg-white text-rose-600 px-5 py-2 rounded-full text-xs font-bold hover:bg-rose-50 transition-colors shadow-lg">
                    Admin
                  </Link>
                  <button className="md:hidden text-white">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                  </button>
               </div>
            </div>
         </header>

         <div className="relative z-10 container mx-auto px-4 text-center mt-10">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-white mb-6 leading-[1.1] drop-shadow-lg">
              Discover Your <span className="font-medium text-rose-200">Next</span><br className="hidden md:block" />
              <span className="text-white">Favorite Recipe</span>
            </h1>
            
            <p className="text-lg md:text-xl text-rose-50 max-w-2xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-md">
              Power your applications with thousands of detailed recipes, nutritional data, and intelligent filtering from around the world.
            </p>

            <div className="flex justify-center gap-4">
               <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-lg text-sm font-bold text-white">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  {stats?.totalDishes || '680+'} Connected Recipes
               </span>
            </div>
         </div>
      </section>

      <section className="py-16 bg-white relative z-20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3 tracking-tight">
              Why Choose HappyFood?
            </h2>
            <p className="text-lg text-rose-400 max-w-xl mx-auto font-medium">
              Everything you need to build amazing food applications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon="🍽️" 
              title="680+ Recipes" 
              desc="Access hundreds of detailed recipes with automated daily scraping." 
              gradient="from-rose-50 to-white" 
            />
            <FeatureCard 
              icon="📊" 
              title="Nutritional Data" 
              desc="Complete caloric, macro, and allergen info for every dish." 
              gradient="from-green-50 to-white" 
            />
            <FeatureCard 
              icon="🔍" 
              title="Smart Filtering" 
              desc="Search by country, difficulty, calories, and preferences." 
              gradient="from-blue-50 to-white" 
            />
             <FeatureCard 
              icon="⚡" 
              title="Fast API" 
              desc="Smart caching and optimized queries for sub-100ms responses." 
              gradient="from-yellow-50 to-white" 
            />
            <FeatureCard 
              icon="🌍" 
              title="Global Cuisine" 
              desc="15+ international cuisines including Italian, Indian, and more." 
              gradient="from-purple-50 to-white" 
            />
            <FeatureCard 
              icon="🔄" 
              title="Auto-Updated" 
              desc="Fresh content added automatically from multiple sources." 
              gradient="from-rose-50 to-white" 
            />
          </div>
        </div>
      </section>

      <section className="py-16 bg-rose-50 relative z-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3 tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <StepCard number="1" title="Browse" desc="Explore 680+ recipes" gradient="from-rose-500 to-rose-700" />
            <StepCard number="2" title="Connect" desc="Get API Access Key" gradient="from-rose-400 to-rose-600" />
            <StepCard number="3" title="Build" desc="Launch your app" gradient="from-green-500 to-green-600" />
          </div>
        </div>
      </section>

      <section className="py-16 text-white relative overflow-hidden" style={{ background: theme.gradients.primary }}>
        <div className="absolute inset-0 bg-black opacity-10 pattern-grid" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-5xl mx-auto">
            <StatBox value={stats?.totalDishes || '680+'} label="Recipes" />
            <StatBox value={stats?.totalCountries || '15+'} label="Countries" />
            <StatBox value={stats?.totalCategories || '25+'} label="Categories" />
            <StatBox value="100%" label="Verified" />
          </div>
        </div>
      </section>

      <section className="py-16 bg-white relative z-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="rounded-[2rem] p-10 text-center shadow-xl relative overflow-hidden group border-2 border-rose-100" style={{ background: theme.gradients.primary }}>
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-4 tracking-tight">
                Ready to Build?
              </h2>
              <p className="text-lg text-rose-100 mb-8 font-medium">
                Join developers building amazing food applications.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/demo" className="bg-white text-rose-600 px-8 py-3 rounded-xl font-bold text-base hover:scale-105 transition-transform shadow-lg">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-rose-950 text-white py-12 border-t border-rose-900">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2">
                <span className="text-2xl">🍓</span>
                <span className="text-xl font-black">HappyFood</span>
             </div>
             <div className="flex gap-8 text-sm font-medium text-rose-200">
                <Link href="/demo" className="hover:text-white transition-colors">Explore</Link>
                <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
                <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
             </div>
             <p className="text-rose-400 text-sm">© 2024 HappyFood.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, desc, gradient }) {
  return (
    <div className={`group bg-gradient-to-br ${gradient} p-6 rounded-2xl border border-rose-100 hover:shadow-lg hover:shadow-rose-100/50 transition-all duration-300 hover:-translate-y-1`}>
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  )
}

function StepCard({ number, title, desc, gradient }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white text-xl font-black mb-4 shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform`}>
        {number}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 font-medium">{desc}</p>
    </div>
  )
}

function StatBox({ value, label }) {
  return (
     <div>
        <div className="text-4xl font-black mb-1 tracking-tight">{value}</div>
        <div className="text-rose-200 text-xs font-bold uppercase tracking-widest opacity-90">{label}</div>
      </div>
  )
}
