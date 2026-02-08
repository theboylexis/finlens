'use client';

import { useState, useEffect } from 'react';
import { getWeeklySummary, WeeklySummary } from '@/lib/api';
import { Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

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

    if (loading) {
        return (
            <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-[#262626] rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-[#262626] rounded w-3/4"></div>
            </div>
        );
    }

    if (!data) return null;

    // Smart visibility: Only show week-over-week if meaningful
    // - Has enough data (days_into_week > 0 means we have some data)
    // - Change is significant (>= 10%)
    // - Last week had spending to compare against
    const hasEnoughData = data.days_into_week >= 1;
    const hasLastWeekData = data.last_week_total > 0;
    const isSignificantChange = Math.abs(data.change_percent) >= 10;
    const showComparison = hasEnoughData && hasLastWeekData && isSignificantChange;

    const isSpendingUp = data.change_percent > 0;

    // Calculate daily average for this week
    const dailyAverage = data.days_into_week > 0
        ? data.this_week_total / data.days_into_week
        : 0;

    // Smart insight message
    const getInsightMessage = () => {
        if (data.this_week_count === 0) {
            return { show: true, message: 'No expenses recorded this week yet', type: 'neutral' };
        }
        if (!hasLastWeekData) {
            return { show: true, message: 'First week tracking — keep it up!', type: 'info' };
        }
        if (data.change_percent <= -20) {
            return { show: true, message: '🎉 Great week! Spending way down', type: 'success' };
        }
        if (data.change_percent >= 50) {
            return { show: true, message: '⚡ Higher spending than usual', type: 'warning' };
        }
        return { show: false, message: '', type: 'neutral' };
    };

    const insight = getInsightMessage();

    return (
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-[#a1a1aa]">This Week</h2>
                <Calendar className="w-4 h-4 text-cyan-400" />
            </div>

            {/* Hero Number */}
            <div className="text-2xl font-bold text-white mb-2 transition-all duration-300">
                GHS {data.this_week_total.toFixed(2)}
            </div>

            {/* Condensed Context Line */}
            <div className="text-xs text-[#52525b] mb-2">
                {data.this_week_count === 0 ? (
                    <span>No expenses yet</span>
                ) : (
                    <>
                        {data.this_week_count} expense{data.this_week_count !== 1 ? 's' : ''}
                        {data.top_category && (
                            <span className="text-[#71717a]"> · {data.top_category}</span>
                        )}
                    </>
                )}
            </div>

            {/* Daily Average */}
            {data.days_into_week > 0 && data.this_week_count > 0 && (
                <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-3 h-3 text-[#52525b]" />
                    <span className="text-xs text-[#52525b]">
                        ~GHS {dailyAverage.toFixed(2)}/day avg
                    </span>
                </div>
            )}

            {/* Smart Insight Message */}
            {insight.show && (
                <div className={`text-xs mt-2 ${insight.type === 'success' ? 'text-emerald-400' :
                        insight.type === 'warning' ? 'text-amber-400' :
                            insight.type === 'info' ? 'text-cyan-400' :
                                'text-[#52525b]'
                    } animate-fade-in`}>
                    {insight.message}
                </div>
            )}

            {/* Week-over-week comparison - only if significant and meaningful */}
            {showComparison && (
                <div className="mt-3 pt-3 border-t border-[#262626] flex items-center gap-2 animate-fade-in">
                    {isSpendingUp ? (
                        <TrendingUp className="w-4 h-4 text-red-400" />
                    ) : (
                        <TrendingDown className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className={`text-xs ${isSpendingUp ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isSpendingUp ? '+' : ''}{data.change_percent}% vs last week
                    </span>
                </div>
            )}
        </div>
    );
}
