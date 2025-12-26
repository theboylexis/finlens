'use client';

import { useEffect, useState } from 'react';
import { getAuthHeaders, API_URL } from '@/lib/api';

interface AnalyticsSummaryData {
    total_expenses: number;
    expense_count: number;
    average_expense: number;
    top_category: string;
    top_category_amount: number;
}

export default function AnalyticsSummary() {
    const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/analytics/summary`, {
                    headers: getAuthHeaders()
                });
                setSummary(await response.json());
            } catch (error) {
                console.error('Failed to fetch summary:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-4 bg-[#171717] border border-[#262626] rounded-lg animate-pulse">
                        <div className="h-3 bg-[#262626] rounded w-16 mb-2"></div>
                        <div className="h-6 bg-[#262626] rounded w-24"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!summary) {
        return <div className="text-sm text-[#52525b]">No data available</div>;
    }

    const stats = [
        { label: 'Total Spent', value: `GH₵${summary.total_expenses.toFixed(2)}`, color: 'text-emerald-400' },
        { label: 'Transactions', value: summary.expense_count.toString(), color: 'text-white' },
        { label: 'Average', value: `GH₵${summary.average_expense.toFixed(2)}`, color: 'text-cyan-400' },
        { label: 'Top Category', value: summary.top_category, color: 'text-white', sub: `GH₵${summary.top_category_amount.toFixed(2)}` },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <div key={stat.label} className="p-4 bg-[#171717] border border-[#262626] rounded-lg">
                    <p className="text-xs text-[#52525b] uppercase tracking-wide mb-1">{stat.label}</p>
                    <p className={`text-lg font-semibold ${stat.color} truncate`}>{stat.value}</p>
                    {stat.sub && <p className="text-xs text-emerald-400 mt-0.5">{stat.sub}</p>}
                </div>
            ))}
        </div>
    );
}
