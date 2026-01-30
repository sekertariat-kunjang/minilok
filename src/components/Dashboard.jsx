import React, { useState, useEffect } from 'react';
import { CLUSTERS, TARGET_LOGIC } from '../constants/appConstants';
import apiService from '../services/ApiService';
import { AlertCircle, CheckCircle2, TrendingUp, Download, ChevronDown, ChevronUp, Monitor, FileText, Presentation } from 'lucide-react';
import { exportToPDF, exportSlidesToPDF } from '../services/ReportService';
import ReportTemplate from './ReportTemplate';
import SlideReportTemplate from './SlideReportTemplate';

const Dashboard = ({ month, year, cluster, onClusterChange }) => {
    const [activities, setActivities] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [selectedActivityIds, setSelectedActivityIds] = useState([]);

    useEffect(() => {
        loadData();
        setSelectedActivityIds([]); // Reset filter when cluster changes
    }, [cluster, month, year]);

    const loadData = async () => {
        const act = await apiService.getActivities(cluster.id);
        const ach = await apiService.getAchievements(month, year, cluster.id);
        setActivities(act);
        setAchievements(ach);
    };

    const calculateAchievement = (activityId, targetValue, targetLogic) => {
        const ach = achievements.find(a => a.activityId === activityId);
        if (!ach) return { percent: 0, value: 0 };

        // Simplification for now: targetValue vs current month value
        const percent = (ach.value / targetValue) * 100;
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

    return (
        <div>
            {/* ... cluster tabs remain same ... */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
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
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Total Kegiatan</p>
                    <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{activities.length}</h3>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Tercapai</p>
                    <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>
                        {activities.filter(a => calculateAchievement(a.id, a.targetValue, a.targetLogic).percent >= 100).length}
                    </h3>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Belum Tercapai</p>
                    <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>
                        {activities.filter(a => calculateAchievement(a.id, a.targetValue, a.targetLogic).percent < 100).length}
                    </h3>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Rincian Kinerja - {cluster.name}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>

                        {/* Multi-Select Dropdown */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className="btn btn-outline"
                                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                onClick={() => setShowFilter(!showFilter)}
                            >
                                {selectedActivityIds.length === 0
                                    ? 'Semua Program'
                                    : `${selectedActivityIds.length} Program Dipilih`}
                                {showFilter ? <ChevronUp size={14} style={{ marginLeft: '5px' }} /> : <ChevronDown size={14} style={{ marginLeft: '5px' }} />}
                            </button>

                            {showFilter && (
                                <div style={{
                                    position: 'absolute',
                                    top: '110%',
                                    right: 0,
                                    width: '400px',
                                    maxHeight: '400px',
                                    background: 'white',
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    zIndex: 100,
                                    padding: '1rem',
                                    overflowY: 'auto'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '5px' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b' }}>Pilih Program Laporan</span>
                                        <button
                                            style={{ color: 'var(--primary)', background: 'none', border: 'none', fontSize: '0.75rem', cursor: 'pointer' }}
                                            onClick={() => setSelectedActivityIds([])}
                                        >
                                            Reset
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {activities.map(a => (
                                            <label
                                                key={a.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '10px',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    padding: '6px 8px',
                                                    borderRadius: '4px'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    style={{ marginTop: '4px' }}
                                                    checked={selectedActivityIds.includes(a.id)}
                                                    onChange={() => toggleActivitySelection(a.id)}
                                                />
                                                <span style={{ lineHeight: '1.4' }}>{a.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            className="btn"
                            style={{
                                background: '#0f766e',
                                color: 'white',
                                fontSize: '0.8rem',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onClick={() => {
                                const filename = selectedActivityIds.length === 1
                                    ? `Laporan_${activities.find(a => a.id === selectedActivityIds[0])?.name.replace(/\s+/g, '_')}.pdf`
                                    : `Laporan_${cluster.name}_${selectedActivityIds.length > 0 ? 'Fokus' : 'Lengkap'}.pdf`;
                                exportToPDF('full-report-content', filename);
                            }}
                        >
                            <FileText size={16} /> Cetak Laporan
                        </button>

                        <button
                            className="btn"
                            style={{
                                background: '#1d4ed8',
                                color: 'white',
                                fontSize: '0.8rem',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onClick={() => {
                                const filename = `Slide_${cluster.name}_${selectedActivityIds.length > 0 ? 'Fokus' : 'Lengkap'}.pdf`;
                                exportSlidesToPDF('report-slide', filename);
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
                                <th>Kegiatan</th>
                                <th>Target</th>
                                <th>Capaian</th>
                                <th>%</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map(activity => {
                                const { percent, value } = calculateAchievement(activity.id, activity.targetValue, activity.targetLogic);
                                const isAchieved = percent >= 100;

                                return (
                                    <tr key={activity.id}>
                                        <td style={{ fontWeight: '500' }}>{activity.name}</td>
                                        <td>{activity.targetValue}</td>
                                        <td>{value}</td>
                                        <td style={{ fontWeight: '600', color: isAchieved ? 'var(--success)' : 'var(--danger)' }}>
                                            {percent}%
                                        </td>
                                        <td>
                                            <span className={`badge ${isAchieved ? 'badge-success' : 'badge-danger'}`}>
                                                {isAchieved ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <CheckCircle2 size={14} /> Tercapai
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <AlertCircle size={14} /> Tidak Tercapai
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {activities.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        Belum ada data kegiatan. Silakan tambah kegiatan di menu "Input Data".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden Report Templates for PDF Export - Localized state sync */}
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
