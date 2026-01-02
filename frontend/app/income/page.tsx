'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import IncomeModal from '@/components/IncomeModal';
import ConfirmModal from '@/components/ConfirmModal';
import EmptyState from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { fetchIncome, getIncomeSummary, deleteIncome, Income, IncomeSummary } from '@/lib/api';
import { Plus, Briefcase, Wallet, Laptop, Gift, GraduationCap, MoreHorizontal, Trash2, TrendingUp, LucideIcon } from 'lucide-react';

const INCOME_ICONS: Record<string, LucideIcon> = {
    'Job': Briefcase,
    'Allowance': Wallet,
    'Freelance': Laptop,
    'Gift': Gift,
    'Scholarship': GraduationCap,
    'Other': MoreHorizontal,
};

export default function IncomePage() {
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [summary, setSummary] = useState<IncomeSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [incomesData, summaryData] = await Promise.all([
                fetchIncome(undefined, undefined, 100),
                getIncomeSummary()
            ]);
            setIncomes(incomesData);
            setSummary(summaryData);
        } catch (error) {
            console.error('Failed to load income data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await deleteIncome(deleteId);
            setDeleteId(null);
            loadData();
        } catch (e) {
            console.error('Failed to delete:', e);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AppLayout
            title="Income"
            actions={
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-md transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Income
                </button>
            }
        >
            {/* Summary Card */}
            <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-medium text-[#a1a1aa]">This Month</h2>
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-emerald-400">
                    GH₵ {summary?.total_income.toFixed(2) || '0.00'}
                </div>
            </div>

            {/* History List */}
            <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-4">History</h3>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-14 bg-[#0f0f0f] rounded-md animate-pulse" />
                        ))}
                    </div>
                ) : incomes.length === 0 ? (
                    <EmptyState
                        icon={Wallet}
                        title="No income records yet"
                        description="Track your income to see your full financial picture."
                        actionLabel="Log First Income"
                        onAction={() => setIsModalOpen(true)}
                    />
                ) : (
                    <div className="space-y-2">
                        {incomes.map((income) => (
                            <div key={income.id} className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-[#262626] rounded-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        {(() => {
                                            const IconComponent = INCOME_ICONS[income.category] || Wallet;
                                            return <IconComponent className="w-4 h-4 text-emerald-400" />;
                                        })()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{income.source}</p>
                                        <p className="text-xs text-[#52525b]">{new Date(income.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-emerald-400">+GH₵{income.amount.toFixed(2)}</p>
                                        <p className="text-xs text-[#52525b]">{income.category}</p>
                                    </div>
                                    <button
                                        onClick={() => setDeleteId(income.id)}
                                        className="p-1 text-[#52525b] hover:text-red-400 transition-colors"
                                        title="Delete income"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <IncomeModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        loadData();
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Income"
                message="Are you sure you want to delete this income entry?"
                isLoading={isDeleting}
                confirmText="Delete"
                type="danger"
            />
        </AppLayout>
    );
}
