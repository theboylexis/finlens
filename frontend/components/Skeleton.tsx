'use client';

import { ReactNode } from 'react';

interface SkeletonProps {
    className?: string;
    children?: ReactNode;
    style?: React.CSSProperties;
}

// Base skeleton with shimmer effect - Dark Theme
export function Skeleton({ className = '', style }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-gradient-to-r from-[#262626] via-[#333] to-[#262626] bg-[length:200%_100%] rounded ${className}`}
            style={{
                animation: 'shimmer 1.5s ease-in-out infinite',
                ...style,
            }}
        />
    );
}

// Text line skeleton
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

// Card skeleton for expense items
export function SkeletonExpenseCard() {
    return (
        <div className="p-4 border border-[#262626] rounded-xl bg-[#171717]">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    {/* Category icon */}
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                        {/* Description */}
                        <Skeleton className="h-5 w-3/4 mb-2" />

                        {/* Date and category */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                    <Skeleton className="h-6 w-20 mb-1" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        </div>
    );
}

// Stats card skeleton
export function SkeletonStatsCard() {
    return (
        <div className="bg-[#171717] rounded-xl p-6 border border-[#262626]">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="w-8 h-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32 mb-2" />
            <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
            </div>
        </div>
    );
}

// Full expense list skeleton
export function SkeletonExpenseList({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonExpenseCard key={i} />
            ))}
        </div>
    );
}

// Analytics summary skeleton
export function SkeletonAnalyticsSummary() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonStatsCard key={i} />
            ))}
        </div>
    );
}

// Chart skeleton
export function SkeletonChart({ height = 300 }: { height?: number }) {
    return (
        <div className="relative" style={{ height }}>
            <div className="absolute inset-0 flex items-end justify-around gap-2 p-4">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1 rounded-t"
                        style={{ height: `${Math.random() * 60 + 20}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

// Add shimmer animation to global styles
export const shimmerStyles = `
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`;
