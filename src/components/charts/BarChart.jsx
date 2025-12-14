import { theme } from '@/styles/theme';

export default function BarChart({ data, highlighted }) {
    if (!data) return null;

    const entries = Object.entries(data).slice(0, 10);
    const max = Math.max(...entries.map(([, val]) => val));

    return (
        <div className="space-y-4">
            {entries.map(([label, value]) => {
                const isHighlighted = label === highlighted;
                const width = `${(value / max) * 100}%`;
                const percentage = Math.round((value / max) * 100);

                return (
                    <div key={label} className="group cursor-default">
                        <div className="flex justify-between text-xs mb-1.5 font-bold uppercase tracking-wide">
                            <span className={isHighlighted ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-800 transition-colors'}>{label}</span>
                            <span className="text-gray-400">{value}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out relative ${isHighlighted ? 'bg-orange-500' : 'bg-gray-300 group-hover:bg-blue-400'}`}
                                style={{ width }}
                            >
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:animate-shimmer" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
