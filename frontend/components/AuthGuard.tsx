'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ['/login', '/landing'];

    useEffect(() => {
        if (!isLoading && !user && !publicRoutes.includes(pathname)) {
            router.push('/login');
        }
    }, [user, isLoading, pathname, router]);

    // Dark loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-[#52525b]">Loading...</p>
                </div>
            </div>
        );
    }

    if (publicRoutes.includes(pathname)) {
        return <>{children}</>;
    }

    if (user) {
        return <>{children}</>;
    }

    return null;
}
