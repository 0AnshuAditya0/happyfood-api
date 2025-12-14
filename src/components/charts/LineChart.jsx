import { theme } from '@/styles/theme';

export default function LineChart({ data }) {
    if (!data || data.length === 0) return null;

    const width = 100;
    const height = 40;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height * 0.8) - (height * 0.1);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
                <defs>
                    <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={theme.colors.secondary.green} />
                        <stop offset="100%" stopColor={theme.colors.secondary.cyan} />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <polyline
                    fill="none"
                    stroke="url(#line-gradient)"
                    strokeWidth="2"
                    points={points}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                />
                {data.map((val, i) => {
                    const x = (i / (data.length - 1)) * width;
                    const y = height - ((val - min) / range) * (height * 0.8) - (height * 0.1);
                    return (
                        <circle key={i} cx={x} cy={y} r="1.5" fill="#fff" stroke={theme.colors.secondary.green} strokeWidth="0.5" className="hover:r-2 transition-all" />
                    )
                })}
            </svg>
        </div>
    );
}
