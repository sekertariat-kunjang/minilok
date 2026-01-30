import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, RadialLinearScale } from 'chart.js';
import { Bar, Line, Radar } from 'react-chartjs-2';
import apiService from '../services/ApiService';
import { CLUSTERS, MONTHS } from '../constants/appConstants';

ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const Analysis = ({ month, year }) => {
    const [activeCluster, setActiveCluster] = useState(CLUSTERS[0]);
    const [activities, setActivities] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        loadData();
        setCurrentPage(1);
    }, [activeCluster, month, year]);

    const loadData = async () => {
        const act = await apiService.getActivities(activeCluster.id);
        const ach = await apiService.getAchievements(month, year, activeCluster.id);
        setActivities(act);
        setAchievements(ach);
    };

    const paginatedActivities = React.useMemo(() => {
        const unique = activities.reduce((acc, current) => {
            if (!acc.find(item => item.id === current.id)) {
                return acc.concat([current]);
            }
            return acc;
        }, []);
        return unique.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [activities, currentPage, itemsPerPage]);

    const barData = {
        labels: paginatedActivities.map(a => a.name.substring(0, 15) + '...'),
        datasets: [
            {
                label: 'Target',
                data: paginatedActivities.map(a => a.targetValue),
                backgroundColor: 'rgba(203, 213, 225, 0.5)',
            },
            {
                label: 'Capaian',
                data: paginatedActivities.map(a => {
                    const ach = achievements.find(ach => ach.activityId === a.id);
                    return ach ? ach.value : 0;
                }),
                backgroundColor: '#0d9488',
            }
        ],
    };

    // Trend data logic (Simulated for current and previous months)
    const lineData = {
        labels: MONTHS.slice(0, month + 1),
        datasets: [
            {
                label: 'Tren Capaian Rata-rata (%)',
                data: MONTHS.slice(0, month + 1).map((_, idx) => {
                    // This would ideally fetch data for each month
                    return Math.floor(Math.random() * 40) + 60; // Simulation
                }),
                borderColor: '#0d9488',
                backgroundColor: '#0d9488',
                tension: 0.3,
            }
        ],
    };

    const radarData = {
        labels: paginatedActivities.map(a => a.name.substring(0, 10) + '...'),
        datasets: [
            {
                label: 'Persentase Capaian (%)',
                data: paginatedActivities.map(a => {
                    const ach = achievements.find(ach => ach.activityId === a.id);
                    if (!ach) return 0;
                    return Math.min((ach.value / a.targetValue) * 100, 100).toFixed(1);
                }),
                backgroundColor: 'rgba(13, 148, 136, 0.2)',
                borderColor: '#0d9488',
                pointBackgroundColor: '#0d9488',
                borderWidth: 2,
            }
        ],
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {CLUSTERS.map(c => (
                    <button
                        key={c.id}
                        className={`btn ${activeCluster.id === c.id ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setActiveCluster(c)}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Pagination for Charts */}
            {activities.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: 'white', padding: '0.75rem', borderRadius: '12px' }}>
                    <button
                        className="btn btn-outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                    >
                        Sebelumnya
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tampilkan:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            style={{ padding: '2px 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={9999}>Semua</option>
                        </select>
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                        Data Kegiatan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, activities.length)} dari {activities.length}
                    </span>
                    <button
                        className="btn btn-outline"
                        disabled={currentPage >= Math.ceil(activities.length / itemsPerPage)}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                    >
                        Selanjutnya
                    </button>
                </div>
            )}

            <div className="grid grid-cols-2">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Capaian vs Target (Bulan Ini)</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <Bar data={barData} options={{ maintainAspectRatio: false, responsive: true }} />
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Analisis Laba-laba (Spider)</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <Radar data={radarData} options={{ maintainAspectRatio: false, responsive: true, scales: { r: { min: 0, max: 100 } } }} />
                    </div>
                </div>

                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <div className="card-header">
                        <h3 className="card-title">Tren Kinerja Tahunan</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <Line data={lineData} options={{ maintainAspectRatio: false, responsive: true }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analysis;
