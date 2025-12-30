'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import {
    Category,
    CategorySuggestion,
    ExpenseCreate,
    createExpense,
    fetchCategories,
    suggestCategory,
    API_URL,
    getAuthHeaders,
} from '@/lib/api';
import CategoryBadge from './CategoryBadge';

interface ExpenseFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);
    const [suggestingCategory, setSuggestingCategory] = useState(false);

    // Receipt scanning state
    const [scanning, setScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scanSuccess, setScanSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<ExpenseCreate>({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchCategories().then(setCategories).catch(console.error);
    }, []);

    // Handle receipt scan
    const handleScanReceipt = async (file: File) => {
        setScanning(true);
        setScanError(null);
        setScanSuccess(false);

        try {
            // Convert file to base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove data:image/...;base64, prefix
                    const base64Data = result.split(',')[1];
                    resolve(base64Data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Send to API
            const response = await fetch(`${API_URL}/api/expenses/scan-receipt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({ image_base64: base64 }),
            });

            if (!response.ok) {
                throw new Error('Failed to scan receipt');
            }

            const data = await response.json();

            // Auto-fill form with extracted data
            setFormData({
                amount: data.amount || 0,
                description: data.description || '',
                date: data.date || new Date().toISOString().split('T')[0],
                payment_method: '',
                category: data.category,
            });

            // Set suggestion from scan
            if (data.category) {
                setSuggestion({
                    category: data.category,
                    confidence: data.confidence || 0.8,
                    method: 'ai',
                });
            }

            setScanSuccess(true);
        } catch (error) {
            console.error('Receipt scan error:', error);
            setScanError('Failed to scan receipt. Please try again or enter manually.');
        } finally {
            setScanning(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleScanReceipt(file);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    useEffect(() => {
        if (!formData.description || formData.description.length < 3) {
            setSuggestion(null);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSuggestingCategory(true);
                const result = await suggestCategory(formData.description);
                setSuggestion(result);
            } catch (error) {
                console.error('Failed to suggest category:', error);
            } finally {
                setSuggestingCategory(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.description]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
        if (!formData.description || formData.description.trim().length === 0) newErrors.description = 'Description is required';
        if (!formData.date) newErrors.date = 'Date is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);

        try {
            const expenseData: ExpenseCreate = {
                ...formData,
                category: formData.category || suggestion?.category,
            };
            await createExpense(expenseData);
            setFormData({ amount: 0, description: '', date: new Date().toISOString().split('T')[0], payment_method: '' });
            setSuggestion(null);
            setErrors({});
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Failed to create expense:', error);
            setErrors({ submit: 'Failed to create expense. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = (categoryName: string) => {
        setFormData({ ...formData, category: categoryName });
    };

    const inputClass = "w-full px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-md text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500";
    const labelClass = "block text-xs text-[#a1a1aa] mb-1.5";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Scan Receipt Button */}
            <div className="mb-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    aria-hidden="true"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={scanning}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm font-medium hover:border-cyan-500/50 transition-all disabled:opacity-50"
                >
                    {scanning ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Scanning receipt...
                        </>
                    ) : (
                        <>
                            <Camera className="w-5 h-5" />
                            📸 Scan Receipt
                        </>
                    )}
                </button>
                {scanError && (
                    <p className="mt-2 text-xs text-red-400">{scanError}</p>
                )}
                {scanSuccess && (
                    <p className="mt-2 text-xs text-emerald-400">✓ Receipt scanned! Review the details below.</p>
                )}
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#262626]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[#171717] text-[#52525b]">or enter manually</span>
                </div>
            </div>

            {/* Amount */}
            <div>
                <label htmlFor="amount" className={labelClass}>Amount *</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525b] text-sm" aria-hidden="true">₵</span>
                    <input
                        type="number"
                        id="amount"
                        step="0.01"
                        min="0"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className={`${inputClass} pl-7 ${errors.amount ? 'border-red-500' : ''}`}
                        placeholder="0.00"
                        aria-invalid={!!errors.amount}
                        aria-describedby={errors.amount ? 'amount-error' : undefined}
                    />
                </div>
                {errors.amount && <p id="amount-error" className="mt-1 text-xs text-red-400" role="alert">{errors.amount}</p>}
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className={labelClass}>Description *</label>
                <input
                    type="text"
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`${inputClass} ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="e.g., Lunch at restaurant"
                    aria-invalid={!!errors.description}
                    aria-describedby={errors.description ? 'description-error' : undefined}
                />
                {errors.description && <p id="description-error" className="mt-1 text-xs text-red-400" role="alert">{errors.description}</p>}
            </div>

            {/* AI Category Suggestion */}
            {suggestion && !formData.category && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs text-emerald-400 mb-1">AI Suggestion</p>
                            <CategoryBadge category={suggestion.category} confidence={suggestion.confidence} method={suggestion.method} />
                        </div>
                        <button type="button" onClick={() => handleCategorySelect(suggestion.category)} className="px-2 py-1 text-xs bg-emerald-500 text-black font-medium rounded transition-colors">
                            Use
                        </button>
                    </div>
                </div>
            )}

            {/* Category Selection */}
            <div>
                <label className={labelClass}>Category</label>
                <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Expense categories">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategorySelect(cat.name)}
                            className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${formData.category === cat.name
                                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                                : 'bg-[#0f0f0f] border border-[#262626] text-[#a1a1aa] hover:border-[#404040]'
                                }`}
                            aria-pressed={formData.category === cat.name}
                            aria-label={`Select category ${cat.name}`}
                        >
                            <span className="mr-1" aria-hidden="true">{cat.icon}</span>{cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date */}
            <div>
                <label htmlFor="date" className={labelClass}>Date *</label>
                <input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`${inputClass} ${errors.date ? 'border-red-500' : ''}`}
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? 'date-error' : undefined}
                />
                {errors.date && <p id="date-error" className="mt-1 text-xs text-red-400" role="alert">{errors.date}</p>}
            </div>

            {/* Payment Method */}
            <div>
                <label htmlFor="payment_method" className={labelClass}>Payment Method</label>
                <select
                    id="payment_method"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className={inputClass}
                    aria-label="Select payment method"
                >
                    <option value="">Select payment method</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                </select>
            </div>

            {/* Submit Error */}
            {errors.submit && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-md" role="alert" aria-live="assertive">
                    <p className="text-xs text-red-400">{errors.submit}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
                <button
                    type="submit"
                    disabled={loading || suggestingCategory}
                    className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black text-sm font-medium rounded-md transition-colors"
                >
                    {loading ? 'Adding...' : 'Add Expense'}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="px-3 py-2 border border-[#262626] text-[#a1a1aa] text-sm rounded-md hover:bg-[#1a1a1a] transition-colors">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}
