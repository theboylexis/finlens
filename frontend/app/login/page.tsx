'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Wallet, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const { login, signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = isLogin
                ? await login(email, password)
                : await signup(email, password, name);

            if (result.success) {
                router.push('/');
            } else {
                setError(result.error || 'An error occurred');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/20 rounded-xl mb-3">
                        <Wallet className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h1 className="text-xl font-semibold text-white">FinLens</h1>
                    <p className="text-sm text-[#52525b] mt-1">Smart finance tracking</p>
                </div>

                {/* Form */}
                <div className="bg-[#171717] border border-[#262626] rounded-lg p-6">
                    <h2 className="text-base font-medium text-white mb-4">
                        {isLogin ? 'Sign in' : 'Create account'}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-xs text-[#a1a1aa] mb-1.5">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    required={!isLogin}
                                    className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs text-[#a1a1aa] mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-[#a1a1aa] mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-xs text-[#52525b] hover:text-white transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-[#52525b] mt-6">
                    Protected by AI-powered security
                </p>
            </div>
        </div>
    );
}
