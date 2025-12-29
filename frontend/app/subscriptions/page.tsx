'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import ConfirmModal from '@/components/ConfirmModal';
import {
    getSubscriptions,
    getSubscriptionSummary,
    createSubscription,
    deleteSubscription,
    Subscription,
    SubscriptionSummary,
    SubscriptionCreate
} from '@/lib/api';
import { Plus, X, Calendar, Trash2, CreditCard, AlertCircle } from 'lucide-react';

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState<SubscriptionCreate>({
        name: '',
        amount: 0,
        billing_cycle: 'monthly',
        next_renewal: new Date().toISOString().split('T')[0],
        category: '',
        reminder_days: 3,
        notes: ''
    });
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = async () => {
        try {
            const [subs, sum] = await Promise.all([
                getSubscriptions(),
                getSubscriptionSummary()
            ]);
            setSubscriptions(subs);
            setSummary(sum);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createSubscription(formData);
            setShowAddModal(false);
            setFormData({
                name: '',
                amount: 0,
                billing_cycle: 'monthly',
                next_renewal: new Date().toISOString().split('T')[0],
                category: '',
                reminder_days: 3,
                notes: ''
            });
            fetchData();
        } catch (error) {
            console.error('Failed to create subscription:', error);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await deleteSubscription(deleteId);
            setDeleteId(null);
            fetchData();
        } catch (error) {
            console.error('Failed to delete subscription:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const getBillingLabel = (cycle: string) => {
        switch (cycle) {
            case 'weekly': return '/week';
            case 'monthly': return '/month';
            case 'yearly': return '/year';
            default: return '';
        }
    };

    const getRenewalStatus = (daysUntil: number | null) => {
        if (daysUntil === null) return { color: 'text-gray-400', label: 'Unknown' };
        if (daysUntil <= 0) return { color: 'text-red-400', label: 'Due today!' };
        if (daysUntil <= 3) return { color: 'text-amber-400', label: `${daysUntil} days` };
        if (daysUntil <= 7) return { color: 'text-yellow-400', label: `${daysUntil} days` };
        return { color: 'text-emerald-400', label: `${daysUntil} days` };
    };

    if (loading) {
        return (
            <AppLayout title="Subscriptions">
                <div className="animate-pulse space-y-4">
                    <div className="h-24 bg-[#171717] rounded-lg"></div>
                    <div className="h-64 bg-[#171717] rounded-lg"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            title="Subscriptions"
            actions={
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-md transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Subscription
                </button>
            }
        >
            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                        <p className="text-xs text-[#52525b] mb-1">Monthly Cost</p>
                        <p className="text-2xl font-bold text-white">GHS {summary.total_monthly_cost.toFixed(2)}</p>
                    </div>
                    <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                        <p className="text-xs text-[#52525b] mb-1">Yearly Cost</p>
                        <p className="text-2xl font-bold text-white">GHS {summary.total_yearly_cost.toFixed(2)}</p>
                    </div>
                    <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                        <p className="text-xs text-[#52525b] mb-1">Active Subscriptions</p>
                        <p className="text-2xl font-bold text-white">{summary.subscription_count}</p>
                    </div>
                </div>
            )}

            {/* Subscriptions List */}
            <div className="bg-[#171717] border border-[#262626] rounded-lg">
                <div className="p-4 border-b border-[#262626]">
                    <h2 className="text-sm font-medium text-white">Your Subscriptions</h2>
                </div>

                {subscriptions.length === 0 ? (
                    <div className="p-8 text-center">
                        <CreditCard className="w-12 h-12 text-[#52525b] mx-auto mb-3" />
                        <p className="text-[#a1a1aa] mb-2">No subscriptions yet</p>
                        <p className="text-xs text-[#52525b]">Add your recurring subscriptions to track them</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#262626]">
                        {subscriptions.map((sub) => {
                            const renewalStatus = getRenewalStatus(sub.days_until_renewal);
                            return (
                                <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-medium text-white">{sub.name}</h3>
                                            {sub.category && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#262626] text-[#a1a1aa]">
                                                    {sub.category}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-[#52525b]">
                                            <span className="text-emerald-400 font-medium">
                                                GHS {sub.amount.toFixed(2)}{getBillingLabel(sub.billing_cycle)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span className={renewalStatus.color}>
                                                    Renews in {renewalStatus.label}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-[#52525b]">
                                            ~GHS {sub.monthly_cost.toFixed(2)}/mo
                                        </span>
                                        <button
                                            onClick={() => setDeleteId(sub.id)}
                                            className="p-2 text-[#52525b] hover:text-red-400 transition-colors"
                                            title="Delete subscription"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Subscription Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#171717] border border-[#262626] rounded-lg w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b border-[#262626]">
                            <h2 className="text-sm font-medium text-white">Add Subscription</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-[#52525b] hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs text-[#a1a1aa] mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Spotify, Netflix, ChatGPT"
                                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-white text-sm placeholder-[#52525b] focus:outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-[#a1a1aa] mb-1">Amount (GHS)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={formData.amount || ''}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-white text-sm focus:outline-none focus:border-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-[#a1a1aa] mb-1">Billing Cycle</label>
                                    <select
                                        value={formData.billing_cycle}
                                        onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-white text-sm focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-[#a1a1aa] mb-1">Next Renewal Date</label>
                                <input
                                    type="date"
                                    value={formData.next_renewal}
                                    onChange={(e) => setFormData({ ...formData, next_renewal: e.target.value })}
                                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-white text-sm focus:outline-none focus:border-emerald-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#a1a1aa] mb-1">Category (optional)</label>
                                <input
                                    type="text"
                                    value={formData.category || ''}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g., Entertainment, Study Tools"
                                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-white text-sm placeholder-[#52525b] focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 bg-[#262626] text-white text-sm rounded-md hover:bg-[#333] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-emerald-500 text-black text-sm font-medium rounded-md hover:bg-emerald-600 transition-colors"
                                >
                                    Add Subscription
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Subscription"
                message="Are you sure you want to delete this subscription? This action cannot be undone."
                isLoading={isDeleting}
                confirmText="Delete"
                type="danger"
            />
        </AppLayout>
    );
}
