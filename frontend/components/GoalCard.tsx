'use client';

import { Check, Plus, Trash2, Target, Plane, Car, Home, Laptop, BookOpen, Briefcase, Heart, GraduationCap, Dumbbell } from 'lucide-react';

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

interface GoalCardProps {
    goal: Goal;
    onContribute: (goalId: number, amount: number) => void;
    onDelete: (goalId: number) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    'Target': Target,
    'Travel': Plane,
    'Car': Car,
    'Home': Home,
    'Tech': Laptop,
    'Education': BookOpen,
    'Business': Briefcase,
    'Health': Heart,
    'Grad': GraduationCap,
    'Fitness': Dumbbell,
    // Fallbacks for old emoji-based goals
    '🎯': Target,
    '🏖️': Plane,
    '🚗': Car,
    '🏠': Home,
    '💻': Laptop,
    '📚': BookOpen,
    '✈️': Plane,
    '💍': Heart,
    '🎓': GraduationCap,
    '🏋️': Dumbbell,
};

export default function GoalCard({ goal, onContribute, onDelete }: GoalCardProps) {
    const progress = (goal.current_amount / goal.target_amount) * 100;
    const remaining = goal.target_amount - goal.current_amount;
    const isComplete = goal.is_completed || progress >= 100;

    const formatCurrency = (amount: number) => `GH₵${amount.toLocaleString()}`;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const IconComponent = ICON_MAP[goal.icon] || Target;

    return (
        <div className={`p-4 bg-[#171717] border rounded-lg ${isComplete ? 'border-emerald-500/50' : 'border-[#262626]'}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <IconComponent className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-white">{goal.name}</h3>
                        {goal.target_date && (
                            <p className="text-xs text-[#52525b]">Target: {formatDate(goal.target_date)}</p>
                        )}
                    </div>
                </div>
                {isComplete && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                        <Check className="w-3 h-3" /> Done
                    </span>
                )}
            </div>

            {/* Progress */}
            <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-medium">{formatCurrency(goal.current_amount)}</span>
                    <span className="text-[#52525b]">{formatCurrency(goal.target_amount)}</span>
                </div>
                <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, progress)}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs mt-1">
                    <span className="text-[#52525b]">{progress.toFixed(0)}%</span>
                    {!isComplete && <span className="text-emerald-400">{formatCurrency(remaining)} left</span>}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                {!isComplete && (
                    <>
                        <button
                            onClick={() => onContribute(goal.id, 50)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded hover:bg-emerald-500/30 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> GH₵50
                        </button>
                        <button
                            onClick={() => onContribute(goal.id, 100)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded hover:bg-emerald-500/30 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> GH₵100
                        </button>
                    </>
                )}
                <button
                    onClick={() => onDelete(goal.id)}
                    className="p-1.5 text-[#52525b] hover:text-red-400 transition-colors"
                    title="Delete goal"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
