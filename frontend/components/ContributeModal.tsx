'use client';

import { useState } from 'react';
import { X, PartyPopper } from 'lucide-react';

interface Goal {
    id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    icon: string;
    color: string;
    progress_percentage: number;
}

interface ContributeModalProps {
    goal: Goal;
    onClose: () => void;
    onContribute: (goalId: number, amount: number, note: string) => void;
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200];

export default function ContributeModal({ goal, onClose, onContribute }: ContributeModalProps) {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const remaining = goal.target_amount - goal.current_amount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onContribute(goal.id, parseFloat(amount), note);
        setLoading(false);
    };

    const handleQuickAmount = (quickAmount: number) => {
        setAmount(quickAmount.toString());
    };

    const formatCurrency = (amount: number) => `GH₵${amount.toFixed(2)}`;

    const inputClass = "w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500";
    const labelClass = "block text-xs text-[#a1a1aa] mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-[#171717] border border-[#262626] rounded-lg w-full max-w-md p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-sm font-medium text-white">Add to {goal.name}</h2>
                        <p className="text-xs text-[#52525b]">{formatCurrency(remaining)} remaining</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-[#52525b] hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Progress */}
                <div className="mb-4">
                    <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${Math.min(100, goal.progress_percentage)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-[#52525b] mt-1">
                        <span>{formatCurrency(goal.current_amount)}</span>
                        <span>{formatCurrency(goal.target_amount)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Quick Amounts */}
                    <div>
                        <label className={labelClass}>Quick Add</label>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_AMOUNTS.map((quickAmount) => (
                                <button
                                    key={quickAmount}
                                    type="button"
                                    onClick={() => handleQuickAmount(quickAmount)}
                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${amount === quickAmount.toString()
                                        ? 'bg-emerald-500 text-black'
                                        : 'bg-[#0f0f0f] border border-[#262626] text-[#a1a1aa] hover:border-[#404040]'
                                        }`}
                                >
                                    GH₵{quickAmount}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => handleQuickAmount(remaining)}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${amount === remaining.toString()
                                    ? 'bg-cyan-500 text-black'
                                    : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                                    }`}
                            >
                                Finish Goal
                            </button>
                        </div>
                    </div>

                    {/* Custom Amount */}
                    <div>
                        <label className={labelClass}>Amount (GH₵)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            min="0.01"
                            step="0.01"
                            required
                            className={inputClass}
                        />
                    </div>

                    {/* Note */}
                    <div>
                        <label className={labelClass}>Note (Optional)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g., Birthday money"
                            maxLength={200}
                            className={inputClass}
                        />
                    </div>

                    {/* Preview */}
                    {amount && parseFloat(amount) > 0 && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                            <p className="text-xs text-emerald-400">After this contribution:</p>
                            <p className="text-sm font-semibold text-white">
                                {formatCurrency(goal.current_amount + parseFloat(amount))} / {formatCurrency(goal.target_amount)}
                            </p>
                            {goal.current_amount + parseFloat(amount) >= goal.target_amount && (
                                <p className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                                    <PartyPopper className="w-3 h-3" /> Goal will be complete!
                                </p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-3 py-2 border border-[#262626] text-sm text-[#a1a1aa] rounded-md hover:bg-[#262626] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !amount || parseFloat(amount) <= 0}
                            className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
