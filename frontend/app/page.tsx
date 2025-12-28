'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import AlertsDropdown from '@/components/AlertsDropdown';
import SafeToSpendCard from '@/components/SafeToSpendCard';
import WeeklySummaryCard from '@/components/WeeklySummaryCard';
import { Plus, X, Zap, ClipboardList, Shield } from 'lucide-react';

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleExpenseAdded = () => {
    setShowForm(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AppLayout
      title="Dashboard"
      actions={
        <div className="flex items-center gap-2">
          <AlertsDropdown />
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-md transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Expense'}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Add Expense Form */}
          {showForm && (
            <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
              <h2 className="text-sm font-medium text-white mb-4">New Expense</h2>
              <ExpenseForm
                onSuccess={handleExpenseAdded}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* Summary Cards */}
          <SafeToSpendCard />
          <WeeklySummaryCard />

          {/* Quick Stats */}
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
            <h2 className="text-sm font-medium text-white mb-4">Features</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#0f0f0f] rounded-md border border-[#262626]">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-white">AI Categorization</p>
                  <p className="text-xs text-[#52525b]">Smart regex + AI hybrid</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0f0f0f] rounded-md border border-[#262626]">
                <ClipboardList className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-white">Audit Trail</p>
                  <p className="text-xs text-[#52525b]">Every decision logged</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0f0f0f] rounded-md border border-[#262626]">
                <Shield className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-white">Secure</p>
                  <p className="text-xs text-[#52525b]">SQL injection protected</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Expense List */}
        <div className="lg:col-span-2">
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white">Recent Expenses</h2>
              <span className="text-xs text-[#52525b]">GHS</span>
            </div>
            <ExpenseList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
