import React, { useState, useEffect } from 'react';
import { CLUSTERS } from '../constants/minlokConstants';
import { MONTHS } from '../../../core/constants/globalConstants';
import apiService from '../services/ApiService';
import { deduplicateByProperty } from '../../../core/utils/DataUtils';
import { AlertCircle, Save } from 'lucide-react';

const PDCA = ({ month, year, selectedActivityIds }) => {
    const [activeCluster, setActiveCluster] = useState(CLUSTERS[0]);
    const [activities, setActivities] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [pdcaData, setPdcaData] = useState({}); // { activityId: { plan, do, check, action } }
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
        setCurrentPage(1);
        setSelectedActivity(null);
    }, [activeCluster, month, year]);

    const loadData = async () => {
        setLoading(true);
        try {
            const act = await apiService.getActivities(activeCluster.id);
            const ach = await apiService.getAchievements(month, year, activeCluster.id);
            const pdcas = await apiService.getBulkPDCA(month, year, activeCluster.id);

            setActivities(act);
            setAchievements(ach);

            // Convert bulk PDCA list to map
            const pdcaMap = {};
            pdcas.forEach(p => {
                pdcaMap[p.activityId] = p;
            });
            setPdcaData(pdcaMap);
        } catch (error) {
            console.error("Error loading PDCA data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredActivities = React.useMemo(() => {
        // Step 1: Filter by cluster activities (already filtered in loadData, but let's be safe)
        // Actually, we show only active cluster's activities.

        // Step 2: Handle Dashboard selection
        let displayList = activities;
        if (selectedActivityIds && selectedActivityIds.length > 0) {
            displayList = activities.filter(a => selectedActivityIds.includes(a.id));
        }

        // Deduplicate
        const unique = deduplicateByProperty(displayList);

        return unique.map(a => {
            const ach = achievements.find(ach => ach.activityId === a.id);
            const val = ach ? ach.value : 0;

            // Logic for failure based on polarity
            let isFailed = false;
            if (a.polarity === 'negative') {
                isFailed = val > a.targetValue;
            } else {
                isFailed = val < a.targetValue;
            }

            return { ...a, isFailed, achievementValue: val };
        });
    }, [activities, achievements, selectedActivityIds]);

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
                        <h3 className="card-title">Daftar Kegiatan</h3>
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
                        {loading ? (
                            <p style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</p>
                        ) : filteredActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(a => (
                            <button
                                key={a.id}
                                className={`btn ${selectedActivity?.id === a.id ? 'btn-primary' : 'btn-outline'}`}
                                style={{
                                    justifyContent: 'space-between',
                                    textAlign: 'left',
                                    borderLeft: a.isFailed ? '4px solid var(--danger)' : ''
                                }}
                                onClick={() => setSelectedActivity(a)}
                            >
                                <span style={{ color: a.isFailed ? 'var(--danger)' : 'inherit', fontWeight: a.isFailed ? '600' : 'normal' }}>
                                    {a.name}
                                </span>
                                {a.isFailed && <AlertCircle size={14} color="var(--danger)" />}
                            </button>
                        ))}
                        {!loading && filteredActivities.length === 0 && (
                            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                {selectedActivityIds?.length > 0
                                    ? "Program yang dipilih tidak ada dalam kluster ini."
                                    : "Tidak ada data kegiatan."}
                            </p>
                        )}
                    </div>

                    {/* Pagination for PDCA List */}
                    {filteredActivities.length > itemsPerPage && (
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
                                {currentPage}/{Math.ceil(filteredActivities.length / itemsPerPage)}
                            </span>
                            <button
                                className="btn btn-outline"
                                disabled={currentPage >= Math.ceil(filteredActivities.length / itemsPerPage)}
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <label>PLAN (Perencanaan)</label>
                                        <span style={{ fontSize: '0.7rem', color: (pdcaData[selectedActivity.id]?.plan?.length || 0) >= 200 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                            {pdcaData[selectedActivity.id]?.plan?.length || 0}/200
                                        </span>
                                    </div>
                                    <textarea
                                        rows="2"
                                        maxLength="200"
                                        value={pdcaData[selectedActivity.id]?.plan || ''}
                                        onChange={e => updatePdcaField(selectedActivity.id, 'plan', e.target.value)}
                                        placeholder="Analisis penyebab dan rencana perbaikan..."
                                    />
                                </div>
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <label>DO (Pelaksanaan)</label>
                                        <span style={{ fontSize: '0.7rem', color: (pdcaData[selectedActivity.id]?.do?.length || 0) >= 200 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                            {pdcaData[selectedActivity.id]?.do?.length || 0}/200
                                        </span>
                                    </div>
                                    <textarea
                                        rows="2"
                                        maxLength="200"
                                        value={pdcaData[selectedActivity.id]?.do || ''}
                                        onChange={e => updatePdcaField(selectedActivity.id, 'do', e.target.value)}
                                        placeholder="Langkah-langka yang diambil..."
                                    />
                                </div>
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <label>CHECK (Pemeriksaan)</label>
                                        <span style={{ fontSize: '0.7rem', color: (pdcaData[selectedActivity.id]?.check?.length || 0) >= 200 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                            {pdcaData[selectedActivity.id]?.check?.length || 0}/200
                                        </span>
                                    </div>
                                    <textarea
                                        rows="2"
                                        maxLength="200"
                                        value={pdcaData[selectedActivity.id]?.check || ''}
                                        onChange={e => updatePdcaField(selectedActivity.id, 'check', e.target.value)}
                                        placeholder="Hasil dari langkah perbaikan..."
                                    />
                                </div>
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <label>ACTION (Tindak Lanjut)</label>
                                        <span style={{ fontSize: '0.7rem', color: (pdcaData[selectedActivity.id]?.action?.length || 0) >= 200 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                            {pdcaData[selectedActivity.id]?.action?.length || 0}/200
                                        </span>
                                    </div>
                                    <textarea
                                        rows="2"
                                        maxLength="200"
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
