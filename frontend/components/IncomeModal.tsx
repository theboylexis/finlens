'use client';

import { useState, useEffect } from 'react';
import { fetchIncome, createIncome, deleteIncome, Income, IncomeCreate } from '@/lib/api';
import ConfirmModal from './ConfirmModal';
import { Briefcase, Wallet, Laptop, Gift, GraduationCap, MoreHorizontal, X, Trash2, LucideIcon } from 'lucide-react';

interface IncomeModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface IncomeCategory {
    name: string;
    icon: LucideIcon;
}

const INCOME_CATEGORIES: IncomeCategory[] = [
    { name: 'Job', icon: Briefcase },
    { name: 'Allowance', icon: Wallet },
    { name: 'Freelance', icon: Laptop },
    { name: 'Gift', icon: Gift },
    { name: 'Scholarship', icon: GraduationCap },
    { name: 'Other', icon: MoreHorizontal },
];

export default function IncomeModal({ onClose, onSuccess }: IncomeModalProps) {
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('');
    const [category, setCategory] = useState(INCOME_CATEGORIES[0].name);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isRecurring, setIsRecurring] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadIncomes();
    }, []);

    const loadIncomes = async () => {
        try {
            setLoading(true);
            const data = await fetchIncome();
            setIncomes(data);
        } catch (error) {
            console.error('Failed to load income:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !source) return;

        setSaving(true);
        try {
            await createIncome({
                amount: parseFloat(amount),
                source,
                category,
                date,
                is_recurring: isRecurring
            });

            // Reset form and reload
            setAmount('');
            setSource('');
            setDate(new Date().toISOString().split('T')[0]);
            setIsRecurring(false);
            await loadIncomes();
            onSuccess(); // Trigger parent refresh
        } catch (error) {
            console.error('Error saving income:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await deleteIncome(deleteId);
            setIncomes(incomes.filter(i => i.id !== deleteId));
            setDeleteId(null);
            onSuccess();
        } catch (error) {
            console.error('Error deleting income:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="bg-[#171717] border border-[#262626] rounded-xl w-full max-w-lg p-6 max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Income Tracker</h2>
                            <p className="text-xs text-[#a1a1aa]">Log your earnings and inflows</p>
                        </div>
                        <button onClick={onClose} className="text-[#52525b] hover:text-white transition-colors text-2xl">×</button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                        {/* Add New Income Form */}
                        <form onSubmit={handleSave} className="space-y-4 bg-[#0f0f0f] border border-[#262626] rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-[#a1a1aa] mb-1">Amount (GH₵)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 bg-[#171717] border border-[#262626] rounded text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[#a1a1aa] mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#171717] border border-[#262626] rounded text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-[#a1a1aa] mb-1">Source / Description</label>
                                <input
                                    type="text"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    placeholder="e.g. Starbucks Paycheck"
                                    className="w-full px-3 py-2 bg-[#171717] border border-[#262626] rounded text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-[#a1a1aa] mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#171717] border border-[#262626] rounded text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    >
                                        {INCOME_CATEGORIES.map(cat => (
                                            <option key={cat.name} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                            className="w-4 h-4 rounded border-[#262626] bg-[#171717] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#171717]"
                                        />
                                        <span className="text-sm text-[#a1a1aa] group-hover:text-white transition-colors">Recurring?</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <><span>+</span> Add Income</>
                                )}
                            </button>
                        </form>

                        {/* Recent Income List */}
                        <div>
                            <h3 className="text-sm font-medium text-white mb-3">Recent Income</h3>
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : incomes.length === 0 ? (
                                <div className="text-center py-8 bg-[#0f0f0f] border border-[#262626] border-dashed rounded-lg">
                                    <p className="text-[#52525b] text-sm">No income recorded yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {incomes.map(inc => (
                                        <div key={inc.id} className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-[#262626] rounded-lg hover:border-[#404040] transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                    {(() => {
                                                        const IconComponent = INCOME_CATEGORIES.find(c => c.name === inc.category)?.icon || Wallet;
                                                        return <IconComponent className="w-4 h-4 text-emerald-400" />;
                                                    })()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{inc.source}</p>
                                                    <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
                                                        <span>{new Date(inc.date).toLocaleDateString()}</span>
                                                        {inc.is_recurring && (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">Recurring</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-medium text-emerald-400">+GH₵{inc.amount.toFixed(2)}</span>
                                                <button
                                                    onClick={() => setDeleteId(inc.id)}
                                                    className="text-[#52525b] hover:text-red-400 transition-all p-1"
                                                    title="Delete income"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
        </>
    );
}
