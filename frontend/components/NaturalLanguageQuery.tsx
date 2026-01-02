'use client';

import { useState } from 'react';
import { Send, MessageCircle, Bot } from 'lucide-react';
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

const EXAMPLE_QUERIES = [
    "How much did I spend on food last 30 days?",
    "Show me my top 5 highest expenses this month",
    "What's my total spending this week?",
    "Am I over budget in any category?",
];

export default function NaturalLanguageQuery() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<QueryResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            // Add timeout of 30 seconds for longer AI responses
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const res = await fetch(`${API_URL}/api/queries/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ query }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to process query');
            }
            setResponse(await res.json());
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                setError('Request timed out. Please try a simpler question.');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to process query. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Query Input */}
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., How much did I spend on food last month?"
                            className="w-full pl-10 pr-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black text-sm font-medium rounded-md transition-colors"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Ask
                    </button>
                </div>

                {/* Examples */}
                <div className="flex flex-wrap gap-2">
                    {EXAMPLE_QUERIES.map((example, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setQuery(example)}
                            className="px-2 py-1 text-xs bg-[#262626] hover:bg-[#333] text-[#a1a1aa] rounded transition-colors"
                        >
                            {example}
                        </button>
                    ))}
                </div>
            </form>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                    <p className="text-xs text-red-400">{error}</p>
                </div>
            )}

            {/* Response */}
            {response && (
                <div className="space-y-3">
                    {/* Answer */}
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                        <div className="flex items-start gap-2">
                            <Bot className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-emerald-400 whitespace-pre-wrap break-words">
                                {response.explanation}
                            </div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 bg-[#0f0f0f] border border-[#262626] rounded-md">
                            <p className="text-xs text-[#52525b]">Template</p>
                            <p className="text-xs text-white truncate">{response.sql_template_used}</p>
                        </div>
                        <div className="p-3 bg-[#0f0f0f] border border-[#262626] rounded-md">
                            <p className="text-xs text-[#52525b]">Results</p>
                            <p className="text-xs text-white">{response.data.count}</p>
                        </div>
                        <div className="p-3 bg-[#0f0f0f] border border-[#262626] rounded-md">
                            <p className="text-xs text-[#52525b]">Confidence</p>
                            <p className="text-xs text-white">{(response.confidence * 100).toFixed(0)}%</p>
                        </div>
                    </div>

                    {/* Results Table */}
                    {response.data.results.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-[#0f0f0f]">
                                    <tr>
                                        {Object.keys(response.data.results[0]).map((key) => (
                                            <th key={key} className="px-3 py-2 text-left text-[#52525b] font-medium">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#262626]">
                                    {response.data.results.slice(0, 10).map((row, i) => (
                                        <tr key={i}>
                                            {Object.values(row).map((value: unknown, j) => (
                                                <td key={j} className="px-3 py-2 text-white">
                                                    {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
