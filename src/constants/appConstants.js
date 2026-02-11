export const CLUSTERS = [
  { id: 'k1', label: 'Kluster 1', name: 'Administrasi Manajemen' },
  { id: 'k2', label: 'Kluster 2', name: 'Ibu dan Balita' },
  { id: 'k3', label: 'Kluster 3', name: 'Dewasa dan Lansia' },
  { id: 'k4', label: 'Kluster 4', name: 'Penyakit Menular dan Tidak Menular' },
  { id: 'k5', label: 'Kluster 5', name: 'Lintas Kluster' }
];

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
