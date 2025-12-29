'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import IncomeModal from '@/components/IncomeModal';
import { fetchIncome, getIncomeSummary, Income, IncomeSummary } from '@/lib/api';
import { Plus, Briefcase, Wallet, Laptop, Gift, GraduationCap, MoreHorizontal, Trash2, LucideIcon } from 'lucide-react';

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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [incomesData, summaryData] = await Promise.all([
                fetchIncome(undefined, undefined, 100), // Fetch last 100
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

    return (
        <div className="flex min-h-screen bg-black font-sans">
            <Sidebar />

            <main className="flex-1 pt-20 lg:pt-8 px-4 pb-20 max-w-lg mx-auto lg:ml-60">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Income</h1>
                        <p className="text-sm text-[#a1a1aa]">Track your earnings</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20 transition-all"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                {/* Summary Card */}
                <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                    <p className="text-sm text-[#a1a1aa] mb-1">Total Income (This Month)</p>
                    <div className="text-3xl font-bold text-white mb-4">
                        GH₵ {summary?.total_income.toFixed(2) || '0.00'}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 py-1.5 px-3 rounded-full w-fit">
                        <span>📈</span>
                        <span>Keep it up! Save 20% of this if you can.</span>
                    </div>
                </div>

                {/* History List */}
                <h3 className="text-sm font-medium text-[#a1a1aa] mb-4 uppercase tracking-wider text-xs">History</h3>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-[#171717] rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : incomes.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-[#171717] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            💸
                        </div>
                        <p className="text-[#a1a1aa] text-sm">No income records found.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-emerald-500 text-sm font-medium mt-2 hover:underline"
                        >
                            Log your first paycheck
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {incomes.map((income) => (
                            <div key={income.id} className="bg-[#171717] border border-[#262626] rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        {(() => {
                                            const IconComponent = INCOME_ICONS[income.category] || Wallet;
                                            return <IconComponent className="w-5 h-5 text-emerald-400" />;
                                        })()}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{income.source}</p>
                                        <p className="text-xs text-[#a1a1aa]">{new Date(income.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-emerald-400 font-medium">+GH₵{income.amount.toFixed(2)}</p>
                                        <p className="text-xs text-[#52525b]">{income.category}</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Delete this income?')) return;
                                            try {
                                                const { deleteIncome } = await import('@/lib/api');
                                                await deleteIncome(income.id);
                                                loadData();
                                            } catch (e) {
                                                console.error('Failed to delete:', e);
                                            }
                                        }}
                                        className="text-[#52525b] hover:text-red-400 transition-colors p-1"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {isModalOpen && (
                <IncomeModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        loadData();
                        // Optional: Keep modal open or close it? Close it for now.
                        // setIsModalOpen(false); 
                    }}
                />
            )}
        </div>
    );
}
