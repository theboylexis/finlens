'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getAuthHeaders, API_URL } from '@/lib/api';

interface SpendingTrend {
    date: string;
    total: number;
}

export default function SpendingTrends() {
    const [data, setData] = useState<SpendingTrend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/analytics/trends`, {
                    headers: getAuthHeaders()
                });
                setData(await response.json());
            } catch (error) {
                console.error('Failed to fetch trends:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return <p className="text-sm text-[#52525b] text-center py-8">No data available</p>;
    }

    const chartData = data.map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: item.total,
    }));

    return (
        <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#404040" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#404040" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₵${v}`} />
                    <Tooltip
                        formatter={(value) => [`GH₵${Number(value).toFixed(2)}`, 'Spent']}
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#areaGradient)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
