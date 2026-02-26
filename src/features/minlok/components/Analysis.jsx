import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, RadialLinearScale } from 'chart.js';
import { Bar, Line, Radar } from 'react-chartjs-2';
import apiService from '../services/ApiService';
import { CLUSTERS } from '../constants/minlokConstants';
import { MONTHS } from '../../../core/constants/globalConstants';
import { deduplicateByProperty } from '../../../core/utils/DataUtils';

ChartJS.register(CategoryScale, LinearScale, RadialLinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const Analysis = ({ month, year }) => {
    const [activeCluster, setActiveCluster] = useState(CLUSTERS[0]);
    const [activities, setActivities] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [annualAchievements, setAnnualAchievements] = useState([]); // F-03
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true); // F-05
    const [error, setError] = useState(null); // F-04

    useEffect(() => {
        loadData();
        setCurrentPage(1);
    }, [activeCluster, month, year]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // F-03: Fetch annual achievements for trend
            const [act, ach, annual] = await Promise.all([
                apiService.getActivities(activeCluster.id),
                apiService.getAchievements(month, year, activeCluster.id),
                apiService.getAnnualAchievements(year, activeCluster.id)
            ]);

            setActivities(act);
            setAchievements(ach);
            setAnnualAchievements(annual);
        } catch (err) {
            console.error("Analysis Load Error:", err);
            setError("Gagal memuat data analisis. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    const paginatedActivities = React.useMemo(() => {
        const unique = deduplicateByProperty(activities);
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

    // F-03: Real trend data logic
    const lineData = {
        labels: MONTHS.slice(0, month + 1),
        datasets: [
            {
                label: 'Rata-rata Capaian (%)',
                data: MONTHS.slice(0, month + 1).map((_, idx) => {
                    const monthlyAchs = annualAchievements.filter(a => a.month === idx);
                    if (monthlyAchs.length === 0) return 0;

                    // Calculate average percentage for this month
                    const percentages = monthlyAchs.map(ach => {
                        const activity = activities.find(a => a.id === ach.activityId);
                        if (!activity) return 0;
                        return Math.min((ach.value / activity.targetValue) * 100, 100);
                    });

                    const avg = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
                    return avg.toFixed(1);
                }),
                borderColor: '#0d9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                fill: true,
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

    if (loading) return <div className="text-muted" style={{ padding: '4rem', textAlign: 'center' }}>Memuat data analisis...</div>;
    if (error) return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p className="text-danger mb-4">{error}</p>
            <button className="btn btn-primary" onClick={loadData}>Coba Lagi</button>
        </div>
    );

    return (
        <div>
            <div className="flex gap-2 mb-4" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
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
            {activities.length > itemsPerPage && !loading && (
                <div className="flex items-center gap-4 mb-4" style={{ justifyContent: 'center', background: 'white', padding: '0.75rem', borderRadius: '12px' }}>
                    <button
                        className="btn btn-outline text-sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        style={{ padding: '0.25rem 0.75rem' }}
                    >
                        Sebelumnya
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">Tampilkan:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="text-xs"
                            style={{ padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border)', width: 'auto' }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={9999}>Semua</option>
                        </select>
                    </div>
                    <span className="text-sm text-muted" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                        Data Kegiatan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, activities.length)} dari {activities.length}
                    </span>
                    <button
                        className="btn btn-outline text-sm"
                        disabled={currentPage >= Math.ceil(activities.length / itemsPerPage)}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        style={{ padding: '0.25rem 0.75rem' }}
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
