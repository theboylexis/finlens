'use client';

import { useEffect, useState } from 'react';
import CategoryBadge from './CategoryBadge';
import SplitExpenseModal from './SplitExpenseModal';
import { Split, Trash2 } from 'lucide-react';
import { API_URL, getAuthHeaders } from '@/lib/api';

interface Expense {
    id: number;
    amount: number;
    description: string;
    category: string;
    date: string;
    payment_method: string | null;
    ai_suggested_category: string | null;
    confidence_score: number | null;
    categorization_method: string;
    user_overridden: boolean;
}

interface ExpenseListProps {
    refreshTrigger?: number;
}

export default function ExpenseList({ refreshTrigger }: ExpenseListProps) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [splitExpense, setSplitExpense] = useState<Expense | null>(null);

    useEffect(() => {
        loadExpenses();
    }, [refreshTrigger]);

    const loadExpenses = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/expenses/`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to load expenses');
            const data = await response.json();
            setExpenses(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this expense?')) return;
        try {
            const response = await fetch(`${API_URL}/api/expenses/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to delete');
            loadExpenses();
        } catch (err) {
            console.error('Error deleting expense:', err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatCurrency = (amount: number) => `GH₵${amount.toFixed(2)}`;

    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-[#0f0f0f] rounded-md animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return <p className="text-sm text-red-400">{error}</p>;
    }

    if (expenses.length === 0) {
        return <p className="text-sm text-[#52525b] text-center py-8">No expenses yet</p>;
    }

    return (
        <>
            <div className="space-y-1">
                {expenses.map((expense) => (
                    <div
                        key={expense.id}
                        className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-[#262626] rounded-md hover:border-[#404040] transition-colors group"
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white truncate">{expense.description}</span>
                                    <CategoryBadge
                                        category={expense.category}
                                        confidence={expense.confidence_score ?? undefined}
                                        method={expense.categorization_method as 'regex' | 'ai' | 'manual'}
                                        showConfidence={expense.categorization_method !== 'manual'}
                                        size="sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[#52525b]">
                                    <span>{formatDate(expense.date)}</span>
                                    {expense.payment_method && <span>• {expense.payment_method}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-emerald-400">{formatCurrency(expense.amount)}</span>
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setSplitExpense(expense)}
                                    className="p-1 text-[#52525b] hover:text-cyan-400 transition-colors"
                                    title="Split"
                                >
                                    <Split className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(expense.id)}
                                    className="p-1 text-[#52525b] hover:text-red-400 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {splitExpense && (
                <SplitExpenseModal
                    expense={splitExpense}
                    onClose={() => setSplitExpense(null)}
                    onSuccess={() => { setSplitExpense(null); loadExpenses(); }}
                />
            )}
        </>
    );
}
