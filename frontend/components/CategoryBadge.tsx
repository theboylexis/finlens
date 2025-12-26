'use client';

import { useState, useEffect } from 'react';
import { Category, CategorySuggestion, suggestCategory } from '@/lib/api';

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
    const confidenceIcons = {
        high: '✓',
        medium: '⚠',
        low: '⚡',
    };

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
                    <span className="opacity-90">
                        {confidenceIcons[confidenceLevel]} {Math.round(confidence * 100)}%
                    </span>
                )}
            </span>

            {method && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {method === 'regex' ? '🔍 Pattern' : method === 'ai' ? '🤖 AI' : '✏️ Manual'}
                </span>
            )}
        </div>
    );
}
