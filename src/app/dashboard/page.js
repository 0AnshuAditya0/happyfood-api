'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import DonutChart from '@/components/charts/DonutChart';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import RadialProgress from '@/components/charts/RadialProgress';
import { theme, getGradient } from '@/styles/theme';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      
      {/* Header */}
      <div className="text-white py-16 relative overflow-hidden" style={{ background: theme.gradients.primary }}>
        <div className="absolute inset-0 bg-black opacity-10 pattern-dots" /> 
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-5xl font-black mb-4 tracking-tight">Dashboard</h1>
          <p className="text-rose-100 text-lg font-medium max-w-2xl">Real-time insights and analytics for your global recipe database</p>
        </div>
      </div>
      
      <div className="container mx-auto px-6 -mt-12 relative z-20">
         {loading ? (
             <div className="flex justify-center py-20 bg-white rounded-3xl shadow-lg"><div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-rose-500"></div></div>
         ) : stats ? (
            <>
                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  <StatCard 
                    title="Total Dishes" 
                    value={stats.totalDishes?.toLocaleString() || '-'} 
                    icon="🍽️" 
                    gradient={theme.gradients.blue}
                    trend="Realtime"
                  />
                  <StatCard 
                    title="Countries" 
                    value={stats.totalCountries || '-'} 
                    icon="🌍" 
                    gradient={theme.gradients.purple}
                    trend="Global"
                  />
                   <StatCard 
                    title="Avg Calories" 
                    value={stats.avgCalories?.toFixed(0) || '-'} 
                    icon="🔥" 
                    gradient={theme.gradients.cyan}
                    trend="Average"
                  />
                   <StatCard 
                    title="Categories" 
                    value={stats.totalCategories || '-'} 
                    icon="📊" 
                    gradient={theme.gradients.pink}
                    trend="Tags"
                  />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                  <Card className="flex flex-col items-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-8 self-start w-full border-b border-gray-100 pb-4">By Category</h2>
                    <DonutChart data={stats.byCategory} />
                    <div className="mt-8 w-full space-y-3">
                         {stats.byCategory && Object.entries(stats.byCategory).slice(0, 4).map(([cat, count], i) => (
                             <div key={cat} className="flex justify-between items-center text-sm">
                                 <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full" style={{ background: theme.colors.secondary[Object.keys(theme.colors.secondary)[i % 5]] }} />
                                     <span className="text-gray-600 font-medium">{cat}</span>
                                 </div>
                                 <span className="font-bold text-gray-900">{count}</span>
                             </div>
                         ))}
                    </div>
                  </Card>

                  <Card className="flex flex-col items-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-8 self-start w-full border-b border-gray-100 pb-4">Difficulty</h2>
                    <DonutChart data={stats.byDifficulty} />
                    <div className="mt-8 w-full space-y-3">
                         {stats.byDifficulty && Object.entries(stats.byDifficulty).map(([diff, count], i) => (
                             <div key={diff} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full" style={{ background: i === 0 ? theme.colors.secondary.green : i === 1 ? theme.colors.secondary.yellow : theme.colors.primary.red }} />
                                     <span className="text-gray-600 font-medium">{diff || 'Unknown'}</span>
                                 </div>
                                 <span className="font-bold text-gray-900">{count}</span>
                             </div>
                         ))}
                    </div>
                  </Card>

                  <Card>
                    <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                        <h2 className="text-xl font-bold text-gray-800">Growth Trend</h2>
                         <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+12.5%</span>
                    </div>
                    <div className="mb-6">
                         <div className="text-4xl font-black text-gray-900">{stats.recentCount}</div>
                         <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">New Recipes This Week</div>
                    </div>
                    <div className="h-40 flex items-end">
                       <LineChart data={stats.trendData} />
                    </div>
                  </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <Card>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Top Countries</h2>
                    <p className="text-sm text-gray-500 mb-6">Distribution of recipes globally</p>
                    <BarChart data={stats.byCountry} highlighted="Italy" />
                  </Card>

                  <Card>
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Resonance Score</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {stats.topCategories && stats.topCategories.slice(0, 4).map((cat, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-xl p-4 flex flex-col items-center">
                                <span className="text-sm font-bold text-gray-500 uppercase mb-2">{cat.name}</span>
                                <RadialProgress value={cat.score} color={getGradient(Object.keys(theme.gradients)[idx % 5])} size="100px" />
                            </div>
                        ))}
                    </div>
                  </Card>
                </div>
            </>
         ) : (
             <div className="text-center py-20 text-red-500 font-bold">Failed to load dashboard data.</div>
         )}
      </div>
    </div>
  );
}
