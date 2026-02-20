import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import financeService from '../services/FinanceService';

const PublicReportForm = ({ token }) => {
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [reportText, setReportText] = useState('');
    const [photoUrls, setPhotoUrls] = useState([]);
    const [visitedName, setVisitedName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        if (token) {
            loadActivity();
        }
    }, [token]);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            setUploading(true);
            const uploadPromises = files.map(file => financeService.uploadPhoto(file));
            const newUrls = await Promise.all(uploadPromises);
            setPhotoUrls(prev => [...prev, ...newUrls]);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Gagal mengunggah foto. Pastikan bucket "finance-photos" sudah dibuat.');
        } finally {
            setUploading(false);
        }
    };

    const loadActivity = async () => {
        try {
            setLoading(true);
            const data = await financeService.getActivityByToken(token, 'petugas');
            if (!data) {
                setError('Link tidak valid atau kadaluarsa.');
            } else {
                setActivity(data);
                setReportText(data.report_text || '');
                setPhotoUrls(data.photo_urls || []);
                setVisitedName(data.visited_name || '');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat memuat data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await financeService.submitReportByToken(token, {
                report_text: reportText,
                photo_urls: photoUrls,
                visited_name: visitedName
            });
            setSubmitted(true);
        } catch (err) {
            setError('Gagal mengirim laporan. Silakan coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getMonthName = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    };

    const formatFullDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (loading) return <div className="public-form-container">Memuat...</div>;
    if (error) return <div className="public-form-container error">{error}</div>;
    if (submitted) return (
        <div className="public-form-container success no-print">
            <CheckCircle2 size={48} className="text-success" />
            <h2>Laporan Berhasil Dikirim</h2>
            <p>Terima kasih <strong>{activity.petugas_name}</strong>, laporan Anda sedang dalam tahap evaluasi.</p>
            <div className="success-actions">
                <button className="btn btn-outline" onClick={() => setSubmitted(false)}>
                    Edit Laporan
                </button>
                <button className="btn btn-primary" onClick={handlePrint}>
                    Cetak Laporan Hasil
                </button>
            </div>
        </div>
    );

    return (
        <div className="public-form-container">
            <header className="public-header no-print">
                <h1>Laporan Hasil Kegiatan</h1>
                <div className="identity-banner">
                    <div className="id-item">
                        <span className="label">Petugas:</span>
                        <span className="value">{activity.petugas_name}</span>
                    </div>
                </div>
                <div className="activity-badge">{activity.title}</div>
            </header>

            <div className="activity-description-box no-print">
                <label>Tujuan/Deskripsi:</label>
                <p>{activity.description || 'Tidak ada deskripsi.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="public-form no-print">
                {activity.rejection_note && (
                    <div className="rejection-box">
                        <AlertCircle size={18} />
                        <div>
                            <strong>Catatan Perbaikan:</strong>
                            <p>{activity.rejection_note}</p>
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label>Nama/Instansi yang Dikunjungi</label>
                    <input
                        type="text"
                        value={visitedName}
                        onChange={(e) => setVisitedName(e.target.value)}
                        placeholder="Contoh: Balai Desa Kapi"
                    />
                </div>

                <div className="form-group">
                    <label>Hasil Kegiatan</label>
                    <textarea
                        required
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                        placeholder="Ceritakan pelaksanaan kegiatan secara ringkas..."
                        rows={6}
                    />
                </div>

                <div className="form-group">
                    <label>Unggah Foto Kegiatan</label>
                    <p className="hint">Pilih satu atau beberapa foto bukti kegiatan hasil kunjungan.</p>
                    <div className="upload-container">
                        <label className={`upload-btn ${uploading ? 'disabled' : ''}`}>
                            {uploading ? <Loader2 className="spin" size={18} /> : <Upload size={18} />}
                            {uploading ? 'Mengunggah...' : 'Pilih File Foto'}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileUpload}
                                disabled={uploading}
                                hidden
                            />
                        </label>
                    </div>

                    <div className="photo-list">
                        {photoUrls.map((url, i) => (
                            <div key={i} className="photo-preview-item">
                                <img src={url} alt={`Upload ${i + 1}`} />
                                <button type="button" className="remove-photo" onClick={() => setPhotoUrls(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? <Loader2 className="spin" size={18} /> : 'Kirim Laporan'}
                    </button>
                    {reportText && (
                        <button type="button" className="btn btn-outline" onClick={handlePrint}>
                            Preview PDF
                        </button>
                    )}
                </div>
            </form>

            {/* PRINT VIEW (Matches image format) */}
            <div className="print-report-layout">
                <h2 className="print-title"><u>LAPORAN HASIL</u></h2>

                <div className="print-meta">
                    <div className="meta-row">
                        <span className="label">KEGIATAN</span>
                        <span className="sep">:</span>
                        <span className="value">{activity.title}</span>
                    </div>
                    <div className="meta-row">
                        <span className="label">BULAN</span>
                        <span className="sep">:</span>
                        <span className="value">{getMonthName(activity.activity_date)}</span>
                    </div>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th width="4%">N<br />O<br />.</th>
                            <th width="14%">TANGGAL</th>
                            <th width="15%">TUJUAN</th>
                            <th width="20%">NAMA YANG DIKUNJUNGI</th>
                            <th width="22%">HASIL KEGIATAN</th>
                            <th width="25%">TANDA TANGAN DAN STEMPEL YANG DIKUNJUNGI</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="text-center">1</td>
                            <td className="text-center">{formatFullDate(activity.activity_date)}</td>
                            <td>{activity.description || '-'}</td>
                            <td>{visitedName || '-'}</td>
                            <td>{reportText || '-'}</td>
                            <td></td>
                        </tr>
                        {/* Empty rows to make it look like the template if needed, but 1 is fine */}
                    </tbody>
                </table>

                <div className="print-signatures-block">
                    <div className="sig-left">
                        <p>Mengetahui,</p>
                        <div className="sig-space"></div>
                        <p>__________________________</p>
                    </div>
                    <div className="sig-right">
                        <p>Kunjang, {formatFullDate(activity.activity_date)}</p>
                        <p>Petugas Pelaksana</p>
                        <div className="sig-space"></div>
                        <p><strong><u>{activity.petugas_name}</u></strong></p>
                        <p>NIP. ..................................</p>
                    </div>
                </div>

                {photoUrls.length > 0 && (
                    <div className="print-attachments">
                        <h4>LAMPIRAN FOTO:</h4>
                        <div className="print-photo-grid">
                            {photoUrls.map((url, i) => (
                                <div key={i} className="photo-item">
                                    <img src={url} alt="Dokumentasi" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicReportForm;
