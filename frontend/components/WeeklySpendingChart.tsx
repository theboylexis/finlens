'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { API_URL } from '@/lib/api';

interface WeeklyData {
    week: string;
    amount: number;
    weekLabel: string;
}

export default function WeeklySpendingChart() {
    const [data, setData] = useState<WeeklyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [thisWeek, setThisWeek] = useState(0);
    const [lastWeek, setLastWeek] = useState(0);
    const [change, setChange] = useState(0);

    useEffect(() => {
        const fetchWeeklyData = async () => {
            try {
                const weeks: WeeklyData[] = [];
                const today = new Date();

                for (let i = 7; i >= 0; i--) {
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay() - (i * 7));
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);

                    const response = await fetch(
                        `${API_URL}/api/expenses/?start_date=${weekStart.toISOString().split('T')[0]}&end_date=${weekEnd.toISOString().split('T')[0]}`
                    );

                    if (response.ok) {
                        const expenses = await response.json();
                        const total = expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);
                        const weekNum = Math.ceil(weekStart.getDate() / 7);
                        const monthName = weekStart.toLocaleDateString('en-US', { month: 'short' });
                        weeks.push({ week: `Week ${i === 0 ? 'Current' : i}`, amount: total, weekLabel: `${monthName} W${weekNum}` });
                    }
                }

                setData(weeks);
                const current = weeks[weeks.length - 1]?.amount || 0;
                const previous = weeks[weeks.length - 2]?.amount || 0;
                setThisWeek(current);
                setLastWeek(previous);
                setChange(previous > 0 ? ((current - previous) / previous) * 100 : 0);
            } catch (error) {
                console.error('Error fetching weekly data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchWeeklyData();
    }, []);

    if (loading) {
        return (
            <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-3 bg-[#0f0f0f] border border-[#262626] rounded-md">
                    <p className="text-xs text-[#52525b]">This Week</p>
                    <p className="text-sm font-semibold text-emerald-400">GH₵{thisWeek.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-[#0f0f0f] border border-[#262626] rounded-md">
                    <p className="text-xs text-[#52525b]">Last Week</p>
                    <p className="text-sm font-semibold text-white">GH₵{lastWeek.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-[#0f0f0f] border border-[#262626] rounded-md">
                    <p className="text-xs text-[#52525b]">Change</p>
                    <p className={`text-sm font-semibold ${change > 0 ? 'text-red-400' : change < 0 ? 'text-cyan-400' : 'text-[#52525b]'}`}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis dataKey="weekLabel" stroke="#404040" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#404040" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₵${v}`} />
                        <Tooltip
                            formatter={(value) => [`GH₵${Number(value).toFixed(2)}`, 'Spent']}
                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                        />
                        <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
