'use client';

import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isLoading = false,
    confirmText = 'Delete',
    cancelText = 'Cancel',
    type = 'danger'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const getColors = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: 'text-red-400',
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/20',
                    button: 'bg-red-500 hover:bg-red-600'
                };
            case 'warning':
                return {
                    icon: 'text-amber-400',
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/20',
                    button: 'bg-amber-500 hover:bg-amber-600'
                };
            default:
                return {
                    icon: 'text-emerald-400',
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/20',
                    button: 'bg-emerald-500 hover:bg-emerald-600'
                };
        }
    };

    const colors = getColors();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#171717] border border-[#262626] rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-[#262626]">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${colors.bg} ${colors.border} border`}>
                            <AlertTriangle className={`w-5 h-5 ${colors.icon}`} />
                        </div>
                        <h2 className="text-lg font-semibold text-white">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-1 text-[#a1a1aa] hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4">
                    <p className="text-[#a1a1aa] text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 bg-[#0f0f0f] rounded-b-lg border-t border-[#262626]">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:text-white transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${colors.button} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                    >
                        {isLoading && (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
