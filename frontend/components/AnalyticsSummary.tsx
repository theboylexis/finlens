'use client';

import { useEffect, useState } from 'react';
import { getAuthHeaders, API_URL } from '@/lib/api';
import { TrendingUp, TrendingDown, Minus, BarChart3, Receipt, Wallet } from 'lucide-react';

interface AnalyticsSummaryData {
    total_expenses: number;
    expense_count: number;
    average_expense: number;
    top_category: string;
    top_category_amount: number;
}

export default function AnalyticsSummary() {
    const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/analytics/summary`, {
                    headers: getAuthHeaders()
                });
                setSummary(await response.json());
            } catch (error) {
                console.error('Failed to fetch summary:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Get emotional state based on spending patterns
    const getSpendingInsight = () => {
        if (!summary) return { emoji: '📊', message: 'Loading insights...', color: 'text-gray-400' };

        if (summary.expense_count === 0) {
            return { emoji: '✨', message: 'No expenses yet', color: 'text-gray-400' };
        }
        if (summary.average_expense < 20) {
            return { emoji: '🟢', message: 'Small transactions — disciplined!', color: 'text-emerald-400' };
        }
        if (summary.average_expense < 50) {
            return { emoji: '🟡', message: 'Moderate spending', color: 'text-amber-400' };
        }
        return { emoji: '🟠', message: 'Larger transactions this month', color: 'text-orange-400' };
    };

    const insight = getSpendingInsight();

    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-4 bg-[#171717] border border-[#262626] rounded-lg animate-pulse">
                        <div className="h-3 bg-[#262626] rounded w-16 mb-2"></div>
                        <div className="h-6 bg-[#262626] rounded w-24"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!summary) {
        return <div className="text-sm text-[#52525b]">No data available</div>;
    }

    return (
        <div className="space-y-4">
            {/* Emotional Header */}
            <div className="flex items-center gap-3 p-4 bg-[#171717] border border-[#262626] rounded-lg">
                <span className="text-2xl">{insight.emoji}</span>
                <div>
                    <h2 className={`text-sm font-medium ${insight.color}`}>{insight.message}</h2>
                    <p className="text-xs text-[#52525b]">This month's spending overview</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Spent */}
                <div className="p-4 bg-[#171717] border border-[#262626] rounded-lg transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-[#52525b]" />
                        <p className="text-xs text-[#52525b]">Total Spent</p>
                    </div>
                    <p className="text-lg font-semibold text-emerald-400">
                        GH₵{summary.total_expenses.toFixed(2)}
                    </p>
                </div>

                {/* Transactions */}
                <div className="p-4 bg-[#171717] border border-[#262626] rounded-lg transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <Receipt className="w-4 h-4 text-[#52525b]" />
                        <p className="text-xs text-[#52525b]">Transactions</p>
                    </div>
                    <p className="text-lg font-semibold text-white">{summary.expense_count}</p>
                </div>

                {/* Average */}
                <div className="p-4 bg-[#171717] border border-[#262626] rounded-lg transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-[#52525b]" />
                        <p className="text-xs text-[#52525b]">Average</p>
                    </div>
                    <p className="text-lg font-semibold text-cyan-400">
                        GH₵{summary.average_expense.toFixed(2)}
                    </p>
                </div>

                {/* Top Category */}
                <div className="p-4 bg-[#171717] border border-[#262626] rounded-lg transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-[#52525b]" />
                        <p className="text-xs text-[#52525b]">Top Category</p>
                    </div>
                    <p className="text-lg font-semibold text-white truncate">{summary.top_category || '—'}</p>
                    {summary.top_category_amount > 0 && (
                        <p className="text-xs text-emerald-400 mt-0.5">GH₵{summary.top_category_amount.toFixed(2)}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
