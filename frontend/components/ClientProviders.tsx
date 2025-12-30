'use client';

import { ReactNode } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/lib/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import FloatingAIChat from '@/components/FloatingAIChat';

interface ClientProvidersProps {
    children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <AuthGuard>
                    {children}
                    <FloatingAIChat />
                </AuthGuard>
            </AuthProvider>
        </ErrorBoundary>
    );
}
