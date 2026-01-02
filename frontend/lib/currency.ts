/**
 * Currency utility for consistent currency formatting across the app.
 * Centralizes currency configuration to make it easy to change.
 */

// Currency configuration - change these to update across the app
export const CURRENCY = {
    code: 'GHS',
    symbol: 'GH₵',
    symbolShort: '₵',
    name: 'Ghana Cedi',
    locale: 'en-GH',
};

/**
 * Format a number as currency.
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
    amount: number,
    options: {
        showSymbol?: boolean;
        showSign?: boolean;
        decimals?: number;
    } = {}
): string {
    const { showSymbol = true, showSign = false, decimals = 2 } = options;

    const sign = showSign && amount > 0 ? '+' : '';
    const formattedAmount = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (showSymbol) {
        return `${sign}${CURRENCY.symbol}${formattedAmount}`;
    }
    return `${sign}${formattedAmount}`;
}

/**
 * Format currency with code (e.g., "GHS 100.00")
 */
export function formatCurrencyWithCode(amount: number): string {
    return `${CURRENCY.code} ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Format a positive amount (income, credits)
 */
export function formatPositiveAmount(amount: number): string {
    return `+${CURRENCY.symbol}${amount.toFixed(2)}`;
}

/**
 * Format a negative amount (expenses, debits)
 */
export function formatNegativeAmount(amount: number): string {
    return `-${CURRENCY.symbol}${Math.abs(amount).toFixed(2)}`;
}
