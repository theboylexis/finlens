'use client';

import { Plus } from 'lucide-react';

interface QuickAddButtonProps {
    onClick: () => void;
}

export default function QuickAddButton({ onClick }: QuickAddButtonProps) {
    return (
        <button
            onClick={onClick}
            className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full shadow-lg shadow-emerald-500/25 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            aria-label="Add expense"
        >
            <Plus className="w-6 h-6 text-black" />
        </button>
    );
}
