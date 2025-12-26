'use client';

import { useState, useEffect } from 'react';
import { getAuthHeaders, API_URL } from '@/lib/api';
import BudgetModal from './BudgetModal';

interface BudgetStatus {
    category: string;
    monthly_limit: number;
    current_spending: number;
    remaining: number;
    percentage_used: number;
    is_over_budget: boolean;
    daily_allowance: number;
    alert_level: string;
    alert_message: string | null;
}

export default function BudgetProgressCards() {
    const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/alerts/budget-status`, {
                headers: getAuthHeaders()
            });
            if (response.ok) setBudgets(await response.json());
        } catch (error) {
            console.error('Error fetching budgets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, []);

    const getProgressColor = (alertLevel: string) => {
        switch (alertLevel) {
            case 'exceeded': return 'bg-red-500';
            case 'danger': return 'bg-orange-500';
            case 'warning': return 'bg-amber-500';
            default: return 'bg-emerald-500';
        }
    };

    if (loading) {
        return (
            <div className="h-24 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <>
            {budgets.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-sm text-[#52525b] mb-3">No budgets set</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-3 py-1.5 bg-emerald-500 text-black text-xs font-medium rounded-md"
                    >
                        + Set Budget
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {budgets.map((budget) => (
                            <div key={budget.category} className="p-3 bg-[#0f0f0f] border border-[#262626] rounded-md">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-white truncate">{budget.category}</span>
                                    {budget.is_over_budget && (
                                        <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">Over</span>
                                    )}
                                </div>
                                <div className="h-1.5 bg-[#262626] rounded-full overflow-hidden mb-2">
                                    <div
                                        className={`h-full ${getProgressColor(budget.alert_level)} transition-all`}
                                        style={{ width: `${Math.min(100, budget.percentage_used)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#52525b]">
                                        GH₵{budget.current_spending.toFixed(0)} / GH₵{budget.monthly_limit.toFixed(0)}
                                    </span>
                                    <span className={budget.percentage_used >= 100 ? 'text-red-400' : 'text-emerald-400'}>
                                        {budget.percentage_used.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full py-2 border border-[#262626] text-xs text-[#52525b] hover:text-white rounded-md transition-colors"
                    >
                        Manage Budgets
                    </button>
                </div>
            )}

            {showModal && (
                <BudgetModal
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchBudgets}
                />
            )}
        </>
    );
}
