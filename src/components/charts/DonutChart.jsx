import { chartColors } from '@/styles/theme';

export default function DonutChart({ data }) {
    if (!data) return null;
    const entries = Object.entries(data);
    const total = entries.reduce((acc, [, val]) => acc + val, 0);

    let cumulativePercent = 0;

    const slices = entries.map(([label, value], i) => {
        const percent = value / total;
        const startX = Math.cos(2 * Math.PI * cumulativePercent);
        const startY = Math.sin(2 * Math.PI * cumulativePercent);
        cumulativePercent += percent;
        const endX = Math.cos(2 * Math.PI * cumulativePercent);
        const endY = Math.sin(2 * Math.PI * cumulativePercent);

        const largeArcFlag = percent > 0.5 ? 1 : 0;

        const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
        ].join(' ');

        return { pathData, color: chartColors[i % chartColors.length], label };
    });

    return (
        <div className="relative w-40 h-40 group">
            <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }} className="w-full h-full overflow-visible">
                {slices.map((slice, i) => (
                    <path
                        key={i}
                        d={slice.pathData}
                        fill={slice.color}
                        stroke="white"
                        strokeWidth="0.05"
                        className="transition-all duration-300 hover:opacity-90 hover:scale-105 origin-center"
                    />
                ))}
                <circle cx="0" cy="0" r="0.6" fill="white" />
            </svg>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xs font-bold text-gray-400">TOTAL</span>
            </div>
        </div>
    );
}
