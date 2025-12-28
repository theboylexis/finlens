'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_URL } from './api';

interface User {
    id: number;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    getAuthHeaders: () => HeadersInit;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to fetch with retry for cold starts
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries: number = 2,
    initialDelay: number = 1000
): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            lastError = error as Error;
            
            // Don't retry if it's not a network/timeout error
            if (lastError.name !== 'AbortError' && lastError.name !== 'TypeError') {
                throw lastError;
            }
            
            // Don't wait after the last attempt
            if (attempt < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing token on mount
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await fetchWithRetry(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setToken(data.access_token);
                setUser(data.user);
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, error: data.detail || 'Login failed' };
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return { success: false, error: 'Request timed out. The server may be starting up, please try again.' };
            }
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    const signup = async (email: string, password: string, name: string) => {
        try {
            const response = await fetchWithRetry(`${API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            const data = await response.json();

            if (response.ok) {
                setToken(data.access_token);
                setUser(data.user);
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, error: data.detail || 'Signup failed' };
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return { success: false, error: 'Request timed out. The server may be starting up, please try again.' };
            }
            return { success: false, error: 'Network error. Please try again.' };
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const getAuthHeaders = (): HeadersInit => {
        const savedToken = token || localStorage.getItem('token');
        if (savedToken) {
            return { Authorization: `Bearer ${savedToken}` };
        }
        return {};
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, getAuthHeaders }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
