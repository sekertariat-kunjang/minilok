import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, ClipboardList, Loader, AlertCircle } from 'lucide-react';
import akreditasiService from '../../services/akreditasiService';
import { exportToPDF } from '../../../reporting/services/ReportService';
import SAPeriodeManager from './SAPeriodeManager';
import SADashboard from './SADashboard';
import SADataEntry from './SADataEntry';
import SAReportTemplate from './SAReportTemplate';

export default function SelfAssessment() {
    const [periodeList, setPeriodeList] = useState([]);
    const [activePeriode, setActivePeriode] = useState(null);
    const [skorData, setSkorData] = useState({});
    const [activeView, setActiveView] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [loadingError, setLoadingError] = useState('');

    // Load daftar periode
    useEffect(() => {
        (async () => {
            setLoading(true);
            setLoadingError('');
            try {
                const list = await akreditasiService.getPeriodeList();
                setPeriodeList(list);
                if (list.length > 0) setActivePeriode(list[0]);
            } catch (e) {
                setLoadingError('Gagal memuat data periode: ' + e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Load skor saat periode berubah
    useEffect(() => {
        if (!activePeriode) { setSkorData({}); return; }
        (async () => {
            try {
                const data = await akreditasiService.getSkorByPeriode(activePeriode.id);
                setSkorData(data);
            } catch (e) {
                console.error('Gagal memuat skor:', e.message);
                setSkorData({});
            }
        })();
    }, [activePeriode]);

    const handlePeriodeCreated = useCallback((newPeriode) => {
        setPeriodeList((prev) => [newPeriode, ...prev]);
        setActivePeriode(newPeriode);
        setSkorData({});
    }, []);

    const handleStatusChanged = useCallback((updated) => {
        setPeriodeList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setActivePeriode(updated);
    }, []);

    const handleSkorUpdated = useCallback((epId, newVal) => {
        setSkorData((prev) => ({ ...prev, [epId]: newVal }));
    }, []);

    const handleDownload = useCallback(async () => {
        if (!activePeriode) return;
        try {
            const filename = `Laporan_Akreditasi_${activePeriode.nama}_${new Date().getTime()}.pdf`;
            // Pastikan template ter-render sebelum dipanggil (biasanya sudah ada di DOM secara hidden)
            await exportToPDF('sa-report-content', filename);
        } catch (e) {
            alert('Gagal mendownload laporan: ' + e.message);
        }
    }, [activePeriode]);

    const isLocked = activePeriode?.status === 'locked';

    const views = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { id: 'entry', label: 'Input Nilai', icon: <ClipboardList size={16} /> },
    ];

    if (loading) {
        return (
            <div className="sa-loading">
                <Loader size={36} className="spin" />
                <p>Memuat data akreditasi...</p>
            </div>
        );
    }

    if (loadingError) {
        return (
            <div className="sa-error-screen">
                <AlertCircle size={36} />
                <p>{loadingError}</p>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>Coba Lagi</button>
            </div>
        );
    }

    return (
        <div className="sa-container">
            {/* Header SA */}
            <div className="sa-header">
                <div>
                    <h2 className="sa-header-title">Self-Assessment Akreditasi</h2>
                    <p className="sa-header-sub">Puskesmas Kunjang — Standar 2023</p>
                </div>
                {/* Sub-tab Dashboard / Input Nilai */}
                <div className="sa-view-tabs">
                    {views.map((v) => (
                        <button
                            key={v.id}
                            className={`sa-view-tab ${activeView === v.id ? 'active' : ''}`}
                            onClick={() => setActiveView(v.id)}
                        >
                            {v.icon} {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Periode Manager */}
            <SAPeriodeManager
                periodeList={periodeList}
                activePeriode={activePeriode}
                onSelectPeriode={(p) => { setActivePeriode(p); setSkorData({}); }}
                onPeriodeCreated={handlePeriodeCreated}
                onStatusChanged={handleStatusChanged}
                onDownload={handleDownload}
            />

            {/* Konten */}
            {!activePeriode ? (
                <div className="sa-no-periode">
                    <ClipboardList size={48} />
                    <p>Belum ada periode penilaian.</p>
                    <p>Klik <strong>"Periode Baru"</strong> untuk memulai.</p>
                </div>
            ) : (
                <>
                    {activeView === 'dashboard' && (
                        <SADashboard skorData={skorData} />
                    )}
                    {activeView === 'entry' && (
                        <SADataEntry
                            periodeId={activePeriode.id}
                            isLocked={isLocked}
                            skorData={skorData}
                            onSkorUpdated={handleSkorUpdated}
                        />
                    )}
                </>
            )}
            {/* Template Laporan (Pojok Layar untuk di-capture html2canvas) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <SAReportTemplate periode={activePeriode} skorData={skorData} />
            </div>
        </div>
    );
}
