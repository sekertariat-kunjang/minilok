import React, { useState, useEffect } from 'react';
import { CLUSTERS, TARGET_LOGIC, MONTHS } from '../constants/appConstants';
import apiService from '../services/ApiService';
import { Plus, Save, Trash2, Edit2 } from 'lucide-react';

const DataEntry = ({ month, year }) => {
    const [activeCluster, setActiveCluster] = useState(CLUSTERS[0]);
    const [activities, setActivities] = useState([]);
    const [achievements, setAchievements] = useState({}); // { activityId: value }
    const [newActivity, setNewActivity] = useState({ name: '', targetValue: '', targetLogic: TARGET_LOGIC.STATIC });
    const [editingActivity, setEditingActivity] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        loadData();
        setCurrentPage(1);
    }, [activeCluster, month, year]);

    const loadData = async () => {
        const act = await apiService.getActivities(activeCluster.id);
        const achList = await apiService.getAchievements(month, year, activeCluster.id);

        setActivities(act);
        const achMap = {};
        achList.forEach(a => achMap[a.activityId] = a.value);
        setAchievements(achMap);
    };

    const handleBulkAdd = async (e) => {
        e.preventDefault();
        const names = bulkText.split('\n').map(n => n.trim()).filter(n => n);
        if (names.length === 0 || !newActivity.targetValue) return;

        for (const name of names) {
            await apiService.addActivity({
                name,
                clusterId: activeCluster.id,
                targetValue: parseFloat(newActivity.targetValue),
                targetLogic: newActivity.targetLogic
            });
        }

        setBulkText('');
        setIsBulkMode(false);
        setShowAddForm(false);
        loadData();
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        if (!newActivity.name || !newActivity.targetValue) return;

        if (editingActivity) {
            await apiService.updateActivity(editingActivity.id, {
                ...newActivity,
                targetValue: parseFloat(newActivity.targetValue)
            });
            setEditingActivity(null);
        } else {
            await apiService.addActivity({
                ...newActivity,
                clusterId: activeCluster.id,
                targetValue: parseFloat(newActivity.targetValue)
            });
        }

        setNewActivity({ name: '', targetValue: '', targetLogic: TARGET_LOGIC.STATIC });
        setShowAddForm(false);
        loadData();
    };

    const handleDeleteActivity = async (id) => {
        if (window.confirm('Hapus kegiatan ini? Semua data capaian terkait juga akan terhapus.')) {
            await apiService.deleteActivity(id);
            loadData();
        }
    };

    const startEdit = (activity) => {
        setEditingActivity(activity);
        setNewActivity({
            name: activity.name,
            targetValue: activity.targetValue,
            targetLogic: activity.targetLogic
        });
        setShowAddForm(true);
    };

    const handleSaveAchievement = async (activityId, value) => {
        const val = parseFloat(value) || 0;
        await apiService.saveAchievement({
            activityId,
            month,
            year,
            value: val
        });
        setAchievements(prev => ({ ...prev, [activityId]: val }));
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

            <div className="grid grid-cols-2" style={{ gridTemplateColumns: 'minmax(0, 1fr) 350px' }}>
                {/* Main Entry Table */}
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="card-title">Isian Capaian - {MONTHS[month]} {year}</h3>
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
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Kegiatan</th>
                                <th>Target</th>
                                <th style={{ width: '150px' }}>Capaian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const uniqueActivities = activities.reduce((acc, current) => {
                                    if (!acc.find(item => item.id === current.id)) {
                                        return acc.concat([current]);
                                    }
                                    return acc;
                                }, []);
                                return uniqueActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(activity => (
                                    <tr key={activity.id}>
                                        <td>{activity.name}</td>
                                        <td>{activity.targetValue}</td>
                                        <td>
                                            <input
                                                type="number"
                                                value={achievements[activity.id] || ''}
                                                onChange={(e) => handleSaveAchievement(activity.id, e.target.value)}
                                                placeholder="0"
                                                style={{ padding: '0.4rem' }}
                                            />
                                        </td>
                                    </tr>
                                ));
                            })()}
                            {activities.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        Belum ada daftar kegiatan untuk kluster ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {activities.length > itemsPerPage && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                            <button
                                className="btn btn-outline"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                            >
                                Sebelumnya
                            </button>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                Halaman {currentPage} dari {Math.ceil(activities.length / itemsPerPage)}
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
                </div>

                {/* Sidebar: Add Activity */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title" style={{ fontSize: '1rem' }}>
                            {editingActivity ? 'Edit Kegiatan' : 'Kelola Kegiatan'}
                        </h3>
                    </div>

                    {!showAddForm ? (
                        <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => {
                            setShowAddForm(true);
                            setIsBulkMode(false);
                        }}>
                            <Plus size={16} /> Tambah Kegiatan
                        </button>
                    ) : (
                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            {!editingActivity && (
                                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: '#e2e8f0', padding: '0.25rem', borderRadius: '6px' }}>
                                    <button
                                        className={`btn ${!isBulkMode ? 'btn-primary' : ''}`}
                                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', background: !isBulkMode ? '' : 'transparent', color: !isBulkMode ? '' : '#64748b' }}
                                        onClick={() => setIsBulkMode(false)}
                                    >
                                        Satuan
                                    </button>
                                    <button
                                        className={`btn ${isBulkMode ? 'btn-primary' : ''}`}
                                        style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', background: isBulkMode ? '' : 'transparent', color: isBulkMode ? '' : '#64748b' }}
                                        onClick={() => setIsBulkMode(true)}
                                    >
                                        Bulk (Banyak)
                                    </button>
                                </div>
                            )}

                            <form onSubmit={isBulkMode ? handleBulkAdd : handleAddActivity}>
                                {!isBulkMode ? (
                                    <div className="form-group">
                                        <label>Nama Kegiatan</label>
                                        <input
                                            type="text"
                                            value={newActivity.name}
                                            onChange={e => setNewActivity({ ...newActivity, name: e.target.value })}
                                            placeholder="Contoh: Cakupan Imunisasi Dasar"
                                            required
                                        />
                                    </div>
                                ) : (
                                    <div className="form-group">
                                        <label>Daftar Nama Kegiatan (Satu per baris)</label>
                                        <textarea
                                            value={bulkText}
                                            onChange={e => setBulkText(e.target.value)}
                                            placeholder="Cakupan Imunisasi A&#10;Cakupan Imunisasi B&#10;Cakupan Imunisasi C"
                                            rows={5}
                                            required
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Target {isBulkMode && '(Untuk Semua)'}</label>
                                    <input
                                        type="number"
                                        value={newActivity.targetValue}
                                        onChange={e => setNewActivity({ ...newActivity, targetValue: e.target.value })}
                                        placeholder="100"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Pola Data</label>
                                    <select
                                        value={newActivity.targetLogic}
                                        onChange={e => setNewActivity({ ...newActivity, targetLogic: e.target.value })}
                                    >
                                        <option value={TARGET_LOGIC.STATIC}>Bulanan (Tetap)</option>
                                        <option value={TARGET_LOGIC.CUMULATIVE}>Akumulatif (Linear)</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                        {editingActivity ? 'Update' : (isBulkMode ? 'Tambah Semua' : 'Simpan')}
                                    </button>
                                    <button type="button" className="btn btn-outline" onClick={() => {
                                        setShowAddForm(false);
                                        setEditingActivity(null);
                                        setIsBulkMode(false);
                                        setNewActivity({ name: '', targetValue: '', targetLogic: TARGET_LOGIC.STATIC });
                                    }}>Batal</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div style={{ marginTop: '2rem' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>
                            Daftar Kegiatan ({activities.length})
                        </p>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {activities.map(a => (
                                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '0.875rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button
                                            className="btn btn-outline"
                                            style={{ padding: '0.25rem', border: 'none' }}
                                            onClick={() => startEdit(a)}
                                            title="Edit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            style={{ padding: '0.25rem', border: 'none', color: 'var(--danger)' }}
                                            onClick={() => handleDeleteActivity(a.id)}
                                            title="Hapus"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataEntry;
