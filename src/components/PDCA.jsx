import React, { useState, useEffect } from 'react';
import { CLUSTERS, MONTHS } from '../constants/appConstants';
import apiService from '../services/ApiService';
import { AlertCircle, Save } from 'lucide-react';

const PDCA = ({ month, year }) => {
    const [activeCluster, setActiveCluster] = useState(CLUSTERS[0]);
    const [activities, setActivities] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [pdcaData, setPdcaData] = useState({}); // { activityId: { plan, do, check, action } }
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        loadData();
        setCurrentPage(1);
        setSelectedActivity(null);
    }, [activeCluster, month, year]);

    const loadData = async () => {
        const act = await apiService.getActivities(activeCluster.id);
        const ach = await apiService.getAchievements(month, year, activeCluster.id);
        setActivities(act);
        setAchievements(ach);

        // Load existing PDCA for all activities in this cluster
        const pdcaMap = {};
        for (const a of act) {
            const p = await apiService.getPDCA(a.id, month, year);
            if (p) pdcaMap[a.id] = p;
        }
        setPdcaData(pdcaMap);
    };

    const failedActivities = React.useMemo(() => {
        const unique = activities.reduce((acc, current) => {
            const x = acc.find(item => item.id === current.id);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, []);

        return unique.filter(a => {
            const ach = achievements.find(ach => ach.activityId === a.id);
            if (!ach) return true;
            return (ach.value / a.targetValue) * 100 < 100;
        });
    }, [activities, achievements]);

    const handleSavePDCA = async (e) => {
        e.preventDefault();
        if (!selectedActivity) return;

        const currentPdca = pdcaData[selectedActivity.id] || {};
        const entry = {
            activityId: selectedActivity.id,
            month,
            year,
            plan: currentPdca.plan || '',
            do: currentPdca.do || '',
            check: currentPdca.check || '',
            action: currentPdca.action || ''
        };

        await apiService.savePDCA(entry);
        alert('PDCA berhasil disimpan!');
    };

    const updatePdcaField = (activityId, field, value) => {
        setPdcaData(prev => ({
            ...prev,
            [activityId]: {
                ...(prev[activityId] || { plan: '', do: '', check: '', action: '' }),
                [field]: value
            }
        }));
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

            <div className="grid grid-cols-2" style={{ gridTemplateColumns: '350px minmax(0, 1fr)' }}>
                {/* List of failed activities */}
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="card-title">Tidak Tercapai</h3>
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
                            <option value={9999}>All</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {failedActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(a => (
                            <button
                                key={a.id}
                                className={`btn ${selectedActivity?.id === a.id ? 'btn-primary' : 'btn-outline'}`}
                                style={{ justifyContent: 'space-between', textAlign: 'left' }}
                                onClick={() => setSelectedActivity(a)}
                            >
                                <span>{a.name}</span>
                                <AlertCircle size={14} />
                            </button>
                        ))}
                        {failedActivities.length === 0 && (
                            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                Semua kegiatan tercapai atau data belum diisi.
                            </p>
                        )}
                    </div>

                    {/* Pagination for PDCA List */}
                    {failedActivities.length > itemsPerPage && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', padding: '0.5rem', borderTop: '1px solid var(--border)' }}>
                            <button
                                className="btn btn-outline"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                                &lt;
                            </button>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {currentPage}/{Math.ceil(failedActivities.length / itemsPerPage)}
                            </span>
                            <button
                                className="btn btn-outline"
                                disabled={currentPage >= Math.ceil(failedActivities.length / itemsPerPage)}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                                &gt;
                            </button>
                        </div>
                    )}
                </div>

                {/* PDCA Form */}
                <div className="card">
                    {selectedActivity ? (
                        <>
                            <div className="card-header">
                                <h3 className="card-title">Form PDCA: {selectedActivity.name}</h3>
                            </div>
                            <form onSubmit={handleSavePDCA}>
                                <div className="form-group">
                                    <label>PLAN (Perencanaan)</label>
                                    <textarea
                                        rows="2"
                                        value={pdcaData[selectedActivity.id]?.plan || ''}
                                        onChange={e => updatePdcaField(selectedActivity.id, 'plan', e.target.value)}
                                        placeholder="Analisis penyebab dan rencana perbaikan..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>DO (Pelaksanaan)</label>
                                    <textarea
                                        rows="2"
                                        value={pdcaData[selectedActivity.id]?.do || ''}
                                        onChange={e => updatePdcaField(selectedActivity.id, 'do', e.target.value)}
                                        placeholder="Langkah-langka yang diambil..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>CHECK (Pemeriksaan)</label>
                                    <textarea
                                        rows="2"
                                        value={pdcaData[selectedActivity.id]?.check || ''}
                                        onChange={e => updatePdcaField(selectedActivity.id, 'check', e.target.value)}
                                        placeholder="Hasil dari langkah perbaikan..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ACTION (Tindak Lanjut)</label>
                                    <textarea
                                        rows="2"
                                        value={pdcaData[selectedActivity.id]?.action || ''}
                                        onChange={e => updatePdcaField(selectedActivity.id, 'action', e.target.value)}
                                        placeholder="Standardisasi langkah perbaikan..."
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={16} /> Simpan PDCA
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                            Pilih kegiatan di sebelah kiri untuk mengisi PDCA.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PDCA;
