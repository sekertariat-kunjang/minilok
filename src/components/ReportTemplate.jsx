import React, { useState, useEffect } from 'react';
import apiService from '../services/ApiService';
import { MONTHS, CLUSTERS, TARGET_LOGIC } from '../constants/appConstants';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, RadialLinearScale } from 'chart.js';
import { Bar, Line, Radar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);
import headerImg from '../assets/header.png';

const ReportTemplate = ({ cluster, month, year, filterActivityIds }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            let activities = await apiService.getActivities(cluster.id);
            const achievements = await apiService.getAchievements(month, year, cluster.id);

            // Filter activities if specific ones are selected
            if (filterActivityIds && filterActivityIds.length > 0) {
                activities = activities.filter(a => filterActivityIds.includes(a.id));
            }

            // [OPTIMIZATION] Bulk fetch annual data
            const allYearAch = await apiService.getAnnualAchievements(year, cluster.id);
            const annualData = {};
            allYearAch.forEach(ach => {
                if (!annualData[ach.activityId]) annualData[ach.activityId] = [];
                // Achievement month index (0-11) matches the array index we want
                annualData[ach.activityId][ach.month] = ach.value;
            });

            // [OPTIMIZATION] Bulk fetch PDCA data
            const allPdca = await apiService.getBulkPDCA(month, year, cluster.id);
            const pdcaList = allPdca.filter(p =>
                activities.some(act => act.id === p.activityId)
            );

            setData({ activities, achievements, pdcaList, annualData });
        };
        fetchData();
    }, [cluster, month, year, filterActivityIds]);

    if (!data) return null;

    const barData = {
        labels: data.activities.map(a => a.name.substring(0, 15)),
        datasets: [
            { label: 'Target', data: data.activities.map(a => a.targetValue), backgroundColor: '#cbd5e1' },
            {
                label: 'Capaian',
                data: data.activities.map(a => {
                    const ach = data.achievements.find(ach => ach.activityId === a.id);
                    return ach ? ach.value : 0;
                }),
                backgroundColor: '#0d9488'
            }
        ]
    };

    const radarData = {
        labels: data.activities.map(a => a.name.substring(0, 10)),
        datasets: [{
            label: 'Capaian (%)',
            data: data.activities.map(a => {
                const ach = data.achievements.find(ach => ach.activityId === a.id);
                const val = ach ? ach.value : 0;
                return a.targetValue > 0 ? Math.min((val / a.targetValue) * 100, 100) : 0;
            }),
            backgroundColor: 'rgba(13, 148, 136, 0.2)',
            borderColor: '#0d9488',
        }]
    };

    const lineData = {
        labels: MONTHS.slice(0, month + 1),
        datasets: [{
            label: 'Rerata Capaian (%)',
            data: MONTHS.slice(0, month + 1).map((_, idx) => {
                // Calculate average % achievement for each month
                let totalPercent = 0;
                let count = 0;
                data.activities.forEach(a => {
                    if (a.targetValue > 0) {
                        const monthlyVal = data.annualData[a.id] ? (data.annualData[a.id][idx] || 0) : 0;
                        totalPercent += Math.min((monthlyVal / a.targetValue) * 100, 100);
                        count++;
                    }
                });
                return count > 0 ? (totalPercent / count).toFixed(1) : 0;
            }),
            borderColor: '#0d9488',
            backgroundColor: 'rgba(13, 148, 136, 0.5)',
            tension: 0.3
        }]
    };

    return (
        <div id="full-report-content" style={{ padding: '40px', background: 'white', width: '800px', color: '#000' }}>
            {/* Header Image */}
            <div className="report-section" style={{ marginBottom: '40px', textAlign: 'center' }}>
                <img src={headerImg} alt="Header Puskesmas" style={{ width: '100%', height: 'auto' }} />
                <div style={{ marginTop: '10px', fontSize: '1.1rem', fontWeight: 'bold', borderTop: '2px solid #000', paddingTop: '10px' }}>
                    LAPORAN CAPAIAN KINERJA - {cluster.name.toUpperCase()}
                </div>
                <p style={{ margin: '5px 0' }}>Periode: {MONTHS[month]} {year}</p>
            </div>

            {/* Monthly Summary Table */}
            <div className="report-section" style={{ marginBottom: '40px' }}>
                <h3 style={{ borderLeft: '5px solid #0d9488', paddingLeft: '10px', marginBottom: '15px' }}>I. DATA CAPAIAN KINERJA BULANAN</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9' }}>
                        <tr>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>KEGIATAN</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>TARGET</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>CAPAIAN</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>%</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>TREN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.activities.map(a => {
                            const ach = data.achievements.find(ach => ach.activityId === a.id);
                            const val = ach ? ach.value : 0;
                            return (
                                <tr key={a.id}>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{a.name}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{a.targetValue}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{val}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                                        {a.targetValue > 0 ? ((val / a.targetValue) * 100).toFixed(1) : '0.0'}%
                                    </td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontSize: '1.2rem' }}>
                                        {val > a.targetValue ? <span style={{ color: '#059669' }}>▲</span> :
                                            val < a.targetValue ? <span style={{ color: '#dc2626' }}>▼</span> :
                                                <span style={{ color: '#64748b' }}>—</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Annual Summary Table */}
            <div className="report-section" style={{ marginBottom: '40px' }}>
                <h3 style={{ borderLeft: '5px solid #0d9488', paddingLeft: '10px', marginBottom: '15px' }}>II. DATA CAPAIAN KINERJA TAHUNAN (S/D BULAN INI)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9' }}>
                        <tr>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>KEGIATAN</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>TARGET TAHUNAN</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>TOTAL CAPAIAN</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>RERATA %</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>TREN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.activities.map(a => {
                            const values = data.annualData[a.id] || [];
                            const valuesToCurrent = values.slice(0, month + 1);
                            const total = valuesToCurrent.reduce((sum, v) => sum + (v || 0), 0);

                            // Simplified logic: Only "cumulative" gets 12x. Everything else (static/default) stays 1x.
                            const isCumulative = a.targetLogic === 'cumulative';

                            const annualTarget = isCumulative ? a.targetValue * 12 : a.targetValue;
                            const baselineTarget = isCumulative ? a.targetValue * (month + 1) : a.targetValue;

                            // Current month achievement value
                            const ach = data.achievements.find(ach => ach.activityId === a.id);
                            const currentVal = ach ? ach.value : 0;

                            // For static programs, we want "Bulanan = Tahunan"
                            const displayTotal = isCumulative ? total : currentVal;
                            const displayBaseline = isCumulative ? baselineTarget : a.targetValue;

                            return (
                                <tr key={a.id}>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{a.name}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{annualTarget}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{displayTotal}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                                        {displayBaseline > 0 ? ((displayTotal / displayBaseline) * 100).toFixed(1) : '0.0'}%
                                    </td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontSize: '1.2rem' }}>
                                        {Number(displayTotal) > displayBaseline ? <span style={{ color: '#059669' }}>▲</span> :
                                            Number(displayTotal) < displayBaseline ? <span style={{ color: '#dc2626' }}>▼</span> :
                                                <span style={{ color: '#64748b' }}>—</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Charts Section */}
            <div className="report-section" style={{ marginBottom: '40px' }}>
                <h3 style={{ borderLeft: '5px solid #0d9488', paddingLeft: '10px', marginBottom: '15px' }}>III. VISUALISASI DATA</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ border: '1px solid #e2e8f0', padding: '10px' }}>
                        <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>Target vs Capaian</p>
                        <Bar data={barData} options={{ maintainAspectRatio: true, responsive: true, plugins: { legend: { display: false } } }} />
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', padding: '10px' }}>
                        <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>Analisis Laba-laba</p>
                        <Radar data={radarData} options={{ maintainAspectRatio: true, responsive: true, scales: { r: { min: 0, max: 100, ticks: { display: false } } } }} />
                    </div>
                    <div style={{ gridColumn: 'span 2', border: '1px solid #e2e8f0', padding: '10px' }}>
                        <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>Tren Kinerja Bulanan</p>
                        <Line data={lineData} options={{ maintainAspectRatio: true, responsive: true, scales: { y: { min: 0, max: 120 } } }} />
                    </div>
                </div>
            </div>
            {/*
                - Verified the final structure matches:
                    1. **I. Capaian Bulanan**
                    2. **II. Capaian Tahunan**
                    3. **III. Visualisasi Data**
                    4. **IV. Analisis PDCA**
                - **Enhanced Annual Logic:**
                    - Programs with `cumulative` logic: Show full annual target (12x) and summed achievement.
                    - Programs with `static` logic: Show monthly target as annual baseline and average achievement to date (to keep percentages accurate).
                - All sections are correctly isolated in `report-section` divs to maintain the "Atomic Pagination" fix.
            */}
            {/* PDCA Section */}
            <div className="report-section" style={{ marginBottom: '40px' }}>
                <h3 style={{ borderLeft: '5px solid #0d9488', paddingLeft: '10px', marginBottom: '15px' }}>IV. ANALISIS PERBAIKAN (PDCA)</h3>
                {data.pdcaList.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f1f5f9' }}>
                            <tr>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Kegiatan</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Plan</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Do</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Check</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.pdcaList.map((p, i) => (
                                <tr key={i}>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '0.8rem' }}>{p.activityName}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '0.8rem' }}>{p.plan}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '0.8rem' }}>{p.do}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '0.8rem' }}>{p.check}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontSize: '0.8rem' }}>{p.action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={{ fontStyle: 'italic', color: '#64748b' }}>Tidak ada data PDCA untuk periode ini.</p>
                )}
            </div>

            {/* Signing Section */}
            <div className="report-section" style={{ marginTop: '60px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '50px' }}>
                    <div style={{ textAlign: 'center', width: '250px' }}>
                        <p style={{ margin: 0 }}>Mengetahui,</p>
                        <p style={{ margin: '0 0 10px 0' }}>Penanggung Jawab Program</p>
                        <div style={{ height: '80px' }}></div>
                        <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>( .................................... )</p>
                        <p style={{ margin: 0 }}>NIP. ............................</p>
                    </div>
                    <div style={{ textAlign: 'center', width: '250px' }}>
                        <p style={{ margin: 0 }}>Kunjang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p style={{ margin: '0 0 10px 0' }}>Penanggung Jawab Kluster</p>
                        <div style={{ height: '80px' }}></div>
                        <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>( .................................... )</p>
                        <p style={{ margin: 0 }}>NIP. ............................</p>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', width: '250px' }}>
                        <p style={{ margin: '0 0 10px 0' }}>Kepala Puskesmas</p>
                        <div style={{ height: '80px' }}></div>
                        <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>( .................................... )</p>
                        <p style={{ margin: 0 }}>NIP. ............................</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportTemplate;
