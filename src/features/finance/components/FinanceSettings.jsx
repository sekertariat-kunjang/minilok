import React, { useState, useEffect } from 'react';
import { User, Trash2, Plus, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import financeService from '../services/FinanceService';

const FinanceSettings = () => {
    const [personnel, setPersonnel] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isBulk, setIsBulk] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('PETUGAS');
    const [submitting, setSubmitting] = useState(false);

    // Pagination State
    const [pagePetugas, setPagePetugas] = useState(1);
    const [pageEvaluator, setPageEvaluator] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        loadPersonnel();
    }, []);

    const loadPersonnel = async () => {
        try {
            setLoading(true);
            const data = await financeService.getPersonnel();
            setPersonnel(data);
        } catch (error) {
            console.error('Failed to load personnel:', error);
        } finally {
            setLoading(false);
        }
    };

    const parseBulkPersonnel = () => {
        if (!bulkText.trim()) return [];
        const lines = bulkText.trim().split('\n');
        return lines.map(line => {
            const parts = line.split('\t');
            const name = parts[0]?.trim();
            let role = parts[1]?.trim()?.toUpperCase();

            // Flexible role mapping
            if (role === 'P' || role === 'PETUGAS') role = 'PETUGAS';
            else if (role === 'E' || role === 'EVALUATOR') role = 'EVALUATOR';
            else role = 'PETUGAS'; // Default

            return { name, role };
        }).filter(p => p.name);
    };

    const handleAdd = async (e) => {
        e.preventDefault();

        try {
            setSubmitting(true);
            if (isBulk) {
                const members = parseBulkPersonnel();
                if (members.length === 0) {
                    alert('Tidak ada data personel yang valid ditemukan.');
                    return;
                }
                await financeService.addBulkPersonnel(members);
                setBulkText('');
            } else {
                if (!newName.trim()) return;
                await financeService.addPersonnel(newName, newRole);
                setNewName('');
            }
            loadPersonnel();
        } catch (error) {
            console.error('Failed to add personnel:', error);
            alert('Gagal menambah personel');
        } finally {
            setSubmitting(false);
        }
    };

    const detectedCount = isBulk ? parseBulkPersonnel().length : 0;

    const handleDelete = async (id) => {
        if (!confirm('Hapus personel ini?')) return;
        try {
            await financeService.deletePersonnel(id);
            loadPersonnel();
        } catch (error) {
            alert('Gagal menghapus personel');
        }
    };

    if (loading) return <div className="loading-state">Memuat data pengaturan...</div>;

    const allPetugas = personnel.filter(p => p.role === 'PETUGAS');
    const allEvaluators = personnel.filter(p => p.role === 'EVALUATOR');

    // Pagination Logic
    const totalPagesPetugas = Math.max(1, Math.ceil(allPetugas.length / itemsPerPage));
    const totalPagesEvaluator = Math.max(1, Math.ceil(allEvaluators.length / itemsPerPage));

    const currentPetugas = allPetugas.slice((pagePetugas - 1) * itemsPerPage, pagePetugas * itemsPerPage);
    const currentEvaluators = allEvaluators.slice((pageEvaluator - 1) * itemsPerPage, pageEvaluator * itemsPerPage);

    return (
        <div className="finance-settings-container">
            <div className="settings-card add-personnel-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0 }}>Tambah Personel Baru</h3>
                    <div className="modal-tabs" style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className={`tab-btn ${!isBulk ? 'active' : ''}`}
                            onClick={() => setIsBulk(false)}
                            style={{ background: 'none', border: 'none', padding: '0.25rem 0', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', color: !isBulk ? 'var(--primary)' : 'var(--text-muted)', borderBottom: !isBulk ? '2px solid var(--primary)' : 'none' }}
                        >
                            Single
                        </button>
                        <button
                            className={`tab-btn ${isBulk ? 'active' : ''}`}
                            onClick={() => setIsBulk(true)}
                            style={{ background: 'none', border: 'none', padding: '0.25rem 0', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', color: isBulk ? 'var(--primary)' : 'var(--text-muted)', borderBottom: isBulk ? '2px solid var(--primary)' : 'none' }}
                        >
                            Bulk (Excel)
                        </button>
                    </div>
                </div>

                <form onSubmit={handleAdd} className="settings-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'stretch' }}>
                    {!isBulk ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '1.5rem', alignItems: 'flex-end' }}>
                            <div className="form-group">
                                <label>Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Masukkan nama..."
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Role plotting</label>
                                <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                                    <option value="PETUGAS">Petugas (Pelaksana)</option>
                                    <option value="EVALUATOR">Evaluator (Pemeriksa)</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ height: '42px', marginBottom: '4px' }}>
                                {submitting ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
                                <span>Tambah</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Paste Data Excel (Nama [TAB] Role)</label>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                    Role: <strong>PETUGAS</strong> atau <strong>EVALUATOR</strong>. Jika kosong, default ke Petugas.
                                </p>
                                <textarea
                                    required
                                    placeholder="Budi Santoso	PETUGAS&#10;Siti Aminah	EVALUATOR"
                                    value={bulkText}
                                    onChange={e => setBulkText(e.target.value)}
                                    rows={5}
                                    style={{ fontFamily: 'monospace', fontSize: '0.85rem', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                                />
                                {detectedCount > 0 && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginTop: '0.5rem' }}>
                                        {detectedCount} personel terdeteksi.
                                    </p>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
                                {submitting ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
                                <span>Tambah Bulk Personel</span>
                            </button>
                        </>
                    )}
                </form>
            </div>

            <div className="settings-grid">
                <div className="settings-card">
                    <div className="card-header">
                        <User size={18} />
                        <h3>Daftar Petugas</h3>
                    </div>
                    <div className="personnel-list">
                        {currentPetugas.length === 0 && <p className="empty-msg">Belum ada petugas</p>}
                        {currentPetugas.map(p => (
                            <div key={p.id} className="personnel-item">
                                <span>{p.name}</span>
                                <button className="delete-btn" onClick={() => handleDelete(p.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    {totalPagesPetugas > 1 && (
                        <div className="pagination">
                            <button
                                disabled={pagePetugas === 1}
                                onClick={() => setPagePetugas(p => p - 1)}
                                className="page-btn"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="page-info">{pagePetugas} / {totalPagesPetugas}</span>
                            <button
                                disabled={pagePetugas === totalPagesPetugas}
                                onClick={() => setPagePetugas(p => p + 1)}
                                className="page-btn"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="settings-card">
                    <div className="card-header">
                        <AlertCircle size={18} />
                        <h3>Daftar Evaluator</h3>
                    </div>
                    <div className="personnel-list">
                        {currentEvaluators.length === 0 && <p className="empty-msg">Belum ada evaluator</p>}
                        {currentEvaluators.map(p => (
                            <div key={p.id} className="personnel-item">
                                <span>{p.name}</span>
                                <button className="delete-btn" onClick={() => handleDelete(p.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    {totalPagesEvaluator > 1 && (
                        <div className="pagination">
                            <button
                                disabled={pageEvaluator === 1}
                                onClick={() => setPageEvaluator(p => p - 1)}
                                className="page-btn"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="page-info">{pageEvaluator} / {totalPagesEvaluator}</span>
                            <button
                                disabled={pageEvaluator === totalPagesEvaluator}
                                onClick={() => setPageEvaluator(p => p + 1)}
                                className="page-btn"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinanceSettings;
