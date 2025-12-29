'use client';

import { useState, useEffect } from 'react';
import { Wallet, Target, Plus, ChevronRight, ChevronLeft, Sparkles, CheckCircle2, X } from 'lucide-react';

interface OnboardingModalProps {
    onClose: () => void;
    onComplete: () => void;
}

const STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to FinLens! 🎓',
        description: 'Your AI-powered finance assistant built for students.',
        icon: Sparkles,
    },
    {
        id: 'income',
        title: 'Track Your Income',
        description: 'Add your allowance, part-time job earnings, or scholarship funds.',
        icon: Wallet,
    },
    {
        id: 'budget',
        title: 'Set Your Budgets',
        description: 'Create spending limits for categories like Food, Transport, and Entertainment.',
        icon: Target,
    },
    {
        id: 'expense',
        title: 'Log Your First Expense',
        description: 'Our AI will automatically categorize your spending and help you stay on track.',
        icon: Plus,
    },
];

export default function OnboardingModal({ onClose, onComplete }: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        setIsExiting(true);
        localStorage.setItem('finlens_onboarding_complete', 'true');
        setTimeout(() => {
            onComplete();
        }, 300);
    };

    const handleSkip = () => {
        localStorage.setItem('finlens_onboarding_complete', 'true');
        onClose();
    };

    const step = STEPS[currentStep];
    const StepIcon = step.icon;
    const isLastStep = currentStep === STEPS.length - 1;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`bg-[#171717] border border-[#262626] rounded-2xl w-full max-w-md p-6 shadow-2xl transition-transform duration-300 ${isExiting ? 'scale-95' : 'scale-100'}`}>
                {/* Close button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 text-[#52525b] hover:text-white transition-colors"
                    title="Skip onboarding"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {STEPS.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentStep
                                    ? 'w-8 bg-emerald-500'
                                    : index < currentStep
                                        ? 'w-4 bg-emerald-500/50'
                                        : 'w-4 bg-[#262626]'
                                }`}
                        />
                    ))}
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                        <StepIcon className="w-10 h-10 text-emerald-400" />
                    </div>
                </div>

                {/* Content */}
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-white mb-3">{step.title}</h2>
                    <p className="text-[#a1a1aa] text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Tips for each step */}
                <div className="bg-[#0f0f0f] border border-[#262626] rounded-lg p-4 mb-8">
                    {currentStep === 0 && (
                        <div className="space-y-2 text-xs text-[#a1a1aa]">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>AI-powered expense categorization</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Smart spending alerts & predictions</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Student-focused categories (tuition, dorm, etc.)</span>
                            </div>
                        </div>
                    )}
                    {currentStep === 1 && (
                        <div className="space-y-2 text-xs text-[#a1a1aa]">
                            <p className="font-medium text-white mb-2">Common income sources:</p>
                            <div className="flex flex-wrap gap-2">
                                {['Allowance', 'Part-time Job', 'Scholarship', 'Freelance', 'Gift'].map((source) => (
                                    <span key={source} className="px-2 py-1 bg-[#262626] rounded text-[#a1a1aa]">
                                        {source}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {currentStep === 2 && (
                        <div className="space-y-2 text-xs text-[#a1a1aa]">
                            <p className="font-medium text-white mb-2">Popular student budgets:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex justify-between">
                                    <span>🍔 Food</span>
                                    <span className="text-emerald-400">GHS 500</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>🚗 Transport</span>
                                    <span className="text-emerald-400">GHS 200</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>🎬 Entertainment</span>
                                    <span className="text-emerald-400">GHS 150</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>📖 Textbooks</span>
                                    <span className="text-emerald-400">GHS 100</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentStep === 3 && (
                        <div className="space-y-2 text-xs text-[#a1a1aa]">
                            <p className="font-medium text-white mb-2">Pro tips:</p>
                            <div className="space-y-1.5">
                                <p>💡 Just type what you bought — AI handles the rest</p>
                                <p>🔥 Log daily to build your tracking streak</p>
                                <p>📊 Check Analytics to find spending patterns</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {currentStep > 0 && (
                        <button
                            onClick={handleBack}
                            className="flex items-center justify-center gap-1 px-4 py-2.5 border border-[#262626] text-[#a1a1aa] rounded-lg hover:bg-[#1a1a1a] transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors"
                    >
                        {isLastStep ? 'Get Started' : 'Continue'}
                        {!isLastStep && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>

                {/* Skip link */}
                <button
                    onClick={handleSkip}
                    className="w-full mt-4 text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                >
                    Skip for now
                </button>
            </div>
        </div>
    );
}
