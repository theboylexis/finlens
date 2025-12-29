'use client';

import { useState, useEffect } from 'react';

import { getSafeToSpend, getIncomeSummary, SafeToSpend } from '@/lib/api';
import { Wallet, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface SafeToSpendCardProps {
    refreshTrigger?: number;
}

export default function SafeToSpendCard({ refreshTrigger = 0 }: SafeToSpendCardProps) {
    const [data, setData] = useState<SafeToSpend | null>(null);
    const [income, setIncome] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                        <p className="text-xs text-amber-400">
                            💡 Add your income to see your safe spending amount
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={`text-3xl font-bold ${config.color} mb-2`}>
                            GHS {data.safe_to_spend_today.toFixed(2)}
                        </div>
                        <div className="space-y-1 text-xs text-[#52525b]">
                            <div className="flex justify-between">
                                <span>Budget remaining:</span>
                                <span className="text-[#a1a1aa]">GHS {data.remaining_budget.toFixed(2)}</span>
                            </div>
                            {data.goals_reserved > 0 && (
                                <div className="flex justify-between">
                                    <span>Reserved for goals:</span>
                                    <span className="text-[#a1a1aa]">GHS {data.goals_reserved.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Days left in month:</span>
                                <span className="text-[#a1a1aa]">{data.days_remaining}</span>
                            </div>
                        </div>
                        {income !== null && (
                            <div className="mt-2 text-xs text-[#a1a1aa]">
                                {/* Optionally show what it would be if based on income */}
                                <span className="font-semibold">If based on income:</span> GHS {(income - data.spent_this_month).toFixed(2)}
                            </div>
                        )}
                        {data.status === 'danger' && (
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
