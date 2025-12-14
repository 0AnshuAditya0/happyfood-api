'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import BarChart from '@/components/charts/BarChart';
import DonutChart from '@/components/charts/DonutChart';
import { theme } from '@/styles/theme';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState(null);

  const ADMIN_PASSWORD = 'happyfood2024';

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchStats();
    } else {
      setMessage('Invalid credentials');
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD }),
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.message || 'Failed to fetch stats');
      }
    } catch (e) {
      setError('Network error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async (source) => {
    if (!confirm(`Run ${source} scraper? This happens in the background.`)) return;
    setScraping(true);
    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ADMIN_PASSWORD, source }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setTimeout(fetchStats, 5000); 
      } else {
        alert('Failed: ' + data.message);
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setScraping(false);
    }
  };

  const handleFindDuplicates = () => {
     handleScrape('cleanup');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full !p-8 border-t-4 border-orange-500">
          <div className="text-center mb-8">
             <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-4xl bg-gradient-to-br from-orange-400 to-red-600 text-white">
               🔐
             </div>
             <h1 className="text-3xl font-black text-gray-800 mb-2">Admin Portal</h1>
             <p className="text-gray-500 font-medium">Restricted Access Area</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-5 py-4 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition bg-rose-50 focus:bg-white text-lg font-medium"
              placeholder="Enter Password"
            />
            <Button type="submit" className="w-full">Unlock Dashboard</Button>
            {message && <p className="text-rose-500 text-center text-sm font-bold bg-rose-50 p-3 rounded-lg">{message}</p>}
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
         <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
               <span className="text-2xl group-hover:scale-110 transition-transform">🍽️</span> 
               <span className="font-bold text-gray-800 text-xl tracking-tight">HappyFood Admin</span>
            </Link>
            <div className="flex items-center gap-4">
               <button onClick={fetchStats} className="p-2 text-gray-500 hover:text-blue-600 transition hover:bg-gray-100 rounded-full" title="Refresh">
                 🔄
               </button>
               <button onClick={() => setIsAuthenticated(false)} className="text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition">
                 Logout
               </button>
            </div>
         </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        
        <div className="bg-gray-900 text-white p-10 rounded-[2rem] shadow-2xl mb-12 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-4xl font-black mb-2 tracking-tight">System Status</h1>
            <p className="text-gray-400 font-medium">Manage scrappers, monitoring, and data quality</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-gray-800 to-transparent opacity-50" />
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-orange-500 mb-4"></div>
             <p className="text-gray-500 font-bold">Syncing...</p>
          </div>
        )}

        {error && (
           <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-r-xl shadow-sm flex items-center gap-4">
               <span className="text-3xl">⚠️</span>
               <div>
                  <h3 className="text-red-800 font-bold text-lg">System Error</h3>
                  <p className="text-red-600 font-medium">{error}</p>
               </div>
           </div>
        )}

        {!loading && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
               <StatCard 
                 title="Total Recipes" 
                 value={stats.totalRecipes} 
                 icon="🍲" 
                 gradient={theme.gradients.blue} 
                 trend="+12%" 
               />
               <StatCard 
                 title="Countries" 
                 value={Object.keys(stats.byCountry).length} 
                 icon="🌍" 
                 gradient={theme.gradients.purple} 
                 trend="Active" 
               />
               <StatCard 
                 title="Avg Calories" 
                 value={stats.avgCalories} 
                 icon="🔥" 
                 gradient={theme.gradients.primary} 
                 trend="Stable" 
               />
               <StatCard 
                 title="Issues" 
                 value={stats.dataQuality.missingImages + stats.dataQuality.potentialDuplicates} 
                 icon="🛡️" 
                 gradient={theme.gradients.pink} 
                 trend={stats.dataQuality.potentialDuplicates > 0 ? "Action Needed" : "Clean"}
               />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
               <Card className="lg:col-span-2">
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-800">Cuisine Distribution</h2>
                    <Badge color="blue">Global</Badge>
                 </div>
                 <BarChart data={stats.byCountry} highlighted="Italy" />
               </Card>

                <Card>
                   <h2 className="text-xl font-bold text-gray-800 mb-6">Difficulty Split</h2>
                   <div className="flex justify-center mb-6">
                      <DonutChart data={stats.byDifficulty} />
                   </div>
                   <div className="space-y-3">
                      {Object.entries(stats.byDifficulty).map(([diff, count], i) => (
                          <div key={diff} className="flex justify-between items-center text-sm">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: theme.colors.secondary[Object.keys(theme.colors.secondary)[i % 5]] }} />
                                <span className="text-gray-600 font-medium">{diff || 'Unknown'}</span>
                             </div>
                             <span className="font-bold text-gray-800">{count}</span>
                          </div>
                      ))}
                   </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
               
               <Card className="lg:col-span-2">
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>⚡</span> Scraper Controls
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-4">
                     <Button variant="secondary" onClick={() => handleScrape('themealdb')} disabled={scraping}>
                        🍔 TheMealDB
                     </Button>
                     <Button variant="secondary" onClick={() => handleScrape('spoonacular')} disabled={scraping}>
                        🥄 Spoonacular
                     </Button>
                     <Button variant="secondary" onClick={() => handleScrape('edamam')} disabled={scraping}>
                        🥙 Edamam
                     </Button>
                  </div>
                  {scraping && (
                    <div className="mt-6 bg-blue-50 text-blue-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-pulse border border-blue-100">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                        <span className="font-bold text-sm">Processing background tasks...</span>
                    </div>
                  )}
               </Card>

               <Card>
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>🩺</span> Health
                  </h2>
                  <div className="space-y-4 mb-8">
                     <HealthRow label="Missing Images" count={stats.dataQuality.missingImages} isBad={stats.dataQuality.missingImages > 0} />
                     <HealthRow label="Low Data Quality" count={stats.dataQuality.lowCalories} isBad={false} />
                     <HealthRow label="Duplicates" count={stats.dataQuality.potentialDuplicates} isBad={stats.dataQuality.potentialDuplicates > 0} />
                  </div>
                  <Button variant="ghost" onClick={handleFindDuplicates} className="w-full">
                    Run Cleanup Scan
                  </Button>
               </Card>
            </div>

            <Card>
               <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                 <span>📜</span> System Activity
               </h2>
               <div className="overflow-hidden rounded-xl border border-gray-100">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider">
                     <tr>
                       <th className="px-6 py-4">Time</th>
                       <th className="px-6 py-4">Event</th>
                       <th className="px-6 py-4">Details</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {stats.recentActivity && stats.recentActivity.map((log, i) => (
                       <tr key={i} className="hover:bg-gray-50 transition-colors">
                         <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                           {new Date(log.timestamp).toLocaleTimeString()}
                         </td>
                         <td className="px-6 py-4">
                            <Badge color={log.type === 'error' ? 'red' : log.type === 'scrape' ? 'blue' : 'gray'}>
                                {log.type}
                            </Badge>
                         </td>
                         <td className="px-6 py-4 text-gray-700 font-medium">{log.message}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </Card>
            
          </>
        )}
      </div>
    </div>
  );
}

function HealthRow({ label, count, isBad }) {
    return (
        <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
            <span className="text-gray-600 text-sm font-bold">{label}</span>
            <Badge color={isBad ? 'red' : 'green'}>{count}</Badge>
        </div>
    )
}