'use client';

import { ReactNode } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import { ToastProvider } from '@/components/Toast';

interface ClientProvidersProps {
    children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ToastProvider>
                    <AuthGuard>
                        {children}
                    </AuthGuard>
                </ToastProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

