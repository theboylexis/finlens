'use client';

import { useState } from 'react';
import { X, Target, Plane, Car, Home, Laptop, BookOpen, Briefcase, Heart, GraduationCap, Dumbbell } from 'lucide-react';
import { API_URL, getAuthHeaders } from '@/lib/api';

interface AddGoalModalProps {
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

export default function AddGoalModal({ onClose, onSuccess }: AddGoalModalProps) {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [iconIndex, setIconIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/goals/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    name: name.trim(),
                    target_amount: parseFloat(targetAmount),
                    target_date: targetDate || null,
                    icon: GOAL_ICONS[iconIndex].name,
                    color: '#10b981',
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to create goal');
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500";
    const labelClass = "block text-xs text-[#a1a1aa] mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-[#171717] border border-[#262626] rounded-lg w-full max-w-md p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-white">Create New Goal</h2>
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
                            {loading ? 'Creating...' : 'Create Goal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
