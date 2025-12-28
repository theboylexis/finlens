// API Configuration
const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL;
console.log('DEBUG: NEXT_PUBLIC_API_URL=', ENV_API_URL);

let apiUrl = ENV_API_URL || 'http://localhost:8000';
// Ensure protocol is present
if (!apiUrl.startsWith('http')) {
  apiUrl = `https://${apiUrl}`;
}
// Remove trailing slash
apiUrl = apiUrl.replace(/\/$/, '');

export const API_URL = apiUrl;

console.log('DEBUG: Final computed API_URL=', API_URL);

// Type Definitions
export interface Category {
  id: number;
  name: string;
  icon: string;
  color?: string;
}

export interface CategorySuggestion {
  category: string;
  confidence: number;
  method: 'regex' | 'ai' | 'manual';
}

export interface ExpenseCreate {
  amount: number;
  description: string;
  date: string;
  payment_method?: string;
  category?: string;
}

export interface Expense extends ExpenseCreate {
  id: number;
  user_id: number;
  created_at: string;
}

export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${path}`;

  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
}

// Category API Functions
export async function fetchCategories(): Promise<Category[]> {
  const response = await apiFetch('/api/categories/');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}

export async function suggestCategory(description: string): Promise<CategorySuggestion> {
  const response = await apiFetch(`/api/expenses/suggest-category?description=${encodeURIComponent(description)}`);
  if (!response.ok) {
    throw new Error('Failed to suggest category');
  }
  return response.json();
}

// Expense API Functions
export async function createExpense(expense: ExpenseCreate): Promise<Expense> {
  const response = await apiFetch('/api/expenses/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  });
  if (!response.ok) {
    throw new Error('Failed to create expense');
  }
  return response.json();
}

export async function fetchExpenses(): Promise<Expense[]> {
  const response = await apiFetch('/api/expenses/');
  if (!response.ok) {
    throw new Error('Failed to fetch expenses');
  }
  return response.json();
}

export async function deleteExpense(id: number): Promise<void> {
  const response = await apiFetch(`/api/expenses/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete expense');
  }
}

// Safe to Spend API
export interface SafeToSpend {
  safe_to_spend_today: number;
  total_budget: number;
  spent_this_month: number;
  goals_reserved: number;
  remaining_budget: number;
  days_remaining: number;
  status: 'healthy' | 'caution' | 'danger' | 'no_budget';
}

export async function getSafeToSpend(): Promise<SafeToSpend> {
  const response = await apiFetch('/api/analytics/safe-to-spend');
  if (!response.ok) {
    throw new Error('Failed to fetch safe to spend');
  }
  return response.json();
}

// Subscriptions API
export interface Subscription {
  id: number;
  name: string;
  amount: number;
  billing_cycle: 'weekly' | 'monthly' | 'yearly';
  next_renewal: string;
  category: string | null;
  is_active: boolean;
  reminder_days: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  days_until_renewal: number | null;
  monthly_cost: number;
}

export interface SubscriptionCreate {
  name: string;
  amount: number;
  billing_cycle: 'weekly' | 'monthly' | 'yearly';
  next_renewal: string;
  category?: string;
  reminder_days?: number;
  notes?: string;
}

export interface SubscriptionSummary {
  total_monthly_cost: number;
  total_yearly_cost: number;
  subscription_count: number;
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const response = await apiFetch('/api/subscriptions/');
  if (!response.ok) {
    throw new Error('Failed to fetch subscriptions');
  }
  return response.json();
}

export async function getSubscriptionSummary(): Promise<SubscriptionSummary> {
  const response = await apiFetch('/api/subscriptions/summary');
  if (!response.ok) {
    throw new Error('Failed to fetch subscription summary');
  }
  return response.json();
}

export async function getUpcomingRenewals(days: number = 7): Promise<Subscription[]> {
  const response = await apiFetch(`/api/subscriptions/upcoming?days=${days}`);
  if (!response.ok) {
    throw new Error('Failed to fetch upcoming renewals');
  }
  return response.json();
}

export async function createSubscription(subscription: SubscriptionCreate): Promise<Subscription> {
  const response = await apiFetch('/api/subscriptions/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
  if (!response.ok) {
    throw new Error('Failed to create subscription');
  }
  return response.json();
}

export async function deleteSubscription(id: number): Promise<void> {
  const response = await apiFetch(`/api/subscriptions/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete subscription');
  }
}

// Weekly Summary API
export interface WeeklySummary {
  this_week_total: number;
  this_week_count: number;
  last_week_total: number;
  change_percent: number;
  top_category: string | null;
  top_category_amount: number;
  week_start: string;
  week_end: string;
  days_into_week: number;
}

export async function getWeeklySummary(): Promise<WeeklySummary> {
  const response = await apiFetch('/api/analytics/weekly-summary');
  if (!response.ok) {
    throw new Error('Failed to fetch weekly summary');
  }
  return response.json();
}
// Budget API
export interface Budget {
  id: number;
  category: string;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
}

export async function fetchBudgets(): Promise<Budget[]> {
  const response = await apiFetch('/api/budgets/');
  if (!response.ok) {
    throw new Error('Failed to fetch budgets');
  }
  return response.json();
}

export async function createBudget(category: string, monthlyLimit: number): Promise<Budget> {
  const response = await apiFetch('/api/budgets/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, monthly_limit: monthlyLimit }),
  });
  if (!response.ok) {
    throw new Error('Failed to create budget');
  }
  return response.json();
}

export async function deleteBudget(category: string): Promise<void> {
  const response = await apiFetch(`/api/budgets/${encodeURIComponent(category)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete budget');
  }
}

