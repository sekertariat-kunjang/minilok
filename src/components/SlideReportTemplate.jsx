import React, { useState, useEffect } from 'react';
import apiService from '../services/ApiService';
import { MONTHS } from '../constants/appConstants';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, RadialLinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const SlideReportTemplate = ({ cluster, month, year, filterActivityIds }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            let activities = await apiService.getActivities(cluster.id);
            const achievements = await apiService.getAchievements(month, year, cluster.id);

            if (filterActivityIds && filterActivityIds.length > 0) {
                activities = activities.filter(a => filterActivityIds.includes(a.id));
            }

            const slideData = [];
            for (const a of activities) {
                const ach = achievements.find(ach => ach.activityId === a.id);
                const pdca = await apiService.getPDCA(a.id, month, year);

                slideData.push({
                    activity: a,
                    achievement: ach || { value: 0 },
                    pdca: pdca || { plan: '-', do: '-', check: '-', action: '-' }
                });
            }

            setData({ slideData });
        };
        fetchData();
    }, [cluster, month, year, filterActivityIds]);

    if (!data) return null;

    return (
        <div id="slide-report-container">
            {data.slideData.map((item, index) => (
                <div
                    key={item.activity.id}
                    className="report-slide"
                    style={{
                        width: '297mm',
                        height: '210mm',
                        padding: '40px',
                        background: 'white',
                        color: '#000',
                        position: 'relative',
                        pageBreakAfter: 'always',
                        fontFamily: 'system-ui, sans-serif'
                    }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0d9488', paddingBottom: '15px', marginBottom: '30px' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0d9488' }}>{item.activity.name}</h2>
                            <p style={{ margin: '5px 0', fontSize: '1.1rem', color: '#64748b' }}>
                                Kluster: {cluster.name} | Periode: {MONTHS[month]} {year}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: (item.achievement.value / item.activity.targetValue) >= 1 ? '#059669' : '#dc2626' }}>
                                {((item.achievement.value / item.activity.targetValue) * 100).toFixed(1)}%
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Capaian Kinerja</div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px', height: 'calc(100% - 150px)' }}>
                        {/* Left Column: Data & PDCA */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Statistik Utama</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Target</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{item.activity.targetValue}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Realisasi</div>
                                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{item.achievement.value}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#f0fdfa', padding: '20px', borderRadius: '12px', flexGrow: 1 }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#0f766e' }}>Analisis & Tindak Lanjut (PDCA)</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0d9488' }}>PLAN</div>
                                        <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{item.pdca.plan}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0d9488' }}>DO</div>
                                        <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{item.pdca.do}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0d9488' }}>CHECK</div>
                                        <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{item.pdca.check}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#0d9488' }}>ACTION</div>
                                        <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{item.pdca.action}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Visuals */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ height: '50%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px' }}>
                                <p style={{ margin: '0 0 10px 0', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>Visualisasi Capaian</p>
                                <div style={{ height: 'calc(100% - 30px)' }}>
                                    <Bar
                                        data={{
                                            labels: ['Target', 'Capaian'],
                                            datasets: [{
                                                data: [item.activity.targetValue, item.achievement.value],
                                                backgroundColor: ['#cbd5e1', '#0d9488']
                                            }]
                                        }}
                                        options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                                    />
                                </div>
                            </div>
                            <div style={{ height: '50%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '15px' }}>
                                <p style={{ margin: '0 0 10px 0', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>Posisi Kinerja</p>
                                <div style={{ height: 'calc(100% - 30px)' }}>
                                    <Radar
                                        data={{
                                            labels: ['Bulan 1', 'Bulan 2', 'Bulan 3', 'Bulan 4', 'Bulan 5'],
                                            datasets: [{
                                                label: 'Kinerja',
                                                data: [80, 85, 90, 75, (item.achievement.value / item.activity.targetValue) * 100],
                                                backgroundColor: 'rgba(13, 148, 136, 0.2)',
                                                borderColor: '#0d9488'
                                            }]
                                        }}
                                        options={{ maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { display: false } } } }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Page Number */}
                    <div style={{ position: 'absolute', bottom: '30px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                        <span>Laporan Kinerja Bulanan - Sistem Puskesmas Modern</span>
                        <span>Halaman {index + 1} dari {data.slideData.length}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SlideReportTemplate;
