'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

interface Friend {
    id: number;
    name: string;
    avatar_color: string;
}

interface SplitExpenseModalProps {
    expense: {
        id: number;
        amount: number;
        description: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export default function SplitExpenseModal({ expense, onClose, onSuccess }: SplitExpenseModalProps) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<number | null>(null);
    const [splitAmount, setSplitAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await fetch(`${API_URL}/api/splits/friends`);
                if (response.ok) {
                    setFriends(await response.json());
                }
            } catch (err) {
                console.error('Error fetching friends:', err);
            }
        };
        fetchFriends();
    }, []);

    const handleSplitEvenly = () => {
        setSplitAmount((expense.amount / 2).toFixed(2));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFriend || !splitAmount) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/api/splits/expenses/${expense.id}/split`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        splits: [{ friend_id: selectedFriend, amount: parseFloat(splitAmount) }]
                    })
                }
            );

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                setError(data.detail || 'Failed to split expense');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        💸 Split Expense
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Expense Info */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Splitting</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{expense.description}</p>
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        GH₵{expense.amount.toFixed(2)}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Friend Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Split with
                        </label>
                        {friends.length === 0 ? (
                            <div className="text-center py-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No friends added yet.
                                </p>
                                <a
                                    href="/splits"
                                    className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline"
                                >
                                    Add friends →
                                </a>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {friends.map((friend) => (
                                    <button
                                        key={friend.id}
                                        type="button"
                                        onClick={() => setSelectedFriend(friend.id)}
                                        className={`p-3 rounded-lg border transition-all text-center ${selectedFriend === friend.id
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold text-sm"
                                            style={{ backgroundColor: friend.avatar_color }}
                                        >
                                            {getInitials(friend.name)}
                                        </div>
                                        <p className="text-xs text-gray-900 dark:text-white truncate">
                                            {friend.name}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            They owe (GH₵)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={expense.amount}
                                value={splitAmount}
                                onChange={(e) => setSplitAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={handleSplitEvenly}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                            >
                                50/50
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedFriend || !splitAmount || friends.length === 0}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Splitting...' : 'Split'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
