'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, X, Send, Sparkles, MessageCircle } from 'lucide-react';
import { getAuthHeaders, API_URL } from '@/lib/api';

interface QueryResponse {
    query: string;
    intent: string;
    data: {
        results: Record<string, unknown>[];
        count: number;
    };
    explanation: string;
    sql_template_used: string;
    confidence: number;
}

// Context-aware prompts for each page
const PAGE_PROMPTS: Record<string, string[]> = {
    '/': [  // Dashboard
        "Am I over budget?",
        "Total spent this week?",
        "My top expenses",
    ],
    '/expenses': [
        "What did I spend most on?",
        "Total food spending?",
        "Biggest expense this month?",
    ],
    '/goals': [
        "How close to my goals?",
        "Total saved this month?",
        "Am I on track?",
    ],
    '/budgets': [
        "Which budgets are low?",
        "Am I over budget?",
        "Budget breakdown",
    ],
    '/income': [
        "Total income this month?",
        "Income vs expenses?",
        "How much can I save?",
    ],
    '/subscriptions': [
        "Monthly subscriptions total?",
        "Upcoming renewals?",
        "Annual subscription cost?",
    ],
    '/splits': [
        "Who owes me money?",
        "Total owed to friends?",
        "Pending settlements?",
    ],
};

const DEFAULT_PROMPTS = ["Am I over budget?", "Total spent this week?", "Top 5 expenses"];

export default function FloatingAIChat() {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<QueryResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pathname = usePathname();

    // Wait for client-side hydration to complete
    useEffect(() => {
        setMounted(true);
    }, []);

    // Get context-aware prompts based on current page
    const quickPrompts = useMemo(() => {
        return PAGE_PROMPTS[pathname] || DEFAULT_PROMPTS;
    }, [pathname]);

    // Hide on Analytics page (it has its own embedded AI query)
    const isAnalyticsPage = pathname === '/analytics';

    // Don't render until mounted (prevents hydration mismatch)
    // Also don't render on analytics page
    if (!mounted || isAnalyticsPage) return null;

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await fetch(`${API_URL}/api/queries/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ query }),
            });
            if (!res.ok) throw new Error('Failed to process query');
            const data = await res.json();
            setResponse(data);
        } catch {
            setError('Failed to process query. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickPrompt = (prompt: string) => {
        setQuery(prompt);
        // Auto-submit after setting
        setTimeout(() => {
            const form = document.getElementById('floating-ai-form') as HTMLFormElement;
            form?.requestSubmit();
        }, 100);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${isOpen
                    ? 'bg-[#262626] hover:bg-[#333]'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                    }`}
                aria-label={isOpen ? 'Close AI Chat' : 'Open AI Chat'}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <Bot className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[360px] bg-[#0a0a0a] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-[#262626] p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">FinLens AI</h3>
                                <p className="text-xs text-[#71717a]">Ask about your finances</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-[400px] overflow-y-auto">
                        {/* Quick Prompts */}
                        {!response && !loading && (
                            <div className="mb-4">
                                <p className="text-xs text-[#71717a] mb-2">Quick questions:</p>
                                <div className="flex flex-wrap gap-2">
                                    {quickPrompts.map((prompt: string, i: number) => (
                                        <button
                                            key={i}
                                            onClick={() => handleQuickPrompt(prompt)}
                                            className="px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#262626] text-[#a1a1aa] rounded-full transition-colors border border-[#262626]"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                                <p className="text-xs text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="flex items-center gap-3 p-4">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                </div>
                                <p className="text-sm text-[#71717a]">Analyzing your finances...</p>
                            </div>
                        )}

                        {/* Response */}
                        {response && (
                            <div className="space-y-3">
                                {/* User Query */}
                                <div className="flex justify-end">
                                    <div className="bg-emerald-500/20 text-emerald-300 text-sm px-4 py-2 rounded-2xl rounded-br-md max-w-[80%]">
                                        {response.query}
                                    </div>
                                </div>

                                {/* AI Response */}
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-[#1a1a1a] border border-[#262626] rounded-2xl rounded-tl-md p-3 max-w-[85%]">
                                        <p className="text-sm text-white leading-relaxed">{response.explanation}</p>
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#262626]">
                                            <span className="text-[10px] text-[#52525b]">
                                                {response.sql_template_used}
                                            </span>
                                            <span className="text-[10px] text-emerald-500">
                                                {(response.confidence * 100).toFixed(0)}% confident
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Ask Another */}
                                <button
                                    onClick={() => {
                                        setResponse(null);
                                        setQuery('');
                                    }}
                                    className="w-full text-center text-xs text-emerald-400 hover:text-emerald-300 py-2"
                                >
                                    Ask another question
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    {!response && (
                        <form id="floating-ai-form" onSubmit={handleSubmit} className="p-4 border-t border-[#262626]">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Ask about spending, budgets..."
                                        className="w-full pl-10 pr-3 py-2.5 bg-[#1a1a1a] border border-[#262626] rounded-xl text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                                        disabled={loading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !query.trim()}
                                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </>
    );
}
