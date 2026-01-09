'use client';

import { useState, useEffect } from 'react';

import { getSafeToSpend, getIncomeSummary, SafeToSpend, CategoryBudgetStatus } from '@/lib/api';
import { Wallet, TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface SafeToSpendCardProps {
    refreshTrigger?: number;
}

export default function SafeToSpendCard({ refreshTrigger = 0 }: SafeToSpendCardProps) {
    const [data, setData] = useState<SafeToSpend | null>(null);
    const [income, setIncome] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showBudgetDetails, setShowBudgetDetails] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [result, incomeSummary] = await Promise.all([
                    getSafeToSpend(),
                    getIncomeSummary()
                ]);
                setData(result);
                setIncome(incomeSummary?.total_income ?? null);
                setError(null);
            } catch (err) {
                setError('Unable to calculate');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshTrigger]);

    const getStatusConfig = () => {
        if (!data) return { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Wallet };

        switch (data.status) {
            case 'healthy':
                return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: TrendingUp };
            case 'caution':
                return { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertCircle };
            case 'danger':
                return { color: 'text-red-400', bg: 'bg-red-500/10', icon: TrendingDown };
            case 'no_budget':
            case 'no_income':
                return { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: Wallet };
            default:
                return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Wallet };
        }
    };

    const renderCategoryStatus = (cat: CategoryBudgetStatus) => {
        const isExceeded = cat.status === 'exceeded';
        return (
            <div key={cat.category} className={`flex justify-between items-center py-1 px-2 rounded ${isExceeded ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                <span className="text-xs text-[#a1a1aa]">{cat.category}</span>
                <div className="text-right">
                    <span className={`text-xs font-medium ${isExceeded ? 'text-red-400' : 'text-amber-400'}`}>
                        {cat.percentage_used.toFixed(0)}%
                    </span>
                    <span className="text-xs text-[#52525b] ml-2">
                        GHS {cat.spent.toFixed(0)} / {cat.limit.toFixed(0)}
                    </span>
                </div>
            </div>
        );
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    if (loading) {
        return (
            <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-[#262626] rounded w-1/2 mb-3"></div>
                <div className="h-10 bg-[#262626] rounded w-3/4"></div>
            </div>
        );
    }

    const hasWarnings = data?.has_budget_warnings;
    const totalWarnings = (data?.categories_over_budget?.length || 0) + (data?.categories_near_limit?.length || 0);

    return (
        <div className={`${config.bg} border border-[#262626] rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-[#a1a1aa]">Safe to Spend Today</h2>
                <Icon className={`w-5 h-5 ${config.color}`} />
            </div>

            {income !== null && income > 0 && (
                <div className="mb-2 text-xs text-[#a1a1aa]">
                    Monthly income: <span className="font-semibold text-emerald-400">GHS {income.toFixed(2)}</span>
                </div>
            )}

            {error ? (
                <p className="text-sm text-[#52525b]">{error}</p>
            ) : data ? (
                (data.status === 'no_budget' || data.status === 'no_income') ? (
                    <div className="text-center py-2">
                        <div className="text-2xl font-bold text-gray-400 mb-3">— —</div>
                        <p className="text-xs text-emerald-400">
                            💡 Add your income to see your safe spending amount
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={`text-3xl font-bold ${config.color} mb-2`}>
                            GHS {data.safe_to_spend_today.toFixed(2)}
                        </div>

                        {/* Daily Overspend Warning */}
                        {data.over_daily_limit && (
                            <div className="mb-3 p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                                <div className="flex items-center gap-2 text-amber-400">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-xs font-medium">Over daily limit!</span>
                                </div>
                                <p className="text-xs text-amber-300 mt-1">
                                    Spent <span className="font-semibold">GHS {data.spent_today.toFixed(2)}</span> today —
                                    that's <span className="font-semibold">GHS {data.daily_overspend_amount.toFixed(2)}</span> over your safe amount.
                                </p>
                            </div>
                        )}

                        {/* Show today's spending even when not over limit */}
                        {!data.over_daily_limit && data.spent_today > 0 && (
                            <div className="mb-2 text-xs text-[#a1a1aa]">
                                Spent today: <span className="font-semibold text-emerald-400">GHS {data.spent_today.toFixed(2)}</span>
                                <span className="text-[#52525b] ml-1">
                                    (GHS {(data.safe_to_spend_today - data.spent_today).toFixed(2)} left)
                                </span>
                            </div>
                        )}

                        <div className="space-y-1 text-xs text-[#52525b]">
                            <div className="flex justify-between">
                                <span>Budget remaining:</span>
                                <span className="text-[#a1a1aa]">GHS {data.remaining_budget.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Days left in month:</span>
                                <span className="text-[#a1a1aa]">{data.days_remaining}</span>
                            </div>
                        </div>

                        {/* Budget Warnings Section */}
                        {hasWarnings && (
                            <div className="mt-3 pt-3 border-t border-[#262626]">
                                <button
                                    onClick={() => setShowBudgetDetails(!showBudgetDetails)}
                                    className="flex items-center justify-between w-full text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                        <span className="text-xs font-medium text-amber-400">
                                            {totalWarnings} budget{totalWarnings > 1 ? 's' : ''} need attention
                                        </span>
                                    </div>
                                    {showBudgetDetails ? (
                                        <ChevronUp className="w-4 h-4 text-[#52525b]" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-[#52525b]" />
                                    )}
                                </button>

                                {showBudgetDetails && (
                                    <div className="mt-2 space-y-1">
                                        {data.categories_over_budget?.map(renderCategoryStatus)}
                                        {data.categories_near_limit?.map(renderCategoryStatus)}
                                    </div>
                                )}
                            </div>
                        )}

                        {data.status === 'danger' && !hasWarnings && (
                            <p className="mt-3 text-xs text-red-400">
                                ⚠️ You've exceeded your budget for this month
                            </p>
                        )}
                    </>
                )
            ) : null}
        </div>
    );
}
