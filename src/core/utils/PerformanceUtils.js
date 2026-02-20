import { POLARITY } from '../constants/globalConstants';

/**
 * Calculates the percentage of achievement based on target, value, and polarity.
 * @param {number} target - The target value
 * @param {number} value - The actual value achieved
 * @param {string} polarity - 'positive' or 'negative'
 * @returns {number} Percentage achievement (max 100 for display safety, or actual if needed)
 */
export const calculatePercent = (target, value, polarity = POLARITY.POSITIVE) => {
    if (!target || target === 0) return 0;

    if (polarity === POLARITY.NEGATIVE) {
        // Lower is better. If value is <= target, it's 100% or more.
        if (value <= target) return 100;
        // If value > target, the performance is worse. 
        // Example: target 10, value 20 -> performance 50%
        return Math.max(0, (target / value) * 100);
    }

    // Default: Higher is better
    return (value / target) * 100;
};

/**
 * Returns the trend status (up/down) and if it's considered good or bad.
 * @param {number} value - Current value
 * @param {number} target - Target value
 * @param {string} polarity - 'positive' or 'negative'
 * @returns {string} 'good', 'bad', or 'neutral'
 */
export const getStatusColor = (value, target, polarity = POLARITY.POSITIVE) => {
    if (polarity === POLARITY.NEGATIVE) {
        return value <= target ? 'good' : 'bad';
    }
    return value >= target ? 'good' : 'bad';
};
