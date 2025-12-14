import { theme } from '@/styles/theme';

export default function RadialProgress({ value, color, size = '120px' }) {
    const radius = 40;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="relative flex items-center justify-center">
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="transform -rotate-90 overflow-visible"
                    style={{ width: size, height: size }}
                    viewBox={`0 0 ${radius * 2} ${radius * 2}`}
                >
                    <circle
                        stroke="#F3F4F6"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        strokeLinecap="round"
                    />
                    <circle
                        stroke={color || theme.colors.primary.orange}
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{
                            strokeDashoffset,
                            transition: 'stroke-dashoffset 1s ease-in-out'
                        }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-800">{value}%</span>
                </div>
            </div>
        </div>
    );
}
