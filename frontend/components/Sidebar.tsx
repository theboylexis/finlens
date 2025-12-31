'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { deleteAccount } from '@/lib/api';
import DeleteAccountModal from './DeleteAccountModal';
import {
    LayoutDashboard,
    BarChart3,
    Target,
    Users,
    CreditCard,
    LogOut,
    Wallet,
    Menu,
    X,
    ChevronDown,
    Trash2
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Income', href: '/income', icon: Wallet },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
    { name: 'Split Bills', href: '/splits', icon: Users },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const closeMobileMenu = () => setMobileMenuOpen(false);

    // Close user menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeleteAccount = async () => {
        await deleteAccount();
        logout();
        router.push('/login');
    };

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
                fixed left-0 w-60 bg-[#0f0f0f] border-r border-[#262626] flex flex-col z-50
                transition-transform duration-300 ease-in-out
                lg:top-0 lg:h-screen lg:translate-x-0
                top-14 bottom-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo - Hidden on mobile since header shows it */}
                <div className="h-14 hidden lg:flex items-center px-4 border-b border-[#262626]">
                    <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
                        <Wallet className="w-5 h-5 text-emerald-400" />
                        <span className="text-base font-semibold text-white">FinLens</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 overflow-y-auto">
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

                {/* User Section - Always show at bottom */}
                <div className="p-3 border-t border-[#262626] mt-auto">
                    {user ? (
                        <div className="relative" ref={userMenuRef}>
                            {/* User Button - Opens dropdown */}
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[#1a1a1a] transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-black text-sm font-bold shrink-0">
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                    <p className="text-xs text-[#52525b] truncate">{user.email}</p>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-[#52525b] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* User Dropdown Menu */}
                            {userMenuOpen && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#171717] border border-[#262626] rounded-lg shadow-xl overflow-hidden">
                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            logout();
                                            closeMobileMenu();
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign out
                                    </button>
                                    <div className="border-t border-[#262626]" />
                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            setDeleteModalOpen(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Account
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            onClick={closeMobileMenu}
                            className="block text-center py-2 text-sm text-emerald-400 hover:text-emerald-300"
                        >
                            Sign in
                        </Link>
                    )}
                </div>
            </aside>

            {/* Delete Account Modal */}
            <DeleteAccountModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteAccount}
                userName={user?.email || ''}
            />
        </>
    );
}

