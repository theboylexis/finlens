'use client';

import Sidebar from './Sidebar';

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
    actions?: React.ReactNode;
}

export default function AppLayout({ children, title, actions }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-[#0f0f0f]">
            <Sidebar />

            {/* Main Content - add top padding on mobile for header, left margin on desktop for sidebar */}
            <main className="min-h-screen pt-14 lg:pt-0 lg:ml-60">
                {/* Page Header */}
                {title && (
                    <header className="h-14 border-b border-[#262626] bg-[#0f0f0f] sticky top-14 lg:top-0 z-30 flex items-center justify-between px-4 lg:px-6">
                        <h1 className="text-base font-semibold text-white">{title}</h1>
                        {actions && <div className="flex items-center gap-2">{actions}</div>}
                    </header>
                )}

                {/* Page Content with enter animation */}
                <div className="p-4 lg:p-6 animate-page-enter">
                    {children}
                </div>
            </main>
        </div>
    );
}
