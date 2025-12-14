import { theme } from '@/styles/theme';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
    const baseStyles = "px-6 py-3 rounded-xl font-bold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2";

    const variants = {
        primary: `text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5`,
        secondary: `bg-white text-gray-800 border-2 border-gray-200 hover:border-orange-200 hover:shadow-md`,
        ghost: `text-gray-600 hover:text-orange-600 hover:bg-orange-50`,
        danger: `bg-red-500 text-white hover:bg-red-600 shadow-md`,
    };

    const style = variant === 'primary' ? { background: theme.gradients.primary } : {};

    return (
        <button
            className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
            style={style}
            {...props}
        >
            {children}
        </button>
    );
}
