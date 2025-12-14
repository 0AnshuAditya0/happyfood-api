'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { theme } from '@/styles/theme';

export default function Navbar() {
    const pathname = usePathname();
    const isActive = (path) => pathname === path;

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm transition-all duration-300">
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between h-16">

                    <Link href="/" className="flex items-center gap-3 group">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105"
                            style={{ background: theme.gradients.primary }}
                        >
                            🍽️
                        </div>
                        <span className="text-xl font-black text-gray-900 tracking-tight group-hover:text-orange-600 transition-colors">HappyFood</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        <NavLink href="/demo" active={isActive('/demo')}>Explore</NavLink>
                        <NavLink href="/dashboard" active={isActive('/dashboard')}>Dashboard</NavLink>
                        <NavLink href="/docs" active={isActive('/docs')}>Docs</NavLink>

                        <Link
                            href="/admin"
                            className="px-6 py-2.5 rounded-lg font-bold text-sm text-white shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                            style={{ background: theme.gradients.primary }}
                        >
                            Admin
                            <span>→</span>
                        </Link>
                    </div>

                    <button className="md:hidden text-gray-600 hover:text-orange-600 transition p-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ href, children, active }) {
    return (
        <Link
            href={href}
            className={`text-sm font-bold transition-colors duration-200 ${active ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
        >
            {children}
        </Link>
    );
}
