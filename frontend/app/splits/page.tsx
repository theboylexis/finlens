'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import ConfirmModal from '@/components/ConfirmModal';
import { UserPlus, Sparkles, X, Trash2 } from 'lucide-react';
import { API_URL, getAuthHeaders } from '@/lib/api';

interface Friend {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_color: string;
    created_at: string;
}

interface BalanceSummary {
    friend_id: number;
    friend_name: string;
    friend_email: string | null;
    avatar_color: string;
    total_owed: number;
    unsettled_count: number;
}

interface BalancesData {
    total_owed_to_you: number;
    balances: BalanceSummary[];
}

const AVATAR_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'
];

export default function SplitBillsPage() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [balances, setBalances] = useState<BalancesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [newFriend, setNewFriend] = useState({ name: '', email: '', phone: '' });
    const [addingFriend, setAddingFriend] = useState(false);
    const [deleteFriendId, setDeleteFriendId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [friendsRes, balancesRes] = await Promise.all([
                fetch(`${API_URL}/api/splits/friends`, { headers: getAuthHeaders() }),
                fetch(`${API_URL}/api/splits/balances`, { headers: getAuthHeaders() })
            ]);
            if (friendsRes.ok) setFriends(await friendsRes.json());
            if (balancesRes.ok) setBalances(await balancesRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAddFriend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFriend.name.trim()) return;
        setAddingFriend(true);
        try {
            const response = await fetch(`${API_URL}/api/splits/friends`, {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newFriend.name.trim(),
                    email: newFriend.email.trim() || null,
                    phone: newFriend.phone.trim() || null,
                    avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
                })
            });
            if (response.ok) {
                setNewFriend({ name: '', email: '', phone: '' });
                setShowAddFriend(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error adding friend:', error);
        } finally {
            setAddingFriend(false);
        }
    };

    const handleDeleteFriend = async () => {
        if (!deleteFriendId) return;
        setIsDeleting(true);
        try {
            await fetch(`${API_URL}/api/splits/friends/${deleteFriendId}`, { method: 'DELETE', headers: getAuthHeaders() });
            setDeleteFriendId(null);
            fetchData();
        } catch (error) {
            console.error('Error deleting friend:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSettleAll = async (friendId: number) => {
        await fetch(`${API_URL}/api/splits/friends/${friendId}/settle-all`, { method: 'PATCH', headers: getAuthHeaders() });
        fetchData();
    };

    const formatCurrency = (amount: number) => `GH₵${amount.toFixed(2)}`;
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <AppLayout
            title="Split Bills"
            actions={
                <button
                    onClick={() => setShowAddFriend(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-md transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Friend
                </button>
            }
        >
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Balances */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-medium text-white">Outstanding Balances</h2>
                                {balances && balances.total_owed_to_you > 0 && (
                                    <div className="text-right">
                                        <span className="text-xs text-[#52525b]">Total owed</span>
                                        <p className="text-base font-semibold text-emerald-400">{formatCurrency(balances.total_owed_to_you)}</p>
                                    </div>
                                )}
                            </div>
                            {!balances || balances.balances.length === 0 ? (
                                <div className="text-center py-8">
                                    <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                                    <p className="text-sm text-[#52525b]">All settled up!</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {balances.balances.map((b) => (
                                        <div key={b.friend_id} className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-[#262626] rounded-md">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: b.avatar_color }}>
                                                    {getInitials(b.friend_name)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{b.friend_name}</p>
                                                    <p className="text-xs text-[#52525b]">{b.unsettled_count} unsettled</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-emerald-400">{formatCurrency(b.total_owed)}</span>
                                                <button onClick={() => handleSettleAll(b.friend_id)} className="px-2 py-1 text-xs bg-[#262626] hover:bg-[#333] text-white rounded transition-colors">
                                                    Settle
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Friends */}
                    <div>
                        <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                            <h2 className="text-sm font-medium text-white mb-4">Friends ({friends.length})</h2>
                            {friends.length === 0 ? (
                                <p className="text-sm text-[#52525b] text-center py-4">Add friends to split bills</p>
                            ) : (
                                <div className="space-y-2">
                                    {friends.map((f) => (
                                        <div key={f.id} className="flex items-center justify-between p-2 bg-[#0f0f0f] border border-[#262626] rounded-md">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: f.avatar_color }}>
                                                    {getInitials(f.name)}
                                                </div>
                                                <span className="text-sm text-white">{f.name}</span>
                                            </div>
                                            <button onClick={() => setDeleteFriendId(f.id)} className="p-1 text-[#52525b] hover:text-red-400 transition-colors" title="Delete friend">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add Friend Modal */}
            {showAddFriend && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="bg-[#171717] border border-[#262626] rounded-lg w-full max-w-sm p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-medium text-white">Add Friend</h2>
                            <button onClick={() => setShowAddFriend(false)} className="p-1 text-[#52525b] hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleAddFriend} className="space-y-3">
                            <input type="text" value={newFriend.name} onChange={(e) => setNewFriend({ ...newFriend, name: e.target.value })} placeholder="Name" required className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500" />
                            <input type="email" value={newFriend.email} onChange={(e) => setNewFriend({ ...newFriend, email: e.target.value })} placeholder="Email (optional)" className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500" />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowAddFriend(false)} className="flex-1 px-3 py-2 border border-[#262626] text-sm text-[#a1a1aa] rounded-md hover:bg-[#262626]">Cancel</button>
                                <button type="submit" disabled={addingFriend} className="flex-1 px-3 py-2 bg-emerald-500 text-black text-sm font-medium rounded-md disabled:opacity-50">{addingFriend ? '...' : 'Add'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteFriendId}
                onClose={() => setDeleteFriendId(null)}
                onConfirm={handleDeleteFriend}
                title="Delete Friend"
                message="Are you sure you want to delete this friend? All split bill records with them will be removed."
                isLoading={isDeleting}
                confirmText="Delete"
                type="danger"
            />
        </AppLayout>
    );
}
