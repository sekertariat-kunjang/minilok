import React, { useState, useEffect } from 'react';
import apiService from '../services/ApiService';
import { MONTHS, CLUSTERS } from '../constants/appConstants';
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

    return (
        <div id="full-report-content" style={{ padding: '40px', background: 'white', width: '800px', color: '#000' }}>
            {/* Header Image */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <img src={headerImg} alt="Header Puskesmas" style={{ width: '100%', height: 'auto' }} />
                <div style={{ marginTop: '10px', fontSize: '1.1rem', fontWeight: 'bold', borderTop: '2px solid #000', paddingTop: '10px' }}>
                    LAPORAN CAPAIAN KINERJA - {cluster.name.toUpperCase()}
                </div>
                <p style={{ margin: '5px 0' }}>Periode: {MONTHS[month]} {year}</p>
            </div>

            {/* Monthly Summary Table */}
            <h3 style={{ borderLeft: '5px solid #0d9488', paddingLeft: '10px', marginBottom: '15px' }}>I. DATA CAPAIAN KINERJA BULANAN</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <thead style={{ background: '#f1f5f9' }}>
                    <tr>
                        <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Kegiatan</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Target</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Capaian</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>%</th>
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
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Annual Summary Table */}
            <h3 style={{ borderLeft: '5px solid #0d9488', paddingLeft: '10px', marginBottom: '15px' }}>II. DATA CAPAIAN KINERJA TAHUNAN (S/D BULAN INI)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                <thead style={{ background: '#f1f5f9' }}>
                    <tr>
                        <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Kegiatan</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Target Tahunan</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Total Capaian</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>Rerata %</th>
                    </tr>
                </thead>
                <tbody>
                    {data.activities.map(a => {
                        const values = data.annualData[a.id] || [];
                        // Only count up to current month
                        const valuesToCurrent = values.slice(0, month + 1);
                        const total = valuesToCurrent.reduce((sum, v) => sum + (v || 0), 0);

                        return (
                            <tr key={a.id}>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{a.name}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{a.targetValue * 12}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center' }}>{total}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
                                    {(a.targetValue * (month + 1)) > 0 ? ((total / (a.targetValue * (month + 1))) * 100).toFixed(1) : '0.0'}%
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Charts Section */}
            <h3 style={{ borderLeft: '5px solid #0d9488', paddingLeft: '10px', marginBottom: '15px' }}>III. VISUALISASI DATA</h3>
            <div style={{ display: 'grid', gridTemplateColumns: data.activities.length >= 3 ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '30px' }}>
                <div style={{ border: '1px solid #e2e8f0', padding: '10px' }}>
                    <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>Target vs Capaian</p>
                    <Bar data={barData} options={{ maintainAspectRatio: true, responsive: true, plugins: { legend: { display: false } } }} />
                </div>
                {data.activities.length >= 3 && (
                    <div style={{ border: '1px solid #e2e8f0', padding: '10px' }}>
                        <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>Analisis Laba-laba</p>
                        <Radar data={radarData} options={{ maintainAspectRatio: true, responsive: true, scales: { r: { min: 0, max: 100, ticks: { display: false } } } }} />
                    </div>
                )}
            </div>

            {/* PDCA Section */}
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

            {/* Signing Section */}
            <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'center', width: '200px' }}>
                    <p>Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
                    <div style={{ height: '80px' }}></div>
                    <p style={{ fontWeight: 'bold', textDecoration: 'underline' }}>( Nama Penanggung Jawab )</p>
                    <p>NIP. ............................</p>
                </div>
            </div>
        </div>
    );
};

export default ReportTemplate;
