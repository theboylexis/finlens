'use client';

import { Check, AlertTriangle, Zap, Search, Bot, Pencil } from 'lucide-react';

interface CategoryBadgeProps {
    category: string;
    confidence?: number;
    method?: 'regex' | 'ai' | 'manual';
    showConfidence?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export default function CategoryBadge({
    category,
    confidence,
    method,
    showConfidence = true,
    size = 'md',
}: CategoryBadgeProps) {
    // Determine confidence level
    const getConfidenceLevel = (): 'high' | 'medium' | 'low' => {
        if (!confidence) return 'high';
        if (confidence >= 0.8) return 'high';
        if (confidence >= 0.5) return 'medium';
        return 'low';
    };

    const confidenceLevel = getConfidenceLevel();

    // Size classes
    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
    };

    // Confidence badge classes
    const confidenceClasses = {
        high: 'confidence-badge-high',
        medium: 'confidence-badge-medium',
        low: 'confidence-badge-low',
    };

    // Confidence icons
    const ConfidenceIcon = {
        high: Check,
        medium: AlertTriangle,
        low: Zap,
    }[confidenceLevel];

    // Method icons
    const MethodIcon = method === 'regex' ? Search : method === 'ai' ? Bot : Pencil;
    const methodLabel = method === 'regex' ? 'Pattern' : method === 'ai' ? 'AI' : 'Manual';

    return (
        <div className="inline-flex items-center gap-2">
            <span
                className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          ${sizeClasses[size]}
          ${confidenceClasses[confidenceLevel]}
        `}
            >
                <span>{category}</span>
                {showConfidence && confidence !== undefined && (
                    <span className="opacity-90 flex items-center gap-1">
                        <ConfidenceIcon className="w-3 h-3" /> {Math.round(confidence * 100)}%
                    </span>
                )}
            </span>

            {method && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MethodIcon className="w-3 h-3" /> {methodLabel}
                </span>
            )}
        </div>
    );
}
