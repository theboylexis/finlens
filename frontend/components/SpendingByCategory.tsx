'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getAuthHeaders, API_URL } from '@/lib/api';

interface SpendingByCategoryData {
    category: string;
    total: number;
    count: number;
    percentage: number;
}

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#f97316'];

export default function SpendingByCategory() {
    const [data, setData] = useState<SpendingByCategoryData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/analytics/by-category`, {
                    headers: getAuthHeaders()
                });
                setData(await response.json());
            } catch (error) {
                console.error('Failed to fetch category data:', error);
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

    const chartData = data.map((item) => ({ name: item.category, value: item.total }));

    return (
        <div className="space-y-4">
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [`GH₵${value.toFixed(2)}`, 'Total']}
                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-1">
                {data.map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between p-2 bg-[#0f0f0f] border border-[#262626] rounded-md">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-xs text-white">{item.category}</span>
                            <span className="text-xs text-[#52525b]">({item.count})</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-medium text-emerald-400">GH₵{item.total.toFixed(2)}</span>
                            <span className="text-xs text-[#52525b] ml-2">{item.percentage.toFixed(0)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
