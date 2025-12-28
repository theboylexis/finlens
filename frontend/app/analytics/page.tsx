'use client';

import AppLayout from '@/components/AppLayout';
import AnalyticsSummary from '@/components/AnalyticsSummary';
import SpendingByCategory from '@/components/SpendingByCategory';
import SpendingTrends from '@/components/SpendingTrends';
import SpendingHeatmap from '@/components/SpendingHeatmap';
import NaturalLanguageQuery from '@/components/NaturalLanguageQuery';
import WeeklySpendingChart from '@/components/WeeklySpendingChart';
import BudgetProgressCards from '@/components/BudgetProgressCards';
import { Download } from 'lucide-react';
import { API_URL, getAuthHeaders } from '@/lib/api';

export default function AnalyticsPage() {
    const handleExportCSV = async () => {
        try {
            const response = await fetch(`${API_URL}/api/expenses/`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error('Failed to fetch');
            const expenses = await response.json();
            const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method'];
            const rows = expenses.map((e: { date: string; description: string; category: string; amount: number; payment_method: string }) =>
                [e.date, `"${e.description}"`, e.category, e.amount.toFixed(2), e.payment_method || ''].join(',')
            );
            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finlens-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    return (
        <AppLayout
            title="Analytics"
            actions={
                <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#262626] text-sm text-[#a1a1aa] hover:text-white hover:bg-[#262626] rounded-md transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            }
        >
            <div className="space-y-6">
                {/* Summary */}
                <AnalyticsSummary />

                {/* Budget + Weekly */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                        <h2 className="text-sm font-medium text-white mb-4">Budget Status</h2>
                        <BudgetProgressCards />
                    </div>
                    <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                        <h2 className="text-sm font-medium text-white mb-4">Weekly Spending</h2>
                        <WeeklySpendingChart />
                    </div>
                </div>

                {/* AI Query */}
                <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                    <h2 className="text-sm font-medium text-white mb-4">Ask AI</h2>
                    <NaturalLanguageQuery />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                        <h2 className="text-sm font-medium text-white mb-4">By Category</h2>
                        <SpendingByCategory />
                    </div>
                    <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                        <h2 className="text-sm font-medium text-white mb-4">Trends</h2>
                        <SpendingTrends />
                    </div>
                </div>

                {/* Heatmap */}
                <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
                    <h2 className="text-sm font-medium text-white mb-4">Spending Heatmap</h2>
                    <SpendingHeatmap />
                </div>
            </div>
        </AppLayout>
    );
}
