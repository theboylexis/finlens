'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useState } from 'react';
import {
    LayoutDashboard,
    BarChart3,
    Target,
    Users,
    LogOut,
    Wallet,
    Menu,
    X
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Split Bills', href: '/splits', icon: Users },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0f0f0f] border-b border-[#262626] flex items-center justify-between px-4 z-50">
                <Link href="/" className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    <span className="text-base font-semibold text-white">FinLens</span>
                </Link>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-white hover:bg-[#262626] rounded-md"
                >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar - Desktop: always visible, Mobile: slide in */}
            <aside className={`
                fixed left-0 top-0 h-screen w-60 bg-[#0f0f0f] border-r border-[#262626] flex flex-col z-50
                transition-transform duration-300 ease-in-out
                lg:translate-x-0
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo */}
                <div className="h-14 flex items-center px-4 border-b border-[#262626]">
                    <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
                        <Wallet className="w-5 h-5 text-emerald-400" />
                        <span className="text-base font-semibold text-white">FinLens</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3">
                    <ul className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        onClick={closeMobileMenu}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                                ? 'bg-[#262626] text-white'
                                                : 'text-[#a1a1aa] hover:text-white hover:bg-[#1a1a1a]'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : ''}`} />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Section */}
                {user && (
                    <div className="p-3 border-t border-[#262626]">
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-black text-sm font-bold">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                <p className="text-xs text-[#52525b] truncate">{user.email}</p>
                            </div>
                            <button
                                onClick={() => { logout(); closeMobileMenu(); }}
                                className="p-1.5 text-[#52525b] hover:text-red-400 transition-colors rounded"
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
