// Konstanta Akreditasi Puskesmas 2023

export const LOCK_PASSWORD = 'pusaka2026';
export const ADMIN_UNLOCK_PASSWORD = 'merdeka2026';

export const SKOR_OPTIONS = [0, 5, 10];

export const AKREDITASI_LEVEL = {
    TIDAK: 'Tidak Terakreditasi',
    DASAR: 'Terakreditasi Dasar',
    MADYA: 'Terakreditasi Madya',
    UTAMA: 'Terakreditasi Utama',
    PARIPURNA: 'Terakreditasi Paripurna',
};

// Threshold per BAB per level (dalam %)
// Sumber: Sheet Nilai (Rekapitulasi Capaian Seluruh BAB)
export const THRESHOLD_LEVEL = {
    bab1: { dasar: 75, madya: 75, utama: 80, paripurna: 80 },
    bab2: { dasar: 75, madya: 75, utama: 80, paripurna: 80 },
    bab3: { dasar: 60, madya: 60, utama: 70, paripurna: 80 },
    bab4: { dasar: 60, madya: 60, utama: 75, paripurna: 80 },
    bab5: { dasar: 60, madya: 70, utama: 75, paripurna: 80 },
};

// Skor maksimal per EP (standar akreditasi Indonesia: 0, 5, 10)
export const SKOR_MAX_PER_EP = 10;

// Threshold "nilai baik" untuk rekap dashboard
export const SKOR_BAIK_MIN = 8;

// Warna level akreditasi
export const LEVEL_COLOR = {
    'Tidak Terakreditasi': '#ef4444',
    'Terakreditasi Dasar': '#f97316',
    'Terakreditasi Madya': '#eab308',
    'Terakreditasi Utama': '#22c55e',
    'Terakreditasi Paripurna': '#0d9488',
};

/**
 * Hitung level akreditasi berdasarkan capaian per BAB.
 * Untuk setiap level, semua BAB harus memenuhi threshold.
 * @param {Object} capaianPerBab - { bab1: 75, bab2: 80, ... }
 * @returns {string} level akreditasi
 */
export function hitungLevelAkreditasi(capaianPerBab) {
    const babIds = Object.keys(THRESHOLD_LEVEL);

    const cekLevel = (levelKey) =>
        babIds.every((babId) => {
            const capaian = capaianPerBab[babId] ?? 0;
            const threshold = THRESHOLD_LEVEL[babId][levelKey];
            return capaian >= threshold;
        });

    if (cekLevel('paripurna')) return AKREDITASI_LEVEL.PARIPURNA;
    if (cekLevel('utama')) return AKREDITASI_LEVEL.UTAMA;
    if (cekLevel('madya')) return AKREDITASI_LEVEL.MADYA;
    if (cekLevel('dasar')) return AKREDITASI_LEVEL.DASAR;
    return AKREDITASI_LEVEL.TIDAK;
}

/**
 * Hitung capaian (%) dari daftar skor EP dalam satu BAB atau Standar.
 * @param {Array} skorList - array nilai skor (0, 5, atau 10)
 * @param {number} totalEP - jumlah EP
 * @returns {number} persentase capaian (0–100)
 */
export function hitungCapaian(skorList, totalEP) {
    if (totalEP === 0) return 0;
    const totalSkor = skorList.reduce((sum, s) => sum + (s || 0), 0);
    const maxSkor = totalEP * SKOR_MAX_PER_EP;
    return maxSkor === 0 ? 0 : Math.round((totalSkor / maxSkor) * 100);
}
