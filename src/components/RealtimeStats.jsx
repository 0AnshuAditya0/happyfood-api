'use client';
import { useEffect, useState } from 'react';

export default function RealtimeStats() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetch('/api/dashboard/stats')
            .then(res => res.json())
            .then(data => {
                if (data.success) setStats(data.stats);
            })
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                    {stats?.totalDishes?.toLocaleString() || '-'}
                </div>
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mt-1">Recipes</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    {stats?.totalCountries || '-'}
                </div>
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mt-1">Countries</div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">
                    {stats?.avgCalories ? Math.round(stats.avgCalories) : '-'}
                </div>
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mt-1">Avg Cals</div>
            </div>
        </div>
    );
}
