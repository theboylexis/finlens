'use client';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Reusable loading spinner component for consistent loading states.
 */
export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-5 w-5 border',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-2'
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`animate-spin rounded-full border-emerald-500/30 border-t-emerald-500 ${sizeClasses[size]}`}
            />
        </div>
    );
}

interface LoadingPageProps {
    message?: string;
}

/**
 * Full page loading state with optional message.
 */
export function LoadingPage({ message }: LoadingPageProps) {
    return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <LoadingSpinner size="lg" />
            {message && <p className="text-sm text-[#52525b]">{message}</p>}
        </div>
    );
}
