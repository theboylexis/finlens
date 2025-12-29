'use client';

import { useState, useEffect } from 'react';
import { getWeeklySummary, WeeklySummary } from '@/lib/api';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WeeklySummaryCardProps {
    refreshTrigger?: number;
}

export default function WeeklySummaryCard({ refreshTrigger = 0 }: WeeklySummaryCardProps) {
    const [data, setData] = useState<WeeklySummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getWeeklySummary();
                setData(result);
            } catch (error) {
                console.error('Failed to fetch weekly summary:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [refreshTrigger]);

    const getChangeIcon = () => {
        if (!data) return Minus;
        if (data.change_percent > 5) return TrendingUp;
        if (data.change_percent < -5) return TrendingDown;
        return Minus;
    };

    const getChangeColor = () => {
        if (!data) return 'text-gray-400';
        if (data.change_percent > 5) return 'text-red-400';  // Spending up = bad
        if (data.change_percent < -5) return 'text-emerald-400';  // Spending down = good
        return 'text-gray-400';
    };

    const ChangeIcon = getChangeIcon();

    if (loading) {
        return (
            <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-[#262626] rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-[#262626] rounded w-3/4"></div>
            </div>
        );
    }

    if (!data) return null;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-[#a1a1aa]">This Week</h2>
                <Calendar className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="text-2xl font-bold text-white mb-1">
                GHS {data.this_week_total.toFixed(2)}
            </div>

            <div className="flex items-center gap-2 mb-3">
                <ChangeIcon className={`w-4 h-4 ${getChangeColor()}`} />
                <span className={`text-xs ${getChangeColor()}`}>
                    {data.change_percent > 0 ? '+' : ''}{data.change_percent}% vs last week
                </span>
            </div>

            <div className="space-y-1 text-xs text-[#52525b]">
                <div className="flex justify-between">
                    <span>{data.this_week_count} expense{data.this_week_count !== 1 ? 's' : ''}</span>
                    <span className="text-[#a1a1aa]">
                        {formatDate(data.week_start)} - {formatDate(data.week_end)}
                    </span>
                </div>
                {data.top_category && (
                    <div className="flex justify-between">
                        <span>Top: {data.top_category}</span>
                        <span className="text-[#a1a1aa]">GHS {data.top_category_amount.toFixed(2)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
