import React, { useState } from 'react';
import { Lock, Unlock, Plus, ChevronDown, AlertCircle, CheckCircle, Download, MessageSquare } from 'lucide-react';
import { LOCK_PASSWORD, ADMIN_UNLOCK_PASSWORD } from '../../constants/akreditasiConstants';
import akreditasiService from '../../services/akreditasiService';

export default function SAPeriodeManager({ periodeList, activePeriode, onSelectPeriode, onPeriodeCreated, onStatusChanged, onDownload }) {
    const [showNewModal, setShowNewModal] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);
    const [newNama, setNewNama] = useState('');
    const [password, setPassword] = useState('');
    const [alasan, setAlasan] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [saving, setSaving] = useState(false);

    const isLocked = activePeriode?.status === 'locked';

    const handleCreatePeriode = async () => {
        if (!newNama.trim()) return;
        setSaving(true);
        try {
            const created = await akreditasiService.createPeriode(newNama.trim());
            onPeriodeCreated(created);
            setNewNama('');
            setShowNewModal(false);
        } catch (e) {
            alert('Gagal membuat periode: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleLock = async () => {
        // Validasi Password
        const targetPassword = isLocked ? ADMIN_UNLOCK_PASSWORD : LOCK_PASSWORD;
        if (password !== targetPassword) {
            setPasswordError('Password salah. Silakan coba lagi.');
            return;
        }

        // Validasi Alasan jika membuka kunci
        if (isLocked && !alasan.trim()) {
            setPasswordError('Alasan pembukaan kunci wajib diisi.');
            return;
        }

        setSaving(true);
        try {
            const newStatus = isLocked ? 'open' : 'locked';
            const updated = await akreditasiService.setPeriodeStatus(
                activePeriode.id,
                newStatus,
                isLocked ? alasan.trim() : null
            );
            onStatusChanged(updated);
            setShowLockModal(false);
            setPassword('');
            setAlasan('');
            setPasswordError('');
        } catch (e) {
            alert('Gagal mengubah status: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="sa-periode-bar">
                {/* Dropdown periode */}
                <div className="sa-periode-select-wrap">
                    <label className="sa-period-label">Periode Penilaian</label>
                    <div className="sa-periode-dropdown-row">
                        <div className="sa-select-wrapper">
                            <select
                                className="sa-periode-select"
                                value={activePeriode?.id || ''}
                                onChange={(e) => {
                                    const found = periodeList.find((p) => p.id === e.target.value);
                                    if (found) onSelectPeriode(found);
                                }}
                            >
                                {periodeList.length === 0 && <option value="">-- Belum ada periode --</option>}
                                {periodeList.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nama}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="sa-select-chevron" />
                        </div>

                        {/* Status badge */}
                        {activePeriode && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`sa-status-badge ${isLocked ? 'locked' : 'open'}`}>
                                    {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                                    {isLocked ? 'TERKUNCI' : 'TERBUKA'}
                                </span>
                                {!isLocked && activePeriode.alasan_buka && (
                                    <div className="sa-alasan-chip" title={`Alasan dibuka: ${activePeriode.alasan_buka}`}>
                                        <MessageSquare size={12} />
                                        Audit: {activePeriode.alasan_buka.substring(0, 20)}...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Aksi */}
                <div className="sa-periode-actions">
                    {isLocked && (
                        <button
                            className="btn btn-primary sa-btn-sm"
                            onClick={onDownload}
                            title="Download Laporan PDF"
                        >
                            <Download size={16} />
                            Laporan
                        </button>
                    )}
                    <button
                        className="btn btn-outline sa-btn-sm"
                        onClick={() => setShowNewModal(true)}
                    >
                        <Plus size={16} />
                        Periode Baru
                    </button>
                    {activePeriode && (
                        <button
                            className={`btn sa-btn-sm ${isLocked ? 'btn-unlock' : 'btn-lock'}`}
                            onClick={() => { setShowLockModal(true); setPasswordError(''); setPassword(''); setAlasan(''); }}
                        >
                            {isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                            {isLocked ? 'Buka Kunci' : 'Kunci'}
                        </button>
                    )}
                </div>
            </div>

            {/* Modal Buat Periode */}
            {showNewModal && (
                <div className="sa-modal-overlay" onClick={() => setShowNewModal(false)}>
                    <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="sa-modal-title">Buat Periode Baru</h3>
                        <p className="sa-modal-desc">Masukkan nama periode penilaian, misalnya "Feb 2026".</p>
                        <input
                            className="sa-modal-input"
                            type="text"
                            placeholder="Nama periode, mis: Feb 2026"
                            value={newNama}
                            onChange={(e) => setNewNama(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreatePeriode()}
                            autoFocus
                        />
                        <div className="sa-modal-actions">
                            <button className="btn btn-outline" onClick={() => setShowNewModal(false)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleCreatePeriode} disabled={saving || !newNama.trim()}>
                                {saving ? 'Menyimpan...' : 'Buat Periode'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Lock/Unlock */}
            {showLockModal && (
                <div className="sa-modal-overlay" onClick={() => setShowLockModal(false)}>
                    <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="sa-modal-title">
                            {isLocked ? '🔓 Buka Kunci Periode' : '🔒 Kunci Periode'}
                        </h3>
                        <p className="sa-modal-desc">
                            {isLocked
                                ? 'Masukkan password ADMIN untuk membuka kunci. Anda wajib mengisi alasan pembukaan kunci untuk audit.'
                                : 'Masukkan password untuk mengunci periode ini. Setelah terkunci, data tidak dapat diubah.'}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input
                                className={`sa-modal-input ${passwordError && !password ? 'input-error' : ''}`}
                                type="password"
                                placeholder="Masukkan password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleToggleLock()}
                                autoFocus
                            />

                            {isLocked && (
                                <textarea
                                    className={`sa-modal-input ${passwordError && !alasan.trim() ? 'input-error' : ''}`}
                                    placeholder="Alasan pembukaan kunci (Wajib)"
                                    rows={3}
                                    value={alasan}
                                    onChange={(e) => { setAlasan(e.target.value); setPasswordError(''); }}
                                    style={{ resize: 'none' }}
                                />
                            )}
                        </div>

                        {passwordError && (
                            <div className="sa-error-msg">
                                <AlertCircle size={14} /> {passwordError}
                            </div>
                        )}

                        <div className="sa-modal-actions">
                            <button className="btn btn-outline" onClick={() => setShowLockModal(false)}>Batal</button>
                            <button
                                className={`btn ${isLocked ? 'btn-primary' : 'btn-lock'}`}
                                onClick={handleToggleLock}
                                disabled={saving || !password || (isLocked && !alasan.trim())}
                            >
                                {saving ? 'Memproses...' : isLocked ? 'Buka Kunci' : 'Kunci Periode'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
