export const TARGET_LOGIC = {
    CUMULATIVE: 'cumulative', // Added up every month
    STATIC: 'static'         // Same target every month
};

export const POLARITY = {
    POSITIVE: 'positive', // Higher is better (e.g., coverage)
    NEGATIVE: 'negative'  // Lower is better (e.g., mortality, wait time)
};

export const UNIT = {
    PERCENT: '%',
    PERSON: 'Orang',
    MINUTE: 'Menit',
    CASE: 'Kasus',
    POINT: 'Poin',
    NONE: ''
};

export const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
