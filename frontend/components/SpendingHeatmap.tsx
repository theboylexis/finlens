'use client';

import { useEffect, useState } from 'react';
import { getAuthHeaders, API_URL } from '@/lib/api';

interface HeatmapData {
    year: number;
    month: number;
    data: Record<string, number>;
}

export default function SpendingHeatmap() {
    const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/analytics/heatmap`, {
                    headers: getAuthHeaders()
                });
                setHeatmapData(await response.json());
            } catch (error) {
                console.error('Failed to fetch heatmap:', error);
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

    if (!heatmapData) {
        return <p className="text-sm text-[#52525b] text-center py-8">No data available</p>;
    }

    const amounts = Object.values(heatmapData.data);
    const maxAmount = Math.max(...amounts, 1);
    const totalSpent = amounts.reduce((a, b) => a + b, 0);
    const avgSpent = amounts.length > 0 ? totalSpent / amounts.filter(a => a > 0).length : 0;

    const daysInMonth = new Date(heatmapData.year, heatmapData.month, 0).getDate();
    const firstDay = new Date(heatmapData.year, heatmapData.month - 1, 1).getDay();

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = new Array(firstDay).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        weeks.push(currentWeek);
    }

    const getColor = (amount: number) => {
        if (amount === 0) return 'bg-[#1a1a1a]';
        const intensity = amount / maxAmount;
        if (intensity > 0.75) return 'bg-red-500';
        if (intensity > 0.5) return 'bg-orange-500';
        if (intensity > 0.25) return 'bg-emerald-500';
        return 'bg-emerald-700';
    };

    const monthName = new Date(heatmapData.year, heatmapData.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-white">{monthName}</h3>
                    <p className="text-xs text-[#52525b]">Daily spending</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-xs text-[#52525b]">Total</p>
                        <p className="text-sm font-semibold text-emerald-400">GH₵{totalSpent.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-[#52525b]">Avg/Day</p>
                        <p className="text-sm font-semibold text-white">GH₵{(avgSpent || 0).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1">
                {dayLabels.map((label, i) => (
                    <div key={i} className="text-center text-xs text-[#52525b] py-1">{label}</div>
                ))}
            </div>

            {/* Calendar */}
            <div className="space-y-1">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-1">
                        {week.map((day, dayIndex) => {
                            if (day === null) return <div key={dayIndex} className="aspect-square" />;
                            const dateStr = `${heatmapData.year}-${String(heatmapData.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const amount = heatmapData.data[dateStr] || 0;
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;

                            return (
                                <div
                                    key={dayIndex}
                                    className={`aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors cursor-pointer ${getColor(amount)} ${isToday ? 'ring-1 ring-cyan-400' : ''}`}
                                    title={amount > 0 ? `GH₵${amount.toFixed(2)}` : 'No spending'}
                                >
                                    <span className={amount > 0 ? 'text-white' : 'text-[#52525b]'}>{day}</span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 pt-2">
                <span className="text-xs text-[#52525b]">Less</span>
                <div className="flex gap-1">
                    <div className="w-4 h-4 rounded bg-[#1a1a1a]" />
                    <div className="w-4 h-4 rounded bg-emerald-700" />
                    <div className="w-4 h-4 rounded bg-emerald-500" />
                    <div className="w-4 h-4 rounded bg-orange-500" />
                    <div className="w-4 h-4 rounded bg-red-500" />
                </div>
                <span className="text-xs text-[#52525b]">More</span>
            </div>
        </div>
    );
}
