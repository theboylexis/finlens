'use client';

import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * Reusable empty state component for consistent empty states across the app.
 */
export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-sm font-medium text-white mb-2">{title}</h3>
            <p className="text-xs text-[#52525b] mb-4 max-w-xs">
                {description}
            </p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
