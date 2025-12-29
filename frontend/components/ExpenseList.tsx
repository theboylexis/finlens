'use client';

import { useEffect, useState } from 'react';
import CategoryBadge from './CategoryBadge';
import SplitExpenseModal from './SplitExpenseModal';
import ConfirmModal from './ConfirmModal';
import { Split, Trash2, Target, Plus } from 'lucide-react';
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
    onDeleteSuccess?: () => void;
}

export default function ExpenseList({ refreshTrigger, onDeleteSuccess }: ExpenseListProps) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [splitExpense, setSplitExpense] = useState<Expense | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const confirmDelete = (id: number) => {
        setDeleteId(id);
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            setIsDeleting(true);
            const response = await fetch(`${API_URL}/api/expenses/${deleteId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to delete');
            loadExpenses();
            setDeleteId(null);
            if (onDeleteSuccess) onDeleteSuccess();
        } catch (err) {
            console.error('Error deleting expense:', err);
        } finally {
            setIsDeleting(false);
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
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-sm font-medium text-white mb-2">No expenses yet</h3>
                <p className="text-xs text-[#52525b] mb-4 max-w-xs">
                    Add your first expense to start tracking! 🎯<br />
                    Our AI will automatically categorize it for you.
                </p>
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openExpenseForm'))}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add First Expense
                </button>
            </div>
        );
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
                                    onClick={() => confirmDelete(expense.id)}
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
                    onSuccess={() => {
                        setSplitExpense(null);
                        loadExpenses();
                        if (onDeleteSuccess) onDeleteSuccess();
                    }}
                />
            )}

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Expense"
                message="Are you sure you want to delete this expense? This action cannot be undone."
                isLoading={isDeleting}
                confirmText="Delete Expense"
            />
        </>
    );
}
