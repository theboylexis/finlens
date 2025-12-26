'use client';

import { ReactNode } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/AuthContext';
import AuthGuard from '@/components/AuthGuard';

interface ClientProvidersProps {
    children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <AuthGuard>
                    {children}
                </AuthGuard>
            </AuthProvider>
        </ErrorBoundary>
    );
}

