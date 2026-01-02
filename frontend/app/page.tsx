'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import AlertsDropdown from '@/components/AlertsDropdown';
import SafeToSpendCard from '@/components/SafeToSpendCard';
import WeeklySummaryCard from '@/components/WeeklySummaryCard';
import OnboardingModal from '@/components/OnboardingModal';
import QuickAddButton from '@/components/QuickAddButton';
import NudgeCard from '@/components/NudgeCard';
import StreakCard from '@/components/StreakCard';
import UpcomingRenewalsCard from '@/components/UpcomingRenewalsCard';
import { Plus, X } from 'lucide-react';

import { API_URL, getAuthHeaders } from '@/lib/api';

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user is new (no expenses) - show onboarding for truly new users
    const checkNewUser = async () => {
      const onboardingComplete = localStorage.getItem('finlens_onboarding_complete');

      // If localStorage says complete, skip the API check
      if (onboardingComplete) {
        return;
      }

      try {
        // Check if user has any expenses
        const response = await fetch(`${API_URL}/api/expenses/?limit=1`, {
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const expenses = await response.json();
          // Show onboarding if user has no expenses
          if (expenses.length === 0) {
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        // If API fails, show onboarding anyway for new users
        setShowOnboarding(true);
      }
    };

    checkNewUser();

    // Listen for empty state button click
    const handleOpenForm = () => setShowForm(true);
    window.addEventListener('openExpenseForm', handleOpenForm);
    return () => window.removeEventListener('openExpenseForm', handleOpenForm);
  }, []);

  const handleExpenseAdded = () => {
    setShowForm(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowForm(true); // Open expense form after onboarding
  };

  return (
    <>
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
            <SafeToSpendCard refreshTrigger={refreshTrigger} />
            <WeeklySummaryCard refreshTrigger={refreshTrigger} />

            {/* AI Insights */}
            <NudgeCard refreshTrigger={refreshTrigger} />

            {/* Gamification */}
            <StreakCard refreshTrigger={refreshTrigger} />

            {/* Upcoming Renewals */}
            <UpcomingRenewalsCard refreshTrigger={refreshTrigger} />
          </div>

          {/* Right Column - Expense List */}
          <div className="lg:col-span-2">
            <div className="bg-[#171717] border border-[#262626] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-white">Recent Expenses</h2>
                <span className="text-xs text-[#52525b]">GHS</span>
              </div>
              <ExpenseList
                refreshTrigger={refreshTrigger}
                onDeleteSuccess={handleExpenseAdded}
              />
            </div>
          </div>
        </div>
      </AppLayout>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Quick Add FAB for mobile */}
      <QuickAddButton onClick={() => setShowForm(true)} isHidden={showForm} />
    </>
  );
}
