export default function StatCard({ title, value, icon, gradient, trend }) {
    return (
        <div
            className="rounded-3xl p-6 text-white shadow-lg transform transition hover:-translate-y-1 relative overflow-hidden group"
            style={{ background: gradient }}
        >
            {/* Decorative background circle */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                    <span className="text-2xl">{icon}</span>
                </div>
                {trend && (
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                        {trend}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-white/90 font-medium text-sm mb-1 uppercase tracking-wide opacity-90">{title}</h3>
                <p className="text-3xl font-black tracking-tight">{value}</p>
            </div>
        </div>
    )
}
