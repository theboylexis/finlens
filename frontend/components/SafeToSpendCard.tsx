'use client';

import { useState, useEffect } from 'react';
import { getSafeToSpend, getIncomeSummary, SafeToSpend, CategoryBudgetStatus } from '@/lib/api';
import { Wallet, ChevronDown, ChevronUp, AlertTriangle, Plus, Sparkles } from 'lucide-react';

interface SafeToSpendCardProps {
    refreshTrigger?: number;
    onAddIncome?: () => void;
}

export default function SafeToSpendCard({ refreshTrigger = 0, onAddIncome }: SafeToSpendCardProps) {
    const [data, setData] = useState<SafeToSpend | null>(null);
    const [income, setIncome] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);

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

    // Emotional state configuration
    const getEmotionalState = (usedPercent: number, overLimit: boolean) => {
        if (overLimit) {
            return {
                emoji: '🔴',
                message: 'Over budget today',
                color: 'text-red-400',
                bg: 'bg-red-500/10',
                barColor: 'bg-red-500'
            };
        }
        if (usedPercent < 50) {
            return {
                emoji: '🟢',
                message: 'You\'re on track',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                barColor: 'bg-emerald-500'
            };
        }
        if (usedPercent < 80) {
            return {
                emoji: '🟡',
                message: 'Watch your spending',
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                barColor: 'bg-amber-500'
            };
        }
        if (usedPercent < 100) {
            return {
                emoji: '🟠',
                message: 'Almost at limit',
                color: 'text-orange-400',
                bg: 'bg-orange-500/10',
                barColor: 'bg-orange-500'
            };
        }
        return {
            emoji: '🔴',
            message: 'Over budget',
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            barColor: 'bg-red-500'
        };
    };

    // Micro-celebration message
    const getCelebrationMessage = (leftToSpend: number, usedPercent: number, spentToday: number) => {
        if (spentToday === 0) {
            return { show: true, message: '✨ No spending yet today — great start!' };
        }
        if (usedPercent < 30 && spentToday > 0) {
            return { show: true, message: `🎉 Nice! You saved GHS ${leftToSpend.toFixed(2)} for later` };
        }
        if (usedPercent < 50) {
            return { show: true, message: '💪 Staying disciplined today!' };
        }
        return { show: false, message: '' };
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

    if (loading) {
        return (
            <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-[#262626] rounded w-1/2 mb-3"></div>
                <div className="h-10 bg-[#262626] rounded w-3/4"></div>
            </div>
        );
    }

    // Calculate metrics
    const leftToSpend = data ? Math.max(0, data.safe_to_spend_today - data.spent_today) : 0;
    const usedPercent = data && data.safe_to_spend_today > 0
        ? Math.min(100, (data.spent_today / data.safe_to_spend_today) * 100)
        : 0;

    const emotionalState = getEmotionalState(usedPercent, data?.over_daily_limit || false);
    const celebration = data ? getCelebrationMessage(leftToSpend, usedPercent, data.spent_today) : { show: false, message: '' };
    const hasWarnings = data?.has_budget_warnings;
    const totalWarnings = (data?.categories_over_budget?.length || 0) + (data?.categories_near_limit?.length || 0);

    return (
        <div className={`${emotionalState.bg} border border-[#262626] rounded-lg p-4 transition-all duration-300`}>
            {error ? (
                <p className="text-sm text-[#52525b]">{error}</p>
            ) : data ? (
                (data.status === 'no_budget' || data.status === 'no_income') ? (
                    // Improved empty state with CTA
                    <div className="text-center py-4">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#262626] flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-[#52525b]" />
                        </div>
                        <h3 className="text-sm font-medium text-white mb-1">Set up your budget</h3>
                        <p className="text-xs text-[#52525b] mb-4">
                            Add your monthly income to unlock your daily spending limit
                        </p>
                        <button
                            onClick={onAddIncome}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Income
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Emotional State Header */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{emotionalState.emoji}</span>
                                <span className={`text-sm font-medium ${emotionalState.color}`}>
                                    {emotionalState.message}
                                </span>
                            </div>
                            <Wallet className={`w-5 h-5 ${emotionalState.color}`} />
                        </div>

                        {/* Hero Number */}
                        <div className="mb-1">
                            <span className="text-xs text-[#52525b]">Left to spend today</span>
                        </div>
                        <div className={`text-3xl font-bold ${emotionalState.color} mb-3 transition-all duration-300`}>
                            GHS {leftToSpend.toFixed(2)}
                        </div>

                        {/* Progress Bar with Animation */}
                        <div className="mb-3">
                            <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${emotionalState.barColor} transition-all duration-500 ease-out`}
                                    style={{ width: `${Math.min(100, usedPercent)}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-xs text-[#52525b]">
                                    {usedPercent.toFixed(0)}% of daily budget used
                                </span>
                            </div>
                        </div>

                        {/* Micro-celebration */}
                        {celebration.show && !data.over_daily_limit && (
                            <div className="mb-3 flex items-center gap-2 text-xs text-emerald-400 animate-fade-in">
                                <Sparkles className="w-3 h-3" />
                                <span>{celebration.message}</span>
                            </div>
                        )}

                        {/* Daily Overspend Warning */}
                        {data.over_daily_limit && (
                            <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                                <div className="flex items-center gap-2 text-red-400">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-xs font-medium">
                                        Over by GHS {data.daily_overspend_amount.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Collapsible Details */}
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="flex items-center gap-1 text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                        >
                            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <span>{showDetails ? 'Hide' : 'View'} details</span>
                        </button>

                        {showDetails && (
                            <div className="mt-3 pt-3 border-t border-[#262626] space-y-2 animate-fade-in">
                                {income !== null && income > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-[#52525b]">Monthly income</span>
                                        <span className="text-emerald-400">GHS {income.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#52525b]">Daily allowance</span>
                                    <span className="text-[#a1a1aa]">GHS {data.safe_to_spend_today.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#52525b]">Spent today</span>
                                    <span className="text-[#a1a1aa]">GHS {data.spent_today.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#52525b]">Budget remaining</span>
                                    <span className="text-[#a1a1aa]">GHS {data.remaining_budget.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#52525b]">Days left</span>
                                    <span className="text-[#a1a1aa]">{data.days_remaining}</span>
                                </div>
                            </div>
                        )}

                        {/* Budget Warnings Section */}
                        {hasWarnings && (
                            <div className="mt-3 pt-3 border-t border-[#262626]">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                    <span className="text-xs font-medium text-amber-400">
                                        {totalWarnings} budget{totalWarnings > 1 ? 's' : ''} need attention
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {data.categories_over_budget?.map(renderCategoryStatus)}
                                    {data.categories_near_limit?.map(renderCategoryStatus)}
                                </div>
                            </div>
                        )}
                    </>
                )
            ) : null}
        </div>
    );
}
