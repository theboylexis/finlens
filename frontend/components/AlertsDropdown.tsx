'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { API_URL } from '@/lib/api';

interface Alert {
    id: number;
    type: string;
    title: string;
    message: string;
    category: string | null;
    threshold_percent: number | null;
    is_read: boolean;
    created_at: string;
}

interface AlertsSummary {
    unread_count: number;
    alerts: Alert[];
}

export default function AlertsDropdown() {
    const [summary, setSummary] = useState<AlertsSummary | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await fetch(`${API_URL}/api/alerts/`);
            if (response.ok) setSummary(await response.json());
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    };

    const markRead = async (id: number) => {
        await fetch(`${API_URL}/api/alerts/${id}/read`, { method: 'PATCH' });
        fetchAlerts();
    };

    const dismiss = async (id: number) => {
        await fetch(`${API_URL}/api/alerts/${id}`, { method: 'DELETE' });
        fetchAlerts();
    };

    const markAllRead = async () => {
        await fetch(`${API_URL}/api/alerts/mark-all-read`, { method: 'POST' });
        fetchAlerts();
    };

    const getAlertColor = (type: string) => {
        switch (type) {
            case 'budget_exceeded': return 'border-red-500/50 bg-red-500/10';
            case 'budget_danger': return 'border-orange-500/50 bg-orange-500/10';
            case 'budget_warning': return 'border-amber-500/50 bg-amber-500/10';
            default: return 'border-[#262626] bg-[#0f0f0f]';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-[#52525b] hover:text-white transition-colors"
            >
                <Bell className="w-5 h-5" />
                {summary && summary.unread_count > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {summary.unread_count}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-[#171717] border border-[#262626] rounded-lg shadow-xl z-50">
                        <div className="flex items-center justify-between p-3 border-b border-[#262626]">
                            <span className="text-sm font-medium text-white">Notifications</span>
                            {summary && summary.unread_count > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                                >
                                    <Check className="w-3 h-3" /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {!summary || summary.alerts.length === 0 ? (
                                <p className="p-4 text-sm text-[#52525b] text-center">No notifications</p>
                            ) : (
                                <div className="p-2 space-y-2">
                                    {summary.alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className={`p-2 rounded-md border ${getAlertColor(alert.type)} ${!alert.is_read ? 'border-l-2' : ''}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-white">{alert.title}</p>
                                                    <p className="text-xs text-[#a1a1aa] mt-0.5">{alert.message}</p>
                                                </div>
                                                <button
                                                    onClick={() => dismiss(alert.id)}
                                                    className="p-0.5 text-[#52525b] hover:text-red-400"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
