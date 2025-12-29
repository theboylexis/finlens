'use client';

import { useState, useEffect } from 'react';
import { API_URL, getAuthHeaders } from '@/lib/api';
import {
    Flame,
    Trophy,
    Shield,
    Target,
    Zap,
    Award,
    LucideIcon
} from 'lucide-react';

// Map icon names from backend to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
    Flame,
    Trophy,
    Shield,
    Target,
    Zap,
    PiggyBank: Trophy, // Fallback since PiggyBank might not exist
    Award,
};

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    is_earned: boolean;
    earned_at?: string;
}

interface StreakInfo {
    current_streak: number;
    longest_streak: number;
    last_activity_date?: string;
    streak_status: string;
}

interface GamificationStats {
    streak: StreakInfo;
    badges: Badge[];
    total_expenses_logged: number;
    goals_completed: number;
    months_under_budget: number;
}

const COLOR_MAP: Record<string, string> = {
    emerald: 'text-emerald-400',
    orange: 'text-orange-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    pink: 'text-pink-400',
};

interface StreakCardProps {
    refreshTrigger?: number;
}

export default function StreakCard({ refreshTrigger = 0 }: StreakCardProps) {
    const [stats, setStats] = useState<GamificationStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${API_URL}/api/gamification/stats`, {
                    headers: getAuthHeaders()
                });
                if (!response.ok) throw new Error('Failed to fetch stats');
                const data: GamificationStats = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch gamification stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [refreshTrigger]);

    if (loading) {
        return (
            <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-[#262626] rounded w-1/2 mb-3"></div>
                <div className="h-16 bg-[#262626] rounded"></div>
            </div>
        );
    }

    if (!stats) return null;

    const { streak, badges } = stats;
    const earnedBadges = badges.filter(b => b.is_earned);
    const unearnedBadges = badges.filter(b => !b.is_earned).slice(0, 2); // Show 2 unearned

    return (
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
            {/* Streak Section */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${streak.current_streak > 0
                            ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20'
                            : 'bg-[#262626]'
                        }`}>
                        <Flame className={`w-6 h-6 ${streak.current_streak > 0 ? 'text-orange-400' : 'text-[#52525b]'
                            }`} />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-white">{streak.current_streak}</span>
                            <span className="text-sm text-[#52525b]">day streak</span>
                        </div>
                        <p className="text-xs text-[#52525b]">
                            {streak.streak_status === 'active' && '🔥 Keep it going!'}
                            {streak.streak_status === 'at_risk' && '⚠️ Log today to keep streak!'}
                            {streak.streak_status === 'broken' && 'Start a new streak today!'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-[#52525b]">Best</p>
                    <p className="text-lg font-semibold text-white">{streak.longest_streak}</p>
                </div>
            </div>

            {/* Badges Section */}
            <div className="border-t border-[#262626] pt-4">
                <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-white">Badges</span>
                    <span className="text-xs text-[#52525b]">({earnedBadges.length}/{badges.length})</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Earned badges */}
                    {earnedBadges.map(badge => {
                        const IconComponent = ICON_MAP[badge.icon] || Trophy;
                        const colorClass = COLOR_MAP[badge.color] || 'text-amber-400';

                        return (
                            <div
                                key={badge.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[#0f0f0f] border border-[#262626] rounded-lg"
                                title={badge.description}
                            >
                                <IconComponent className={`w-4 h-4 ${colorClass}`} />
                                <span className="text-xs font-medium text-white">{badge.name}</span>
                            </div>
                        );
                    })}

                    {/* Unearned badges (greyed out) */}
                    {unearnedBadges.map(badge => {
                        const IconComponent = ICON_MAP[badge.icon] || Trophy;

                        return (
                            <div
                                key={badge.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[#0f0f0f]/50 border border-[#262626]/50 rounded-lg opacity-40"
                                title={`🔒 ${badge.description}`}
                            >
                                <IconComponent className="w-4 h-4 text-[#52525b]" />
                                <span className="text-xs font-medium text-[#52525b]">{badge.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Progress hint */}
            {streak.current_streak > 0 && streak.current_streak < 7 && (
                <div className="mt-4 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-xs text-orange-400">
                        🎯 {7 - streak.current_streak} more days to earn "Week Warrior" badge!
                    </p>
                </div>
            )}
        </div>
    );
}
