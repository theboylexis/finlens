'use client';

import { useState, useEffect } from 'react';
import { getAuthHeaders, API_URL } from '@/lib/api';

interface Budget {
    id: number;
    category: string;
    monthly_limit: number;
}

interface Category {
    id: number;
    name: string;
    icon: string;
}

interface BudgetModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function BudgetModal({ onClose, onSuccess }: BudgetModalProps) {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [budgetsRes, categoriesRes] = await Promise.all([
                    fetch(`${API_URL}/api/alerts/budgets`, { headers: getAuthHeaders() }),
                    fetch(`${API_URL}/api/categories/`)
                ]);
                if (budgetsRes.ok) setBudgets(await budgetsRes.json());
                if (categoriesRes.ok) setCategories(await categoriesRes.json());
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        if (!selectedCategory || !amount) return;
        setSaving(true);
        try {
            const response = await fetch(
                `${API_URL}/api/alerts/budgets?category=${encodeURIComponent(selectedCategory)}&monthly_limit=${amount}`,
                { method: 'POST', headers: getAuthHeaders() }
            );
            if (response.ok) {
                const updated = await fetch(`${API_URL}/api/alerts/budgets`, { headers: getAuthHeaders() });
                if (updated.ok) setBudgets(await updated.json());
                setSelectedCategory('');
                setAmount('');
                onSuccess();
            }
        } catch (error) {
            console.error('Error saving budget:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (category: string) => {
        if (!confirm(`Delete budget for ${category}?`)) return;
        try {
            await fetch(`${API_URL}/api/alerts/budgets/${encodeURIComponent(category)}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            setBudgets(budgets.filter(b => b.category !== category));
            onSuccess();
        } catch (error) {
            console.error('Error deleting budget:', error);
        }
    };

    const getCategoryIcon = (categoryName: string) => {
        const cat = categories.find(c => c.name === categoryName);
        return cat?.icon || '📋';
    };

    const categoriesWithoutBudget = categories.filter(
        c => !budgets.find(b => b.category === c.name) && c.name !== 'Other'
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-[#171717] border border-[#262626] rounded-lg w-full max-w-md p-4 max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium text-white">Manage Budgets</h2>
                    <button onClick={onClose} className="text-[#52525b] hover:text-white text-xl">×</button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <>
                        {/* Add New Budget */}
                        <div className="mb-4 p-3 bg-[#0f0f0f] border border-[#262626] rounded-md">
                            <p className="text-xs text-[#a1a1aa] mb-2">Add Budget</p>
                            <div className="flex gap-2">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="flex-1 px-2 py-1.5 bg-[#171717] border border-[#262626] rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="">Select category</option>
                                    {categoriesWithoutBudget.map(c => (
                                        <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Limit"
                                    className="w-24 px-2 py-1.5 bg-[#171717] border border-[#262626] rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !selectedCategory || !amount}
                                    className="px-3 py-1.5 bg-emerald-500 text-black text-xs font-medium rounded disabled:opacity-50"
                                >
                                    {saving ? '...' : 'Add'}
                                </button>
                            </div>
                        </div>

                        {/* Existing Budgets */}
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {budgets.length === 0 ? (
                                <p className="text-sm text-[#52525b] text-center py-4">No budgets set yet</p>
                            ) : (
                                budgets.map(b => (
                                    <div key={b.id} className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-[#262626] rounded-md">
                                        <div className="flex items-center gap-2">
                                            <span>{getCategoryIcon(b.category)}</span>
                                            <span className="text-sm text-white">{b.category}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-emerald-400">GH₵{b.monthly_limit.toFixed(0)}</span>
                                            <button
                                                onClick={() => handleDelete(b.category)}
                                                className="text-xs text-[#52525b] hover:text-red-400"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="mt-4 w-full py-2 border border-[#262626] text-sm text-[#a1a1aa] rounded-md hover:bg-[#1a1a1a]"
                        >
                            Done
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
