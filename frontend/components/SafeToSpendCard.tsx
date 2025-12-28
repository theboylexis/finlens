'use client';

import { useState, useEffect } from 'react';
import { getSafeToSpend, SafeToSpend } from '@/lib/api';
import { Wallet, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function SafeToSpendCard() {
    const [data, setData] = useState<SafeToSpend | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getSafeToSpend();
                setData(result);
                setError(null);
            } catch (err) {
                setError('Unable to calculate');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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

            {error ? (
                <p className="text-sm text-[#52525b]">{error}</p>
            ) : data ? (
                data.status === 'no_budget' ? (
                    <div>
                        <div className="text-3xl font-bold text-gray-400 mb-2">
                            — —
                        </div>
                        <p className="text-xs text-[#52525b] mb-2">
                            You spent <span className="text-white">GHS {data.spent_this_month.toFixed(2)}</span> this month
                        </p>
                        <p className="mt-3 text-xs text-amber-400">
                            💡 Set up budgets in Analytics to see your safe spending amount
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
