import React, { useState, useCallback } from 'react';
import { Save, CheckCircle, Loader, ChevronRight } from 'lucide-react';
import babData from '../../data/akreditasiData.json';
import { SKOR_OPTIONS, SKOR_BAIK_MIN, hitungCapaian } from '../../constants/akreditasiConstants';
import akreditasiService from '../../services/akreditasiService';

export default function SADataEntry({ periodeId, isLocked, skorData, onSkorUpdated }) {
    const [activeBabIdx, setActiveBabIdx] = useState(0);
    const [activeStandarIdx, setActiveStandarIdx] = useState(0);
    const [savingId, setSavingId] = useState(null);
    const [savedId, setSavedId] = useState(null);

    const activeBab = babData[activeBabIdx];
    const activeStandar = activeBab?.standar[activeStandarIdx];

    const handleSkor = useCallback(async (ep, newSkor) => {
        if (isLocked) return;
        setSavingId(ep.id);
        try {
            const currentKomentar = skorData[ep.id]?.komentar ?? '';
            await akreditasiService.saveSkor({
                periode_id: periodeId,
                ep_id: ep.id,
                skor: newSkor,
                komentar: currentKomentar,
            });
            onSkorUpdated(ep.id, { skor: newSkor, komentar: currentKomentar });
            setSavedId(ep.id);
            setTimeout(() => setSavedId(null), 1500);
        } catch (e) {
            alert('Gagal menyimpan: ' + e.message);
        } finally {
            setSavingId(null);
        }
    }, [isLocked, periodeId, skorData, onSkorUpdated]);

    const handleKomentar = useCallback(async (ep, newKomentar) => {
        if (isLocked) return;
        const currentSkor = skorData[ep.id]?.skor ?? 0;
        try {
            await akreditasiService.saveSkor({
                periode_id: periodeId,
                ep_id: ep.id,
                skor: currentSkor,
                komentar: newKomentar,
            });
            onSkorUpdated(ep.id, { skor: currentSkor, komentar: newKomentar });
        } catch (e) {
            console.error('Gagal simpan komentar:', e.message);
        }
    }, [isLocked, periodeId, skorData, onSkorUpdated]);

    // Hitung capaian standar
    const standarCapaian = (standar) => {
        const epIds = standar.kriteria.flatMap((k) => k.ep.map((e) => e.id));
        const skorList = epIds.map((id) => skorData[id]?.skor ?? 0);
        return hitungCapaian(skorList, epIds.length);
    };

    // Hitung capaian BAB
    const babCapaian = (bab) => {
        const epIds = bab.standar.flatMap((s) => s.kriteria.flatMap((k) => k.ep.map((e) => e.id)));
        const skorList = epIds.map((id) => skorData[id]?.skor ?? 0);
        return hitungCapaian(skorList, epIds.length);
    };

    return (
        <div className="sa-entry-layout">
            {/* Navigasi Kiri */}
            <aside className="sa-entry-nav">
                {babData.map((bab, bi) => (
                    <div key={bab.id} className="sa-nav-bab">
                        <button
                            className={`sa-nav-bab-btn ${activeBabIdx === bi ? 'active' : ''}`}
                            onClick={() => { setActiveBabIdx(bi); setActiveStandarIdx(0); }}
                        >
                            <span className="sa-nav-kode">{bab.kode}</span>
                            <span className="sa-nav-pct">{babCapaian(bab)}%</span>
                        </button>
                        {activeBabIdx === bi && (
                            <div className="sa-nav-standar-list">
                                {bab.standar.map((standar, si) => (
                                    <button
                                        key={standar.id}
                                        className={`sa-nav-standar-btn ${activeStandarIdx === si ? 'active' : ''}`}
                                        onClick={() => setActiveStandarIdx(si)}
                                    >
                                        <ChevronRight size={12} />
                                        <span className="sa-nav-standar-id">{standar.id}</span>
                                        <span className="sa-nav-pct">{standarCapaian(standar)}%</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </aside>

            {/* Konten EP */}
            <div className="sa-entry-content">
                <div className="sa-entry-header">
                    <div>
                        <h3 className="sa-entry-standar-title">
                            Standar {activeStandar?.id} — {activeStandar?.nama}
                        </h3>
                        <p className="sa-entry-bab-name">{activeBab?.kode}: {activeBab?.nama}</p>
                    </div>
                    <div className="sa-entry-capaian">
                        <span className="sa-entry-pct-label">Capaian Standar</span>
                        <span className="sa-entry-pct-value">{activeStandar ? standarCapaian(activeStandar) : 0}%</span>
                    </div>
                    {isLocked && (
                        <div className="sa-locked-notice">
                            🔒 Periode terkunci — input tidak dapat diubah
                        </div>
                    )}
                </div>

                {activeStandar?.kriteria.map((kriteria) => (
                    <div key={kriteria.id} className="sa-kriteria-block">
                        <h4 className="sa-kriteria-title">
                            <span className="sa-kriteria-id">{kriteria.id}</span>
                            {kriteria.nama}
                        </h4>

                        <div className="sa-ep-list">
                            {kriteria.ep.map((ep, epIdx) => {
                                const epSkor = skorData[ep.id]?.skor ?? null;
                                const epKomentar = skorData[ep.id]?.komentar ?? '';
                                const isSaving = savingId === ep.id;
                                const isSaved = savedId === ep.id;
                                const statusClass = epSkor === null ? 'ep-empty' : epSkor >= SKOR_BAIK_MIN ? 'ep-good' : epSkor > 0 ? 'ep-warn' : 'ep-bad';

                                return (
                                    <div key={ep.id} className={`sa-ep-row ${statusClass}`}>
                                        <div className="sa-ep-top">
                                            <span className="sa-ep-id">{ep.id}</span>
                                            <div className="sa-ep-skor-group">
                                                {SKOR_OPTIONS.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        className={`sa-skor-btn ${epSkor === opt ? 'selected' : ''}`}
                                                        onClick={() => handleSkor(ep, opt)}
                                                        disabled={isLocked || isSaving}
                                                        title={opt === 0 ? 'Tidak ada' : opt === 5 ? 'Sebagian' : 'Terpenuhi'}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                                <div className="sa-ep-status-icon">
                                                    {isSaving && <Loader size={14} className="spin" />}
                                                    {isSaved && <CheckCircle size={14} style={{ color: '#22c55e' }} />}
                                                </div>
                                            </div>
                                        </div>

                                        <p className="sa-ep-uraian">{ep.uraian}</p>

                                        <textarea
                                            className={`sa-ep-komentar ${isLocked ? 'locked' : ''}`}
                                            rows={2}
                                            placeholder={isLocked ? 'Periode terkunci' : 'Fakta, analisis, atau komentar... (opsional)'}
                                            value={epKomentar}
                                            disabled={isLocked}
                                            onChange={(e) => {
                                                // Update lokal dulu, debounce ke server
                                                onSkorUpdated(ep.id, { skor: epSkor ?? 0, komentar: e.target.value });
                                            }}
                                            onBlur={(e) => handleKomentar(ep, e.target.value)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
