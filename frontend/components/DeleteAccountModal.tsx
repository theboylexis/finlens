'use client';

import { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    userName: string;
}

export default function DeleteAccountModal({
    isOpen,
    onClose,
    onConfirm,
    userName
}: DeleteAccountModalProps) {
    const [confirmText, setConfirmText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const isConfirmEnabled = confirmText === 'DELETE';

    const handleConfirm = async () => {
        if (!isConfirmEnabled) return;

        setIsLoading(true);
        setError(null);

        try {
            await onConfirm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete account');
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (isLoading) return;
        setConfirmText('');
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#171717] border border-[#262626] rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-[#262626]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-red-500/10 border-red-500/20 border">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Delete Account</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="p-1 text-[#a1a1aa] hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                        <p className="text-red-400 text-sm font-medium">
                            Warning: This action cannot be undone!
                        </p>
                    </div>

                    <p className="text-[#a1a1aa] text-sm leading-relaxed">
                        You are about to permanently delete your account <span className="text-white font-medium">({userName})</span>.
                        This will remove all your data including:
                    </p>

                    <ul className="text-[#a1a1aa] text-sm list-disc list-inside space-y-1">
                        <li>All expenses and transaction history</li>
                        <li>Budget settings</li>
                        <li>Savings goals and contributions</li>
                        <li>Subscriptions</li>
                        <li>Income records</li>
                        <li>Split bills and friends</li>
                    </ul>

                    <div className="pt-2">
                        <label className="block text-sm text-[#a1a1aa] mb-2">
                            To confirm, type <span className="text-white font-mono bg-[#262626] px-1.5 py-0.5 rounded">DELETE</span> below:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                            disabled={isLoading}
                            placeholder="Type DELETE to confirm"
                            className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-white placeholder:text-[#52525b] focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 p-4 bg-[#0f0f0f] rounded-b-lg border-t border-[#262626]">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-[#a1a1aa] hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isConfirmEnabled || isLoading}
                        className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}
