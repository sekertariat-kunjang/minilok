import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import financeService from '../services/FinanceService';

const PublicEvaluationForm = ({ token }) => {
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [note, setNote] = useState('');

    useEffect(() => {
        if (token) {
            loadActivity();
        }
    }, [token]);

    const loadActivity = async () => {
        try {
            setLoading(true);
            const data = await financeService.getActivityByToken(token, 'evaluator');
            if (!data) {
                setError('Link tidak valid atau kadaluarsa.');
            } else {
                setActivity(data);
            }
        } catch (err) {
            setError('Terjadi kesalahan saat memuat data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (approved) => {
        if (!approved && !note) {
            alert('Mohon isi catatan jika menolak laporan.');
            return;
        }

        try {
            setSubmitting(true);
            await financeService.evaluateByToken(token, approved, note);
            setSubmitted(true);
        } catch (err) {
            setError('Gagal memproses evaluasi.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="public-form-container">Memuat...</div>;
    if (error) return <div className="public-form-container error">{error}</div>;
    if (submitted) return (
        <div className="public-form-container success">
            <CheckCircle2 size={48} className="text-success" />
            <h2>Evaluasi Berhasil Disimpan</h2>
            <p>Terima kasih, keputusan Anda telah dicatat dalam sistem.</p>
        </div>
    );

    return (
        <div className="public-form-container">
            <header className="public-header">
                <h1>Evaluasi Laporan Kegiatan</h1>
                <div className="activity-badge">{activity.title}</div>
            </header>

            <div className="evaluation-preview">
                <h3>Isi Laporan:</h3>
                <div className="report-content-box">
                    {activity.report_text}
                </div>

                {activity.photo_urls && activity.photo_urls.length > 0 && (
                    <div className="photo-preview-grid">
                        {activity.photo_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="photo-link">
                                Lihat Foto {i + 1}
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <div className="evaluation-actions">
                <div className="form-group">
                    <label>Catatan / Feedback (Wajib jika ditolak)</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Masukkan catatan perbaikan atau feedback..."
                        rows={4}
                    />
                </div>

                <div className="btn-group-row">
                    <button
                        onClick={() => handleAction(false)}
                        className="btn btn-outline btn-danger"
                        disabled={submitting}
                    >
                        <XCircle size={18} />
                        Tolak / Butuh Perbaikan
                    </button>
                    <button
                        onClick={() => handleAction(true)}
                        className="btn btn-primary"
                        disabled={submitting}
                    >
                        <CheckCircle2 size={18} />
                        ACC Laporan
                    </button>
                </div>
                {submitting && <div className="submitting-overlay"><Loader2 className="spin" /></div>}
            </div>
        </div>
    );
};

export default PublicEvaluationForm;
