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
  const response = await apiFetch(`/api/expenses/suggest?description=${encodeURIComponent(description)}`);
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
