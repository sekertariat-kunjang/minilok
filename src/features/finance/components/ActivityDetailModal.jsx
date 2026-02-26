import React, { useState, useEffect } from 'react';
import {
    X, User, Calendar, DollarSign,
    Link, Copy, Check, ArrowRight,
    AlertCircle, FileText, Camera, Clock, Trash2
} from 'lucide-react';
import { FINANCE_STATUS, STATUS_LABELS } from '../constants/financeConstants';
import financeService from '../services/FinanceService';

const ActivityDetailModal = ({ activity, onClose, onRefresh }) => {
    const [personnel, setPersonnel] = useState([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(null);
    const [formData, setFormData] = useState({
        pptk_name: activity.pptk_name || 'Bendahara Pengeluaran Pembantu',
        petugas_name: activity.petugas_name || '',
        evaluator_name: activity.evaluator_name || '',
        activity_date: activity.activity_date || '',
    });

    useEffect(() => {
        loadPersonnel();
    }, []);

    const loadPersonnel = async () => {
        try {
            const data = await financeService.getPersonnel();
            setPersonnel(data);
        } catch (error) {
            console.error('Failed to load personnel:', error);
        }
    };

    const handleCopy = (text, type) => {
        const fullUrl = `${window.location.origin}${window.location.pathname}?${type}_token=${text}`;
        navigator.clipboard.writeText(fullUrl);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleAction = async (nextStatus) => {
        try {
            setLoading(true);
            await financeService.transitionStatus(activity.id, nextStatus, formData);
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Action failed:', error);
            alert('Gagal memproses aksi: ' + (error.message || error.details || 'Error tidak diketahui'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus kegiatan "${activity.title}"?`)) {
            return;
        }

        try {
            setLoading(true);
            await financeService.deleteActivity(activity.id);
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Gagal menghapus kegiatan: ' + (error.message || error.details || 'Error tidak diketahui'));
        } finally {
            setLoading(false);
        }
    };

    const renderActionContent = () => {
        switch (activity.status) {
            case FINANCE_STATUS.DRAFT:
                return (
                    <div className="action-section">
                        <button className="btn btn-primary btn-block" onClick={() => handleAction(FINANCE_STATUS.PENDING_PPTK)}>
                            Submit ke PPTK <ArrowRight size={18} />
                        </button>
                    </div>
                );
            case FINANCE_STATUS.PENDING_PPTK:
                return (
                    <div className="action-section">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>PPTK (Pejabat Pelaksana Teknis Kegiatan)</label>
                                <input
                                    type="text"
                                    value={formData.pptk_name}
                                    onChange={e => setFormData({ ...formData, pptk_name: e.target.value })}
                                    placeholder="Masukkan nama atau jabatan PPTK..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Petugas (Pelaksana)</label>
                                <select
                                    value={formData.petugas_name}
                                    onChange={e => setFormData({ ...formData, petugas_name: e.target.value })}
                                    required
                                >
                                    <option value="">-- Pilih Petugas --</option>
                                    {personnel.filter(p => p.role === 'PETUGAS').map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Evaluator</label>
                                <select
                                    value={formData.evaluator_name}
                                    onChange={e => setFormData({ ...formData, evaluator_name: e.target.value })}
                                    required
                                >
                                    <option value="">-- Pilih Evaluator --</option>
                                    {personnel.filter(p => p.role === 'EVALUATOR').map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tanggal Kegiatan</label>
                                <input type="date" value={formData.activity_date} onChange={e => setFormData({ ...formData, activity_date: e.target.value })} />
                            </div>
                        </div>
                        <button
                            className="btn btn-primary btn-block"
                            onClick={() => {
                                if (!formData.petugas_name || !formData.evaluator_name) {
                                    alert('Mohon pilih Petugas dan Evaluator');
                                    return;
                                }
                                handleAction(FINANCE_STATUS.PENDING_REPORT);
                            }}
                        >
                            Simpan & Kirim ke Petugas <ArrowRight size={18} />
                        </button>
                        <p className="hint text-center mt-2">Pastikan nama petugas sudah ada di Pengaturan Keuangan</p>
                    </div>
                );
            case FINANCE_STATUS.PENDING_REPORT:
                return (
                    <div className="action-section">
                        <div className="share-link-box">
                            <label>Link Petugas (Copy & Kirim ke WhatsApp)</label>
                            <div className="copy-input">
                                <input readOnly value={activity.petugas_token} />
                                <button onClick={() => handleCopy(activity.petugas_token, 'petugas')}>
                                    {copied === 'petugas' ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                        </div>
                        <p className="status-note"><Clock size={16} /> Menunggu Petugas upload laporan...</p>
                    </div>
                );
            case FINANCE_STATUS.PENDING_EVALUATION:
                return (
                    <div className="action-section">
                        <div className="share-link-box">
                            <label>Link Evaluator (Copy & Kirim ke WhatsApp)</label>
                            <div className="copy-input">
                                <input readOnly value={activity.evaluator_token} />
                                <button onClick={() => handleCopy(activity.evaluator_token, 'evaluator')}>
                                    {copied === 'evaluator' ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="report-preview-mini">
                            <h4>Isi Laporan Petugas:</h4>
                            <p>{activity.report_text}</p>
                        </div>
                    </div>
                );
            case FINANCE_STATUS.PENDING_BPP:
                return (
                    <button className="btn btn-primary btn-block" onClick={() => handleAction(FINANCE_STATUS.PENDING_REQUEST)}>
                        Proses ke Akuntan
                    </button>
                );
            case FINANCE_STATUS.PENDING_REQUEST:
                return (
                    <button className="btn btn-primary btn-block" onClick={() => handleAction(FINANCE_STATUS.PENDING_KAPUS)}>
                        Kirim ke Kapus
                    </button>
                );
            case FINANCE_STATUS.PENDING_KAPUS:
                return (
                    <button className="btn btn-primary btn-block" onClick={() => handleAction(FINANCE_STATUS.PENDING_CROSSCHECK)}>
                        Konfirmasi Transfer
                    </button>
                );
            case FINANCE_STATUS.PENDING_CROSSCHECK:
                return (
                    <button className="btn btn-success btn-block" onClick={() => handleAction(FINANCE_STATUS.COMPLETED)}>
                        Selesaikan Transaksi
                    </button>
                );
            default:
                return <p className="text-success">Kegiatan ini telah selesai.</p>;
        }
    };

    return (
        <div className="sa-modal-overlay">
            <div className="sa-modal detail-modal">
                <div className="modal-header">
                    <div className="header-info">
                        <span className="id-tag">#{activity.id.substring(0, 8)}</span>
                        <h2>{activity.title}</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}><X /></button>
                </div>

                <div className="modal-body">
                    <div className="status-progress-bar">
                        <div className="status-badge-large">{STATUS_LABELS[activity.status]}</div>
                        <div className="budget-tag"><DollarSign size={16} /> Rp {new Intl.NumberFormat('id-ID').format(activity.budget)}</div>
                    </div>

                    {activity.rejection_note && (
                        <div className="rejection-box">
                            <AlertCircle size={18} />
                            <div>
                                <strong>Ditolak Evaluator:</strong>
                                <p>{activity.rejection_note}</p>
                            </div>
                        </div>
                    )}

                    <div className="activity-description-box">
                        <label>Deskripsi/Tujuan Kegiatan:</label>
                        <p>{activity.description || 'Tidak ada deskripsi.'}</p>
                    </div>

                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="label">PPTK</span>
                            <span className="value">{activity.pptk_name || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Petugas</span>
                            <span className="value">{activity.petugas_name || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Tanggal</span>
                            <span className="value">{activity.activity_date || '-'}</span>
                        </div>
                    </div>

                    <hr />

                    {renderActionContent()}

                    <div className="modal-danger-zone" style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px dashed #eee' }}>
                        <button
                            className="btn btn-text text-danger"
                            onClick={handleDelete}
                            disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', fontSize: '0.9rem' }}
                        >
                            <Trash2 size={16} /> Hapus Kegiatan ini
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityDetailModal;
