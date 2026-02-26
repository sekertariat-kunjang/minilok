/**
 * Shared utility functions for data manipulation.
 */

/**
 * Deduplicates an array of objects based on a property (default: 'id').
 * @param {Array} array - The array to deduplicate.
 * @param {string} key - The property name to use as a unique identifier.
 * @returns {Array} - The deduplicated array.
 */
export const deduplicateByProperty = (array, key = 'id') => {
    return array.reduce((acc, current) => {
        if (!acc.find(item => item[key] === current[key])) {
            return acc.concat([current]);
        }
        return acc;
    }, []);
};
