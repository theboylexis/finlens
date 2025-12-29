'use client';

import { useState, useEffect } from 'react';
import { API_URL, getAuthHeaders } from '@/lib/api';
import {
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Zap,
    ArrowUp,
    CheckCircle,
    X,
    Lightbulb,
    Flame,
    LucideIcon
} from 'lucide-react';

// Map icon names from backend to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Zap,
    ArrowUp,
    CheckCircle,
    Lightbulb,
    Flame,
};

// Color classes for different nudge types
const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

interface Nudge {
    id: string;
    type: string;
    title: string;
    message: string;
    icon: string;
    color: string;
    priority: number;
    category?: string;
    data?: Record<string, unknown>;
}

interface NudgesResponse {
    nudges: Nudge[];
    prediction?: {
        total_spent: number;
        daily_rate: number;
        projected_total: number;
        total_budget: number;
        projected_overage: number;
        days_elapsed: number;
        days_remaining: number;
    };
}

interface NudgeCardProps {
    refreshTrigger?: number;
}

export default function NudgeCard({ refreshTrigger = 0 }: NudgeCardProps) {
    const [nudges, setNudges] = useState<Nudge[]>([]);
    const [prediction, setPrediction] = useState<NudgesResponse['prediction']>(undefined);
    const [loading, setLoading] = useState(true);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchNudges = async () => {
            try {
                const response = await fetch(`${API_URL}/api/nudges/`, {
                    headers: getAuthHeaders()
                });
                if (!response.ok) throw new Error('Failed to fetch nudges');
                const data: NudgesResponse = await response.json();
                setNudges(data.nudges);
                setPrediction(data.prediction);
            } catch (error) {
                console.error('Failed to fetch nudges:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNudges();
    }, [refreshTrigger]);

    const handleDismiss = (id: string) => {
        setDismissedIds(prev => new Set([...prev, id]));
    };

    const visibleNudges = nudges.filter(n => !dismissedIds.has(n.id));

    if (loading) {
        return (
            <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-[#262626] rounded w-1/2 mb-3"></div>
                <div className="h-12 bg-[#262626] rounded"></div>
            </div>
        );
    }

    if (visibleNudges.length === 0) {
        return null; // Don't show card if no nudges
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-medium text-white">Smart Insights</h2>
            </div>

            {visibleNudges.slice(0, 3).map((nudge) => {
                const IconComponent = ICON_MAP[nudge.icon] || AlertTriangle;
                const colors = COLOR_MAP[nudge.color] || COLOR_MAP.amber;

                return (
                    <div
                        key={nudge.id}
                        className={`${colors.bg} border ${colors.border} rounded-lg p-3 transition-all`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`shrink-0 w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                                <IconComponent className={`w-4 h-4 ${colors.text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-sm font-medium text-white truncate">{nudge.title}</h3>
                                    <button
                                        onClick={() => handleDismiss(nudge.id)}
                                        className="shrink-0 text-[#52525b] hover:text-white transition-colors"
                                        title="Dismiss"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-[#a1a1aa] mt-0.5 leading-relaxed">{nudge.message}</p>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Spending Prediction Summary */}
            {prediction && prediction.projected_overage > 0 && (
                <div className="bg-[#0f0f0f] border border-[#262626] rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-medium text-white">Spending Forecast</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-[#52525b]">Daily rate</span>
                            <p className="text-white font-medium">GHS {prediction.daily_rate.toFixed(2)}</p>
                        </div>
                        <div>
                            <span className="text-[#52525b]">Projected total</span>
                            <p className="text-orange-400 font-medium">GHS {prediction.projected_total.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
