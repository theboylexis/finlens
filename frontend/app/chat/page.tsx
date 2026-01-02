'use client';

import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Send, Bot, User, Trash2, Sparkles } from 'lucide-react';
import { API_URL, getAuthHeaders } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    confidence?: number;
    template?: string;
}

const SUGGESTED_PROMPTS = [
    "Create a budget plan for me based on my income",
    "How can I reduce my spending?",
    "What are my top expense categories?",
    "Tips for saving money as a student",
    "Am I on track with my savings goals?",
    "Analyze my spending patterns",
];

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e?: React.FormEvent, promptText?: string) => {
        e?.preventDefault();
        const query = promptText || input.trim();
        if (!query || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

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

            const data = await res.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.explanation,
                timestamp: new Date(),
                confidence: data.confidence,
                template: data.sql_template_used,
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: err instanceof Error && err.name === 'AbortError'
                    ? 'Request timed out. Please try a shorter question or try again.'
                    : `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}`,
                timestamp: new Date(),
                confidence: 0,
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <AppLayout
            title="AI Financial Advisor"
            actions={
                messages.length > 0 && (
                    <button
                        onClick={clearChat}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[#52525b] hover:text-white text-sm transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear Chat
                    </button>
                )
            }
        >
            <div className="flex flex-col min-h-0 flex-1 w-full max-w-4xl mx-auto">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-1">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center text-center py-8 md:py-12">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4">
                                <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-white" />
                            </div>
                            <h2 className="text-lg md:text-xl font-semibold text-white mb-2">FinLens AI Advisor</h2>
                            <p className="text-xs md:text-sm text-[#71717a] mb-6 max-w-md px-2">
                                Ask me anything about your finances. I can create budget plans, analyze spending,
                                give savings tips, and answer questions about your financial data.
                            </p>

                            {/* Suggested Prompts - Stack on mobile */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
                                {SUGGESTED_PROMPTS.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSubmit(undefined, prompt)}
                                        className="p-3 text-left text-xs md:text-sm bg-[#171717] hover:bg-[#1f1f1f] border border-[#262626] rounded-lg text-[#a1a1aa] hover:text-white transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2 md:py-3 ${message.role === 'user'
                                            ? 'bg-emerald-500/20 text-emerald-100 rounded-br-md'
                                            : 'bg-[#171717] border border-[#262626] text-white rounded-bl-md'
                                            }`}
                                    >
                                        {message.role === 'assistant' ? (
                                            <div className="prose prose-invert prose-sm max-w-none">
                                                <ReactMarkdown
                                                    components={{
                                                        table: ({ children }) => (
                                                            <div className="overflow-x-auto my-3">
                                                                <table className="w-full text-sm border-collapse">
                                                                    {children}
                                                                </table>
                                                            </div>
                                                        ),
                                                        thead: ({ children }) => (
                                                            <thead className="bg-[#262626]">{children}</thead>
                                                        ),
                                                        th: ({ children }) => (
                                                            <th className="px-3 py-2 text-left text-[#a1a1aa] font-medium border-b border-[#333]">
                                                                {children}
                                                            </th>
                                                        ),
                                                        td: ({ children }) => (
                                                            <td className="px-3 py-2 border-b border-[#262626]">
                                                                {children}
                                                            </td>
                                                        ),
                                                        ul: ({ children }) => (
                                                            <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
                                                        ),
                                                        ol: ({ children }) => (
                                                            <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
                                                        ),
                                                        p: ({ children }) => (
                                                            <p className="mb-2 last:mb-0">{children}</p>
                                                        ),
                                                        strong: ({ children }) => (
                                                            <strong className="text-emerald-400 font-semibold">{children}</strong>
                                                        ),
                                                        h3: ({ children }) => (
                                                            <h3 className="text-base font-semibold text-white mt-4 mb-2">{children}</h3>
                                                        ),
                                                        h4: ({ children }) => (
                                                            <h4 className="text-sm font-semibold text-white mt-3 mb-1">{children}</h4>
                                                        ),
                                                    }}
                                                >
                                                    {message.content}
                                                </ReactMarkdown>
                                                {message.confidence !== undefined && (
                                                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#262626] text-xs text-[#52525b]">
                                                        <span>{message.template}</span>
                                                        <span className="text-emerald-500">
                                                            {(message.confidence * 100).toFixed(0)}% confident
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm">{message.content}</p>
                                        )}
                                    </div>

                                    {message.role === 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-[#a1a1aa]" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-[#171717] border border-[#262626] rounded-2xl rounded-bl-md px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="border-t border-[#262626] pt-3 md:pt-4">
                    <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about finances..."
                            className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-[#171717] border border-[#262626] rounded-xl text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center gap-1 md:gap-2"
                        >
                            <Send className="w-4 h-4" />
                            <span className="hidden md:inline">Send</span>
                        </button>
                    </form>
                    <p className="text-[10px] md:text-xs text-[#52525b] text-center mt-2">
                        FinLens AI uses your financial data to provide personalized advice.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
