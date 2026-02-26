import React, { useState, useEffect } from 'react';
import { CLUSTERS } from '../constants/minlokConstants';
import { TARGET_LOGIC, POLARITY } from '../../../core/constants/globalConstants';
import { calculatePercent } from '../../../core/utils/PerformanceUtils';
import apiService from '../services/ApiService';
import { AlertCircle, CheckCircle2, TrendingUp, Download, ChevronDown, ChevronUp, Monitor, FileText, Presentation, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToPDF, exportSlidesToPDF } from '../../reporting/services/ReportService';
import ReportTemplate from '../../reporting/components/ReportTemplate';
import SlideReportTemplate from '../../reporting/components/SlideReportTemplate';
import { useToast } from '../../../core/components/Toast';

const ITEMS_PER_PAGE = 10;

const Dashboard = ({ month, year, cluster, onClusterChange, selectedActivityIds, setSelectedActivityIds }) => {
    const [activities, setActivities] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToast } = useToast();

    useEffect(() => {
        loadData();
        setCurrentPage(1); // Reset pagination when cluster/period changes
    }, [cluster, month, year]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [act, ach] = await Promise.all([
                apiService.getActivities(cluster.id),
                apiService.getAchievements(month, year, cluster.id)
            ]);
            setActivities(act);
            setAchievements(ach);
        } catch (err) {
            console.error("Dashboard Load Error:", err);
            setError("Gagal memuat data dashboard. Silakan periksa koneksi internet Anda.");
        } finally {
            setLoading(false);
        }
    };

    const calculateAchievement = (activityId, targetValue, polarity) => {
        const ach = achievements.find(a => a.activityId === activityId);
        if (!ach) return { percent: 0, value: 0 };

        const percent = calculatePercent(targetValue, ach.value, polarity);
        return { percent: percent.toFixed(1), value: ach.value };
    };

    const [showFilter, setShowFilter] = useState(false);

    const toggleActivitySelection = (id) => {
        setSelectedActivityIds(prev => {
            const next = prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id];
            return next;
        });
    };

    if (loading) return <div className="text-muted" style={{ padding: '4rem', textAlign: 'center' }}>Memuat data dashboard...</div>;
    if (error) return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p className="text-danger mb-4">{error}</p>
            <button className="btn btn-primary" onClick={loadData}>Coba Lagi</button>
        </div>
    );

    return (
        <div>
            {/* cluster tabs */}
            <div className="flex gap-2 mb-4" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {CLUSTERS.map(c => (
                    <button
                        key={c.id}
                        className={`btn ${cluster.id === c.id ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => onClusterChange(c)}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-3">
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <p className="text-muted text-sm">Total Kegiatan</p>
                    <h3 className="mt-2" style={{ fontSize: '1.5rem' }}>{activities.length}</h3>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <p className="text-muted text-sm">Tercapai</p>
                    <h3 className="mt-2" style={{ fontSize: '1.5rem' }}>
                        {activities.filter(a => calculateAchievement(a.id, a.targetValue, a.polarity).percent >= 100).length}
                    </h3>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                    <p className="text-muted text-sm">Belum Tercapai</p>
                    <h3 className="mt-2" style={{ fontSize: '1.5rem' }}>
                        {activities.filter(a => calculateAchievement(a.id, a.targetValue, a.polarity).percent < 100).length}
                    </h3>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Rincian Kinerja - {cluster.name}</h3>
                    <div className="flex gap-2 items-center">

                        {/* Multi-Select Dropdown */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className="btn btn-outline text-sm"
                                style={{ padding: '0.4rem 0.8rem' }}
                                onClick={() => setShowFilter(!showFilter)}
                            >
                                {selectedActivityIds.length === 0
                                    ? 'Semua Program'
                                    : `${selectedActivityIds.length} Program Dipilih`}
                                {showFilter ? <ChevronUp size={14} style={{ marginLeft: '5px' }} /> : <ChevronDown size={14} style={{ marginLeft: '5px' }} />}
                            </button>

                            {showFilter && (
                                <div className="dropdown-container" style={{ width: '400px', maxHeight: '400px' }}>
                                    <div className="justify-between mb-4 flex" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' }}>
                                        <span className="font-bold text-sm" style={{ color: '#1e293b' }}>Pilih Program Laporan</span>
                                        <button
                                            style={{ color: 'var(--primary)', background: 'none', border: 'none', fontSize: '0.75rem', cursor: 'pointer' }}
                                            onClick={() => setSelectedActivityIds([])}
                                        >
                                            Reset
                                        </button>
                                    </div>
                                    <div className="flex-col gap-1 flex w-full">
                                        {activities.map(a => (
                                            <label
                                                key={a.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '12px',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    padding: '8px 12px',
                                                    borderRadius: '6px',
                                                    transition: 'background 0.2s',
                                                    background: 'transparent'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <input
                                                    type="checkbox"
                                                    style={{
                                                        marginTop: '4px',
                                                        cursor: 'pointer',
                                                        flexShrink: 0,
                                                        width: '18px',
                                                        height: '18px',
                                                        margin: 0
                                                    }}
                                                    checked={selectedActivityIds.includes(a.id)}
                                                    onChange={() => toggleActivitySelection(a.id)}
                                                />
                                                <span style={{ lineHeight: '1.4', color: '#334155', flexGrow: 1 }}>
                                                    {a.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            className="btn text-sm"
                            style={{ background: '#0f766e', color: 'white', border: 'none' }}
                            onClick={() => {
                                const filename = selectedActivityIds.length === 1
                                    ? `Laporan_${activities.find(a => a.id === selectedActivityIds[0])?.name.replace(/\s+/g, '_')}.pdf`
                                    : `Laporan_${cluster.name}_${selectedActivityIds.length > 0 ? 'Fokus' : 'Lengkap'}.pdf`;
                                exportToPDF('full-report-content', filename);
                                addToast('Laporan PDF sedang diproses...', 'info');
                            }}
                        >
                            <FileText size={16} /> Cetak Laporan
                        </button>

                        <button
                            className="btn text-sm"
                            style={{ background: '#1d4ed8', color: 'white', border: 'none' }}
                            onClick={() => {
                                const filename = `Slide_${cluster.name}_${selectedActivityIds.length > 0 ? 'Fokus' : 'Lengkap'}.pdf`;
                                exportSlidesToPDF('report-slide', filename);
                                addToast('Slide presentasi sedang diproses...', 'info');
                            }}
                        >
                            <Presentation size={16} /> Buat Slide Presentasi
                        </button>
                    </div>
                </div>

                <div id="performance-report" style={{ background: 'white', padding: '10px' }}>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>Kegiatan</th>
                                <th>Target</th>
                                <th>Capaian</th>
                                <th>%</th>
                                <th>Tren</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(activity => {
                                const { percent, value } = calculateAchievement(activity.id, activity.targetValue, activity.polarity);
                                const isGood = activity.polarity === POLARITY.NEGATIVE ? value <= activity.targetValue : value >= activity.targetValue;

                                return (
                                    <tr key={activity.id}>
                                        <td className="font-bold" style={{ textAlign: 'left' }}>{activity.name}</td>
                                        <td>{activity.targetValue}</td>
                                        <td>{value}</td>
                                        <td className="font-bold" style={{ color: isGood ? 'var(--success)' : 'var(--danger)' }}>
                                            {percent}%
                                        </td>
                                        <td style={{ textAlign: 'center', fontSize: '1.2rem' }}>
                                            {isGood ? <span className="text-success">▲</span> :
                                                <span className="text-danger">▼</span>}
                                        </td>
                                        <td>
                                            <span className={`badge ${isGood ? 'badge-success' : 'badge-danger'}`}>
                                                {isGood ? (
                                                    <><CheckCircle2 size={14} /> Tercapai</>
                                                ) : (
                                                    <><AlertCircle size={14} /> Tidak Tercapai</>
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {activities.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        Belum ada data kegiatan. Silakan tambah kegiatan di menu "Input Data".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {activities.length > ITEMS_PER_PAGE && (
                        <div className="sa-pagination">
                            <button
                                className="sa-page-btn"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="sa-page-info">
                                Halaman {currentPage} dari {Math.ceil(activities.length / ITEMS_PER_PAGE)}
                            </span>
                            <button
                                className="sa-page-btn"
                                disabled={currentPage === Math.ceil(activities.length / ITEMS_PER_PAGE)}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden Report Templates for PDF Export */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                opacity: 0,
                pointerEvents: 'none',
                background: 'white',
                zIndex: -999
            }}>
                <ReportTemplate
                    cluster={cluster}
                    month={month}
                    year={year}
                    filterActivityIds={selectedActivityIds}
                />
                <SlideReportTemplate
                    cluster={cluster}
                    month={month}
                    year={year}
                    filterActivityIds={selectedActivityIds}
                />
            </div>
        </div>
    );
};

export default Dashboard;
