'use client';

import { useState, useEffect } from 'react';
import { getSubscriptions, Subscription } from '@/lib/api';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UpcomingRenewalsCardProps {
    refreshTrigger?: number;
}

/**
 * Shows upcoming subscription renewals in the next 7 days.
 * Replaces the static "Features" card on the dashboard with useful data.
 */
export default function UpcomingRenewalsCard({ refreshTrigger = 0 }: UpcomingRenewalsCardProps) {
    const [renewals, setRenewals] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRenewals = async () => {
            try {
                const subs = await getSubscriptions();
                // Filter to subscriptions renewing in next 7 days
                const upcoming = subs
                    .filter(s => s.days_until_renewal !== null && s.days_until_renewal <= 7 && s.days_until_renewal >= 0)
                    .sort((a, b) => (a.days_until_renewal || 0) - (b.days_until_renewal || 0))
                    .slice(0, 3);
                setRenewals(upcoming);
            } catch (error) {
                console.error('Failed to fetch renewals:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRenewals();
    }, [refreshTrigger]);

    const getRenewalColor = (days: number | null) => {
        if (days === null) return 'text-gray-400';
        if (days <= 1) return 'text-red-400';
        if (days <= 3) return 'text-amber-400';
        return 'text-emerald-400';
    };

    if (loading) {
        return (
            <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-[#262626] rounded w-1/2 mb-3"></div>
                <div className="space-y-2">
                    <div className="h-10 bg-[#262626] rounded"></div>
                    <div className="h-10 bg-[#262626] rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
            {/* Contextual header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">
                        {renewals.some(r => r.days_until_renewal !== null && r.days_until_renewal <= 1) ? '⚠️' :
                            renewals.length > 0 ? '📅' : '✨'}
                    </span>
                    <h2 className={`text-sm font-medium ${renewals.some(r => r.days_until_renewal !== null && r.days_until_renewal <= 1) ? 'text-amber-400' : 'text-white'
                        }`}>
                        {renewals.some(r => r.days_until_renewal !== null && r.days_until_renewal <= 1) ? 'Renewals coming up!' :
                            renewals.length > 0 ? 'Upcoming Renewals' : 'All clear!'}
                    </h2>
                </div>
                <Calendar className="w-4 h-4 text-[#52525b]" />
            </div>

            {renewals.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-xs text-emerald-400 mb-1">No renewals in the next 7 days</p>
                    <p className="text-xs text-[#52525b]">You're all set for the week</p>
                    <Link
                        href="/subscriptions"
                        className="inline-flex items-center gap-1 mt-3 text-xs text-[#52525b] hover:text-emerald-400 transition-colors"
                    >
                        Manage subscriptions <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {renewals.map((sub) => (
                        <div
                            key={sub.id}
                            className="flex items-center justify-between p-2 bg-[#0f0f0f] border border-[#262626] rounded-md"
                        >
                            <div>
                                <p className="text-sm font-medium text-white">{sub.name}</p>
                                <p className="text-xs text-[#52525b]">GHS {sub.amount.toFixed(2)}</p>
                            </div>
                            <span className={`text-xs font-medium ${getRenewalColor(sub.days_until_renewal)}`}>
                                {sub.days_until_renewal === 0
                                    ? 'Today'
                                    : sub.days_until_renewal === 1
                                        ? 'Tomorrow'
                                        : `${sub.days_until_renewal} days`
                                }
                            </span>
                        </div>
                    ))}
                    <Link
                        href="/subscriptions"
                        className="flex items-center justify-center gap-1 mt-2 text-xs text-[#52525b] hover:text-white transition-colors"
                    >
                        View all subscriptions <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            )}
        </div>
    );
}
