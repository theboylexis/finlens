'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import GoalCard from '@/components/GoalCard';
import AddGoalModal from '@/components/AddGoalModal';
import ContributeModal from '@/components/ContributeModal';
import { Plus, PartyPopper, Target, ChevronDown, ChevronRight } from 'lucide-react';
import { API_URL, getAuthHeaders } from '@/lib/api';

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  progress_percentage: number;
  days_remaining: number | null;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [celebratingGoal, setCelebratingGoal] = useState<Goal | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${API_URL}/api/goals/?include_completed=${showCompleted}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [showCompleted]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleGoalAdded = () => {
    setShowAddModal(false);
    fetchGoals();
  };

  const handleContribute = async (goalId: number, amount: number, note: string) => {
    try {
      const response = await fetch(`${API_URL}/api/goals/${goalId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ amount, note: note || null }),
      });

      if (!response.ok) throw new Error('Failed to add contribution');

      const updatedGoal = await response.json();

      if (updatedGoal.is_completed && contributeGoal && !contributeGoal.is_completed) {
        setCelebratingGoal(updatedGoal);
        setTimeout(() => setCelebratingGoal(null), 5000);
      }

      setContributeGoal(null);
      fetchGoals();
    } catch (err) {
      console.error('Error adding contribution:', err);
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    if (!confirm('Delete this goal?')) return;
    try {
      const response = await fetch(`${API_URL}/api/goals/${goalId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to delete goal');
      fetchGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  return (
    <AppLayout
      title="Savings Goals"
      actions={
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      }
    >
      {/* Celebration Overlay */}
      {celebratingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center animate-bounce">
            <PartyPopper className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Goal Achieved!</h2>
            <p className="text-xl text-[#a1a1aa]">{celebratingGoal.name}</p>
            <p className="text-lg text-emerald-400 mt-2">
              GH₵{celebratingGoal.current_amount.toFixed(2)} saved!
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={fetchGoals} className="mt-4 px-3 py-1.5 bg-emerald-500 text-black text-sm rounded-md">
            Retry
          </button>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-[#52525b] mx-auto mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">No savings goals yet</h2>
          <p className="text-sm text-[#52525b] mb-6">Create your first goal to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-black font-medium rounded-md mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[#a1a1aa] mb-4">
                Active ({activeGoals.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onContribute={() => setContributeGoal(goal)}
                    onDelete={() => handleDeleteGoal(goal.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-sm text-[#52525b] hover:text-white transition-colors"
              >
                {showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                Completed ({completedGoals.length})
              </button>
              {showCompleted && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {completedGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onContribute={() => { }}
                      onDelete={() => handleDeleteGoal(goal.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <AddGoalModal onClose={() => setShowAddModal(false)} onSuccess={handleGoalAdded} />
      )}
      {contributeGoal && (
        <ContributeModal goal={contributeGoal} onClose={() => setContributeGoal(null)} onContribute={handleContribute} />
      )}
    </AppLayout>
  );
}
