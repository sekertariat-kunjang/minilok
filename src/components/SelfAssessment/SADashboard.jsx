import React, { useMemo, useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Target, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import babData from '../../data/akreditasiData.json';
import { hitungCapaian, THRESHOLD_LEVEL, SKOR_BAIK_MIN, LEVEL_COLOR, hitungLevelAkreditasi } from '../../constants/akreditasiConstants';

const ITEMS_PER_PAGE = 10;

const BAB_IDS = ['bab1', 'bab2', 'bab3', 'bab4', 'bab5'];

export default function SADashboard({ skorData }) {
    const [activeBabIdx, setActiveBabIdx] = useState(0);
    const [pageBaik, setPageBaik] = useState(1);
    const [pageKurang, setPageKurang] = useState(1);

    // Hitung capaian per BAB untuk level akreditasi global
    const capaianPerBab = useMemo(() => {
        const result = {};
        babData.forEach((bab) => {
            const epIds = bab.standar.flatMap((s) => s.kriteria.flatMap((k) => k.ep.map((e) => e.id)));
            const skorList = epIds.map((epId) => skorData[epId]?.skor ?? 0);
            result[bab.id] = hitungCapaian(skorList, epIds.length);
        });
        return result;
    }, [skorData]);

    const levelAkreditasi = useMemo(() => hitungLevelAkreditasi(capaianPerBab), [capaianPerBab]);
    const levelColor = LEVEL_COLOR[levelAkreditasi] || '#64748b';

    const activeBab = babData[activeBabIdx];
    const activeBabId = activeBab.id;
    const threshold = THRESHOLD_LEVEL[activeBabId];
    const capaianBab = capaianPerBab[activeBabId] ?? 0;

    // Data grafik per standar
    const chartData = useMemo(() => {
        return activeBab.standar.map((standar) => {
            const epAll = standar.kriteria.flatMap((k) => k.ep);
            const epIds = epAll.map((e) => e.id);
            const skorList = epIds.map((id) => skorData[id]?.skor ?? 0);
            const capaian = hitungCapaian(skorList, epIds.length);
            return {
                name: standar.id,
                label: `${standar.id} ${standar.nama}`,
                capaian,
                jumlahEP: epIds.length,
            };
        });
    }, [activeBab, skorData]);

    // Rekap EP
    const allEP = useMemo(() => {
        return activeBab.standar.flatMap((s) =>
            s.kriteria.flatMap((k) =>
                k.ep.map((ep) => ({
                    ...ep,
                    standarNama: s.nama,
                    standarId: s.id,
                    kriteriaId: k.id,
                    skor: skorData[ep.id]?.skor ?? null,
                    komentar: skorData[ep.id]?.komentar ?? '',
                }))
            )
        );
    }, [activeBab, skorData]);

    const epBaik = allEP.filter((ep) => ep.skor !== null && ep.skor >= SKOR_BAIK_MIN);
    const epKurang = allEP.filter((ep) => ep.skor === null || ep.skor < SKOR_BAIK_MIN)
        .sort((a, b) => (a.skor ?? -1) - (b.skor ?? -1));
    const epBelumDiisi = allEP.filter((ep) => ep.skor === null).length;

    // Pagination logic
    const totalPageBaik = Math.ceil(epBaik.length / ITEMS_PER_PAGE);
    const totalPageKurang = Math.ceil(epKurang.length / ITEMS_PER_PAGE);

    const paginatedBaik = epBaik.slice((pageBaik - 1) * ITEMS_PER_PAGE, pageBaik * ITEMS_PER_PAGE);
    const paginatedKurang = epKurang.slice((pageKurang - 1) * ITEMS_PER_PAGE, pageKurang * ITEMS_PER_PAGE);

    // Reset page when BAB changes
    useEffect(() => {
        setPageBaik(1);
        setPageKurang(1);
    }, [activeBabIdx]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="sa-chart-tooltip">
                    <p className="sa-tooltip-label">{payload[0]?.payload?.label}</p>
                    <p className="sa-tooltip-value">Capaian: <strong>{payload[0].value}%</strong></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="sa-dashboard">
            {/* Kartu level akreditasi global */}
            <div className="sa-level-card" style={{ borderLeft: `6px solid ${levelColor}` }}>
                <div>
                    <p className="sa-level-subtitle">Estimasi Level Akreditasi</p>
                    <h2 className="sa-level-title" style={{ color: levelColor }}>{levelAkreditasi}</h2>
                    <p className="sa-level-note">Berdasarkan capaian semua BAB saat ini</p>
                </div>
                <div className="sa-level-bab-summary">
                    {babData.map((bab) => (
                        <div key={bab.id} className="sa-bab-chip">
                            <span className="sa-bab-chip-code">{bab.kode}</span>
                            <span className="sa-bab-chip-value">{capaianPerBab[bab.id] ?? 0}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tab 5 BAB */}
            <div className="sa-tab-bar">
                {babData.map((bab, idx) => (
                    <button
                        key={bab.id}
                        className={`sa-tab ${activeBabIdx === idx ? 'active' : ''}`}
                        onClick={() => setActiveBabIdx(idx)}
                    >
                        <span className="sa-tab-kode">{bab.kode}</span>
                        <span className="sa-tab-capaian">{capaianPerBab[bab.id] ?? 0}%</span>
                    </button>
                ))}
            </div>

            {/* Konten BAB aktif */}
            <div className="sa-bab-content">
                {/* Kartu ringkasan BAB */}
                <div className="sa-summary-cards">
                    <div className="sa-summary-card">
                        <Target size={24} className="sa-card-icon primary" />
                        <div>
                            <p className="sa-card-label">Capaian BAB</p>
                            <p className="sa-card-value">{capaianBab}%</p>
                        </div>
                    </div>
                    <div className="sa-summary-card">
                        <CheckCircle2 size={24} className="sa-card-icon success" />
                        <div>
                            <p className="sa-card-label">Nilai Baik (≥{SKOR_BAIK_MIN})</p>
                            <p className="sa-card-value">{epBaik.length} EP</p>
                        </div>
                    </div>
                    <div className="sa-summary-card">
                        <AlertTriangle size={24} className="sa-card-icon danger" />
                        <div>
                            <p className="sa-card-label">Perlu Perhatian</p>
                            <p className="sa-card-value">{epKurang.length} EP</p>
                        </div>
                    </div>
                    <div className="sa-summary-card">
                        <div className="sa-threshold-list">
                            <p className="sa-card-label">Threshold Level</p>
                            <p className="sa-threshold-row"><span className="th-label">Dasar</span><span>≥{threshold.dasar}%</span></p>
                            <p className="sa-threshold-row"><span className="th-label">Madya</span><span>≥{threshold.madya}%</span></p>
                            <p className="sa-threshold-row"><span className="th-label">Utama</span><span>≥{threshold.utama}%</span></p>
                            <p className="sa-threshold-row"><span className="th-label">Paripurna</span><span>≥{threshold.paripurna}%</span></p>
                        </div>
                    </div>
                </div>

                {/* Grafik capaian per standar */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Capaian per Standar — {activeBab.kode}</h3>
                        {epBelumDiisi > 0 && (
                            <span className="badge badge-warning">{epBelumDiisi} EP belum diisi</span>
                        )}
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={threshold.dasar} stroke="#f97316" strokeDasharray="4 2" label={{ value: 'Dasar', position: 'right', fontSize: 10, fill: '#f97316' }} />
                            <ReferenceLine y={threshold.paripurna} stroke="#0d9488" strokeDasharray="4 2" label={{ value: 'Paripurna', position: 'right', fontSize: 10, fill: '#0d9488' }} />
                            <Bar dataKey="capaian" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.capaian >= threshold.utama ? '#0d9488' : entry.capaian >= threshold.dasar ? '#f59e0b' : '#ef4444'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Tabel rekap */}
                <div className="sa-rekap-grid">
                    {/* Nilai Baik */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title" style={{ color: '#166534' }}>
                                <CheckCircle2 size={18} style={{ display: 'inline', marginRight: 6 }} />
                                Nilai Baik (≥{SKOR_BAIK_MIN})
                            </h3>
                            <span className="badge badge-success">{epBaik.length} EP</span>
                        </div>
                        {epBaik.length === 0 ? (
                            <p className="sa-empty-msg">Belum ada EP dengan nilai baik</p>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: 80 }}>EP</th>
                                            <th>Uraian</th>
                                            <th style={{ width: 60, textAlign: 'center' }}>Skor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedBaik.map((ep) => (
                                            <tr key={ep.id}>
                                                <td><code style={{ fontSize: '0.8rem' }}>{ep.id}</code></td>
                                                <td style={{ fontSize: '0.85rem' }}>{ep.uraian}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className="sa-skor-badge good">{ep.skor}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {totalPageBaik > 1 && (
                                    <div className="sa-pagination">
                                        <button
                                            className="sa-page-btn"
                                            disabled={pageBaik === 1}
                                            onClick={() => setPageBaik(p => p - 1)}
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="sa-page-info">Hal {pageBaik} dari {totalPageBaik}</span>
                                        <button
                                            className="sa-page-btn"
                                            disabled={pageBaik === totalPageBaik}
                                            onClick={() => setPageBaik(p => p + 1)}
                                        >
                                            <ChevronRightIcon size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Perlu Perhatian */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title" style={{ color: '#991b1b' }}>
                                <AlertTriangle size={18} style={{ display: 'inline', marginRight: 6 }} />
                                Perlu Perhatian
                            </h3>
                            <span className="badge badge-danger">{epKurang.length} EP</span>
                        </div>
                        {epKurang.length === 0 ? (
                            <p className="sa-empty-msg" style={{ color: '#166534' }}>Semua EP sudah bernilai baik! 🎉</p>
                        ) : (
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: 80 }}>EP</th>
                                            <th>Uraian</th>
                                            <th style={{ width: 60, textAlign: 'center' }}>Skor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedKurang.map((ep) => (
                                            <tr key={ep.id}>
                                                <td><code style={{ fontSize: '0.8rem' }}>{ep.id}</code></td>
                                                <td style={{ fontSize: '0.85rem' }}>{ep.uraian}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span className={`sa-skor-badge ${ep.skor === null ? 'empty' : 'bad'}`}>
                                                        {ep.skor === null ? '—' : ep.skor}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {totalPageKurang > 1 && (
                                    <div className="sa-pagination">
                                        <button
                                            className="sa-page-btn"
                                            disabled={pageKurang === 1}
                                            onClick={() => setPageKurang(p => p - 1)}
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="sa-page-info">Hal {pageKurang} dari {totalPageKurang}</span>
                                        <button
                                            className="sa-page-btn"
                                            disabled={pageKurang === totalPageKurang}
                                            onClick={() => setPageKurang(p => p + 1)}
                                        >
                                            <ChevronRightIcon size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
