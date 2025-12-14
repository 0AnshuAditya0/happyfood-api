export default function Card({ children, className = '', noPadding = false, ...props }) {
    return (
        <div
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 ${noPadding ? '' : 'p-6'} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
