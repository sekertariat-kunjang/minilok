import React, { useState } from 'react';
import { X, DollarSign, Loader2 } from 'lucide-react';
import financeService from '../services/FinanceService';

const CreateActivityModal = ({ onClose, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [isBulk, setIsBulk] = useState(false);

    // Single Mode State
    const [title, setTitle] = useState('');
    const [budget, setBudget] = useState('');
    const [description, setDescription] = useState('');

    // Bulk Mode State
    const [bulkText, setBulkText] = useState('');

    const parseBulkData = () => {
        if (!bulkText.trim()) return [];

        const lines = bulkText.trim().split('\n');
        return lines.map(line => {
            const [title, budget, description] = line.split('\t');
            return {
                title: title?.trim(),
                budget: Number(budget?.replace(/[^0-9]/g, '')) || 0,
                description: description?.trim() || ''
            };
        }).filter(item => item.title); // Must have a title
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isBulk) {
                const activities = parseBulkData();
                if (activities.length === 0) {
                    alert('Tidak ada data kegiatan yang valid ditemukan.');
                    return;
                }
                await financeService.createBulkActivities(activities);
            } else {
                await financeService.createActivity({
                    title,
                    budget: Number(budget),
                    description
                });
            }
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Failed to create activity:', error);
            alert('Gagal membuat kegiatan: ' + (error.message || error.details || 'Error tidak diketahui'));
        } finally {
            setLoading(false);
        }
    };

    const detectedCount = isBulk ? parseBulkData().length : 0;

    return (
        <div className="sa-modal-overlay">
            <div className="sa-modal" style={{ maxWidth: isBulk ? '650px' : '500px' }}>
                <div className="modal-header">
                    <h2>{isBulk ? 'Tambah Bulk Kegiatan' : 'Buat Kegiatan Baru'}</h2>
                    <button className="close-btn" onClick={onClose}><X /></button>
                </div>

                <div className="modal-tabs" style={{ display: 'flex', gap: '1rem', padding: '0 1.5rem', marginBottom: '1rem' }}>
                    <button
                        className={`tab-btn ${!isBulk ? 'active' : ''}`}
                        onClick={() => setIsBulk(false)}
                        style={{ background: 'none', border: 'none', padding: '0.5rem 0', fontWeight: '700', cursor: 'pointer', color: !isBulk ? 'var(--primary)' : 'var(--text-muted)', borderBottom: !isBulk ? '2px solid var(--primary)' : 'none' }}
                    >
                        Single Entry
                    </button>
                    <button
                        className={`tab-btn ${isBulk ? 'active' : ''}`}
                        onClick={() => setIsBulk(true)}
                        style={{ background: 'none', border: 'none', padding: '0.5rem 0', fontWeight: '700', cursor: 'pointer', color: isBulk ? 'var(--primary)' : 'var(--text-muted)', borderBottom: isBulk ? '2px solid var(--primary)' : 'none' }}
                    >
                        Bulk (Excel Copy-Paste)
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {!isBulk ? (
                        <>
                            <div className="form-group">
                                <label>Judul Kegiatan</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Contoh: Belanja Bahan Bakar Pusling"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Pagu Anggaran (Rp)</label>
                                <div className="input-with-icon">
                                    <DollarSign size={18} />
                                    <input
                                        required
                                        type="number"
                                        placeholder="0"
                                        value={budget}
                                        onChange={e => setBudget(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Deskripsi/Tujuan Kegiatan</label>
                                <textarea
                                    placeholder="Contoh: Untuk mendukung operasional Puskesmas Keliling..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="form-group">
                            <label>Paste Data Excel (Judul [TAB] Pagu [TAB] Deskripsi)</label>
                            <textarea
                                required
                                placeholder="Belanja ATK	5000000	Kebutuhan kantor&#10;Transport	2500000	Monitoring Desa"
                                value={bulkText}
                                onChange={e => setBulkText(e.target.value)}
                                rows={10}
                                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Format: Setiap baris berisi data yang dipisahkan oleh tombol Tab.
                                {detectedCount > 0 && <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}> {detectedCount} kegiatan terdeteksi.</span>}
                            </p>
                        </div>
                    )}

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 className="spin" /> : isBulk ? 'Buat Bulk Card' : 'Buat Card'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateActivityModal;
