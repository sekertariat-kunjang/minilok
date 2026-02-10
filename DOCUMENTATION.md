# Dokumentasi Aplikasi Minilokarya

Aplikasi ini dirancang untuk memantau Kinerja Puskesmas (PKP) melalui sistem Minilokarya digital yang mendukung pelaporan bulanan, analisis PDCA, dan visualisasi data.

## Teknologi Utama
- **Frontend**: React.js (Vite)
- **Styling**: Vanilla CSS (modern, glassmorphism-inspired)
- **Database**: Supabase (PostgreSQL)
- **Library Grafik**: Chart.js & React-Chartjs-2
- **Export Laporan**: jsPDF & html2canvas

## Arsitektur & Aliran Data
1.  **Input Data**: User memasukkan target kegiatan dan capaian riil per bulan melalui menu "Input Data".
2.  **Penyimpanan**: Data disimpan di tabel `activities` (definisi program) dan `achievements` (hasil capaian).
3.  **Analisis PDCA**: Untuk kegiatan yang tidak mencapai target (capaian < 100%), sistem menyediakan form PDCA khusus yang disimpan di tabel `pdca`.
4.  **Dashboard & Statistik**: Data ditarik dari Supabase untuk dihitung persentase keberhasilannya dan divisualisasikan dalam bentuk grafik.

## Logika Grafik

### 1. Grafik Batang (Target vs Capaian)
- **Sumbu X**: Nama kegiatan (dipotong 15 karakter untuk keterbacaan).
- **Sumbu Y**: Nilai numerik data.
- **Logika**: Membandingkan `targetValue` yang ditetapkan dengan `achievementValue` pada periode (bulan/tahun) tersebut.

### 2. Grafik Laba-laba (Spider/Radar Chart)
- **Tujuan**: Melihat keseimbangan kinerja lintas program dalam satu kluster.
- **Logika**:
    - Data yang diplot adalah **Persentase Capaian (%)**.
    - Rumus: `(Capaian / Target) * 100`.
    - Nilai dibatasi maksimal 100% pada grafik agar skala tetap simetris, namun angka riil tetap ditampilkan di tabel.

### 3. Tren Kinerja
- Menampilkan pergerakan rata-rata capaian dari bulan Januari hingga bulan terpilih.

## Aturan Pelaporan (PDF/Slide)
- **Laporan Cetak**: Menggunakan layout vertikal (A4) yang mencakup tabel detail, statistik tahunan, visualisasi, dan tabel PDCA.
- **Slide Presentasi**: Menggunakan layout horizontal (Landscape A4). Setiap program/kegiatan mendapatkan satu slide khusus yang berisi statistik utama, grafik batang lokal, radar chart lokal, dan narasi PDCA.

## Batasan Sistem
- **Karakter PDCA**: Setiap elemen (Plan, Do, Check, Action) dibatasi maksimal **200 karakter** untuk menjaga kerapihan layout slide laporan.
- **Indikator Tren**:
    - 🟢 ↑ : Capaian >= Target
    - 🔴 ↓ : Capaian < Target
    - ➖ : Data tidak tersedia atau target 0
