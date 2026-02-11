'use client';

import { useState } from 'react';
import { X, Target, Plane, Car, Home, Laptop, BookOpen, Briefcase, Heart, GraduationCap, Dumbbell } from 'lucide-react';
import { API_URL, getAuthHeaders } from '@/lib/api';

interface Goal {
    id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: string | null;
    icon: string;
    color: string;
    is_completed: boolean;
}

interface EditGoalModalProps {
    goal: Goal;
    onClose: () => void;
    onSuccess: () => void;
}

const GOAL_ICONS = [
    { icon: Target, name: 'Target' },
    { icon: Plane, name: 'Travel' },
    { icon: Car, name: 'Car' },
    { icon: Home, name: 'Home' },
    { icon: Laptop, name: 'Tech' },
    { icon: BookOpen, name: 'Education' },
    { icon: Briefcase, name: 'Business' },
    { icon: Heart, name: 'Health' },
    { icon: GraduationCap, name: 'Grad' },
    { icon: Dumbbell, name: 'Fitness' },
];

export default function EditGoalModal({ goal, onClose, onSuccess }: EditGoalModalProps) {
    const [name, setName] = useState(goal.name);
    const [targetAmount, setTargetAmount] = useState(goal.target_amount.toString());
    const [targetDate, setTargetDate] = useState(goal.target_date || '');
    const [iconIndex, setIconIndex] = useState(
        Math.max(0, GOAL_ICONS.findIndex((item) => item.name === goal.icon))
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const newTarget = parseFloat(targetAmount);
            if (newTarget < goal.current_amount) {
                throw new Error(`Target must be at least GH₵${goal.current_amount.toFixed(2)} (your current savings)`);
            }

            const response = await fetch(`${API_URL}/api/goals/${goal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    name: name.trim(),
                    target_amount: newTarget,
                    target_date: targetDate || null,
                    icon: GOAL_ICONS[iconIndex].name,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to update goal');
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => `GH₵${amount.toFixed(2)}`;

    const inputClass = "w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500";
    const labelClass = "block text-xs text-[#a1a1aa] mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-[#171717] border border-[#262626] rounded-lg w-full max-w-md p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-sm font-medium text-white">Edit Goal</h2>
                        <p className="text-xs text-[#52525b]">Current savings: {formatCurrency(goal.current_amount)}</p>
                    </div>
                    <button onClick={onClose} className="p-1 text-[#52525b] hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>Goal Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Spring Break Trip"
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Target Amount (GH₵)</label>
                        <input
                            type="number"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            placeholder="500.00"
                            min="0.01"
                            step="0.01"
                            required
                            className={inputClass}
                        />
                        {goal.current_amount > 0 && (
                            <p className="text-xs text-[#52525b] mt-1">
                                Minimum: {formatCurrency(goal.current_amount)} (already saved)
                            </p>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Target Date (Optional)</label>
                        <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Choose an Icon</label>
                        <div className="flex flex-wrap gap-2">
                            {GOAL_ICONS.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setIconIndex(index)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${iconIndex === index
                                            ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                                            : 'bg-[#0f0f0f] border border-[#262626] text-[#a1a1aa] hover:border-[#404040]'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {error && (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-md">
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

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
                            disabled={loading}
                            className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
