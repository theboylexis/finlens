import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute w-96 h-96 -top-48 -left-48 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-indigo-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative px-6 py-24 sm:px-12 sm:py-32 lg:px-16">
                    <div className="max-w-5xl mx-auto text-center">
                        {/* Logo */}
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/80 text-sm mb-8">
                            <span className="text-2xl">💰</span>
                            <span>AI-Powered Finance for Students</span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight mb-6">
                            Take Control of Your
                            <span className="block bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                College Finances
                            </span>
                        </h1>

                        <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
                            Track expenses with AI categorization, set savings goals, split bills with roommates,
                            and get smart spending alerts—all in one beautiful app.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/app"
                                className="px-8 py-4 bg-white text-indigo-900 font-bold rounded-xl text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                            >
                                Get Started Free →
                            </Link>
                            <Link
                                href="/app?demo=true"
                                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl text-lg border border-white/20 hover:bg-white/20 transition-all"
                            >
                                View Demo
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 px-6 bg-white dark:bg-gray-900">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            Built for College Students
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Features that actually solve your money problems
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                            <div className="text-5xl mb-4">🤖</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                AI Categorization
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Just add expenses—our hybrid AI automatically categorizes them with confidence scores.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                            <div className="text-5xl mb-4">🎯</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Savings Goals
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Save for spring break, textbooks, or rent. Track progress with celebration animations!
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                            <div className="text-5xl mb-4">🔔</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Spending Alerts
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Get notified when you hit 50%, 80%, or 100% of your budget. Never overspend again.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                            <div className="text-5xl mb-4">💸</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Split Bills
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Track shared expenses with roommates. Know exactly who owes what.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                            <div className="text-5xl mb-4">💬</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Ask Questions
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                "How much did I spend on food this week?" Get instant answers with natural language.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                            <div className="text-5xl mb-4">📊</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Visual Analytics
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Beautiful heatmaps, charts, and trends. Understand your spending patterns at a glance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tech Stack Banner */}
            <div className="py-12 px-6 bg-gray-100 dark:bg-gray-800">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                        Built With Modern Technology
                    </p>
                    <div className="flex flex-wrap justify-center gap-6 text-gray-700 dark:text-gray-300">
                        <span className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">⚡ Next.js 14</span>
                        <span className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">🐍 FastAPI</span>
                        <span className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">🤖 Gemini AI</span>
                        <span className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">🎨 TailwindCSS</span>
                        <span className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">📊 Recharts</span>
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="py-24 px-6 bg-indigo-600 dark:bg-indigo-900">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Master Your Finances?
                    </h2>
                    <p className="text-xl text-indigo-100 mb-8">
                        Join thousands of students taking control of their money.
                    </p>
                    <Link
                        href="/app"
                        className="inline-flex px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                    >
                        Start Tracking Now →
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 px-6 bg-gray-900 text-gray-400">
                <div className="max-w-6xl mx-auto text-center">
                    <p className="text-lg font-semibold text-white mb-2">FinLens AI</p>
                    <p className="text-sm">
                        Portfolio Project • AI-Powered Personal Finance Assistant
                    </p>
                    <p className="text-xs mt-4 text-gray-500">
                        Built with ❤️ for college students who want to be smarter about money
                    </p>
                </div>
            </footer>
        </div>
    );
}
