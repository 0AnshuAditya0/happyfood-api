'use client';

import RecipeList from '@/components/RecipeList';
import Link from 'next/link';

export default function Demo() {
  return (
    <div className="min-h-screen bg-[#fefdf8]">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#10b981] rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🌿</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1f2937]">FoodAPI</h1>
                <p className="text-[#6b7280] text-xs">Global Food Data</p>
              </div>
            </Link>
            <div className="flex items-center space-x-6">
              <a href="/docs" className="text-[#6b7280] hover:text-[#1f2937] transition-colors text-sm">API Docs</a>
              <a href="/dashboard" className="text-[#6b7280] hover:text-[#1f2937] transition-colors text-sm">Dashboard</a>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-4xl font-bold text-[#1f2937] mb-4">Recipe Explorer</h2>
            <p className="text-[#6b7280] max-w-2xl mx-auto">
              Experience the power of our optimized API with real-time searching, filtering, and pagination.
              Data is served instantly with caching and compression.
            </p>
          </div>

          <RecipeList />
          
        </div>
      </div>

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
                { label: 'Documentation', href: '/docs' },
                { label: 'Status', href: '/status' },
                { label: 'Changelog', href: '/changelog' },
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
                { label: 'API Reference', href: '/docs/api' },
                { label: 'SDKs', href: '/docs/sdks' },
                { label: 'Tutorials', href: '/docs/tutorials' },
                { label: 'Community', href: '/community' },
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
                { label: 'About', href: '/about' },
                { label: 'Blog', href: '/blog' },
                { label: 'Contact', href: '/contact' },
                { label: 'Privacy', href: '/privacy' },
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
        <div className="text-center text-sm text-[#9ca3af]">© 2024 FoodAPI. All rights reserved.</div>
      </footer>
    </div>
  );
}
