import React, { useState, useCallback } from 'react';
import { docGenService } from '../services/DocGenService';
import AIService from '../services/AIService';
import MetadataService from '../utils/MetadataService';
import { FileText, Download, Loader2, Sparkles, AlertTriangle, CheckCircle, Info, X, List, Activity, RefreshCw, Eye } from 'lucide-react';

const SOP_TEMPLATE_NAME = 'CONTOH SOP 2026';

// Auto-generate valid Mermaid flowchart from step list
const generateMermaidFromProsedur = (prosedurList) => {
    if (!prosedurList || prosedurList.length === 0) return 'graph TD\n  A([Mulai]) --> Z([Selesai])';
    let code = 'graph TD\n  A(["🟢 Mulai"])\n';
    prosedurList.forEach((step, i) => {
        const id = `P${i + 1}`;
        const label = (step || '').length > 40 ? step.substring(0, 40) + '...' : (step || `Langkah ${i + 1}`);
        const safeLab = label.replace(/"/g, "'");
        code += `  ${id}["${safeLab}"]\n`;
        code += i === 0 ? `  A --> ${id}\n` : `  P${i} --> ${id}\n`;
    });
    const last = `P${prosedurList.length}`;
    code += `  ${last} --> Z(["⛳ Selesai"])`;
    return code;
};

// Check if a string is valid Mermaid code
const isMermaidCode = (str) => {
    if (!str || typeof str !== 'string') return false;
    const INDICATORS = ['graph TD', 'graph LR', 'graph TB', 'graph RL', 'flowchart', 'sequenceDiagram'];
    return INDICATORS.some(ind => str.includes(ind));
};

// Fetch rendered flowchart image from Kroki.io (returns blob URL)
const fetchFlowchartPreview = async (mermaidCode) => {
    const resp = await fetch('https://kroki.io/mermaid/png', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagram_source: mermaidCode })
    });
    if (!resp.ok) throw new Error(`Kroki error: ${resp.status}`);
    const blob = await resp.blob();
    return URL.createObjectURL(blob);
};

const FlowchartPreview = ({ mermaidCode }) => {
    const [imgUrl, setImgUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadPreview = useCallback(async () => {
        setLoading(true);
        setError(null);
        // Revoke previous blob URL
        if (imgUrl) URL.revokeObjectURL(imgUrl);
        try {
            const url = await fetchFlowchartPreview(mermaidCode);
            setImgUrl(url);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [mermaidCode]);

    return (
        <div style={{ marginTop: '0.75rem' }}>
            <button
                onClick={loadPreview}
                disabled={loading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
            >
                {loading ? <Loader2 size={14} className="spin" /> : <Eye size={14} />}
                {loading ? 'Merender...' : imgUrl ? '🔄 Refresh Preview' : '👁 Preview Flowchart'}
            </button>
            {error && <p style={{ color: '#f87171', fontSize: '0.7rem', marginTop: '0.5rem' }}>⚠ {error}</p>}
            {imgUrl && (
                <div style={{ marginTop: '0.75rem', background: 'white', borderRadius: '0.5rem', padding: '0.75rem' }}>
                    <img src={imgUrl} alt="Flowchart Preview" style={{ maxWidth: '100%', borderRadius: '0.375rem', display: 'block' }} />
                </div>
            )}
        </div>
    );
};

const SOPGenerator = () => {
    const [judulSop, setJudulSop] = useState('Prosedur Pengecekan Suhu Tubuh Pasien');
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [draft, setDraft] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [globalMeta] = useState(MetadataService.getGlobalMetadata());

    const handleGenerateAI = async () => {
        if (!judulSop.trim()) return;
        setIsGenerating(true);
        setStatus({ type: '', message: '' });
        setDraft(null);

        try {
            const aiResponse = await AIService.generateDocument(judulSop, 'sop', globalMeta);

            // If AI returns real Mermaid code, use it. Otherwise, auto-generate from prosedur.
            const prosedurList = aiResponse.prosedur || [];
            const rawFlowchart = aiResponse.flowchart || '';
            const finalFlowchart = isMermaidCode(rawFlowchart)
                ? rawFlowchart
                : generateMermaidFromProsedur(prosedurList);

            const formattedDraft = {
                nama_sop: aiResponse.judul || judulSop.toUpperCase(),
                kepala_puskesmas: globalMeta.kepala_puskesmas || 'dr. ____________',
                tanggal_pembuatan: new Date().toLocaleDateString('id-ID'),
                tanggal_revisi: '-',
                tanggal_pengesahan: new Date().toLocaleDateString('id-ID'),
                ai_dasar_hukum: aiResponse.kebijakan || aiResponse.referensi || '',
                ai_kualifikasi_pelaksana: aiResponse.pengertian || '',
                ai_keterkaitan: aiResponse.unit_terkait || '',
                ai_pencatatan: aiResponse.tujuan || '',
                ai_peringatan: aiResponse.peringatan || '',
                ai_peralatan_list: aiResponse.peralatan || aiResponse.alat_bahan || [],
                ai_flowchart: finalFlowchart,
            };

            setDraft(formattedDraft);
            setStatus({ type: 'success', message: `Draf "${formattedDraft.nama_sop}" berhasil dibuat oleh AI!` });
        } catch (error) {
            console.error('AI Error:', error);
            setStatus({ type: 'error', message: `Gagal generate AI: ${error.message || 'Cek koneksi.'}` });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!draft) return;
        setIsGenerating(true);
        setStatus({ type: 'info', message: 'Meng-generate dokumen & merender flowchart...' });

        try {
            await docGenService.generateDocument(SOP_TEMPLATE_NAME, draft);
            setStatus({ type: 'success', message: 'SOP berhasil diunduh!' });
            setShowPreview(false);
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'Gagal: ' + error.message });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenFlowchart = () => {
        if (!draft) return;
        const newFlowchart = generateMermaidFromProsedur(draft.ai_prosedur || draft.prosedur_raw || []);
        setDraft({ ...draft, ai_flowchart: newFlowchart });
    };

    const peralatanText = Array.isArray(draft?.ai_peralatan_list)
        ? draft.ai_peralatan_list.join('\n')
        : (draft?.ai_peralatan_list || '');

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto 3rem' }}>
            <div className="card" style={{ padding: '2rem', background: 'white', borderRadius: '1rem', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--primary)', borderRadius: '0.75rem', color: 'white' }}>
                        <FileText size={28} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>SOP Magic Generator ✨</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Ketik topik, AI menyusun prosedur, peralatan, &amp; flowchart otomatis.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.625rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: '#1e40af' }}>
                    <Info size={15} style={{ flexShrink: 0 }} />
                    <span>Template: <strong>{SOP_TEMPLATE_NAME}.docx</strong> &nbsp;|&nbsp; Flowchart dari Mermaid → dirender jadi gambar PNG via Kroki.io ✨</span>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                        Topik atau Judul SOP
                    </label>
                    <input
                        type="text"
                        style={{ width: '100%', padding: '0.875rem 1rem', border: '2px solid var(--border)', borderRadius: '0.75rem', fontSize: '1rem', outline: 'none', background: '#f8fafc', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                        value={judulSop}
                        onChange={(e) => setJudulSop(e.target.value)}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        placeholder="Misal: Penanganan Pasien Gawat Darurat"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button onClick={handleGenerateAI} disabled={isGenerating || !judulSop} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: '200px' }}>
                        {isGenerating && !draft ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                        {isGenerating && !draft ? 'AI Sedang Berpikir...' : 'Generate Draf AI'}
                    </button>
                    {draft && (
                        <button onClick={() => setShowPreview(true)} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', minWidth: '200px' }}>
                            <List size={18} />
                            Lihat &amp; Cetak Draf
                        </button>
                    )}
                </div>

                {status.message && (
                    <div style={{
                        marginTop: '1rem', padding: '0.875rem 1rem', borderRadius: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem',
                        background: status.type === 'success' ? '#f0fdf4' : status.type === 'error' ? '#fef2f2' : '#eff6ff',
                        color: status.type === 'success' ? '#166534' : status.type === 'error' ? '#991b1b' : '#1e40af',
                        border: `1px solid ${status.type === 'success' ? '#bbf7d0' : status.type === 'error' ? '#fecaca' : '#bfdbfe'}`
                    }}>
                        {status.type === 'success' ? <CheckCircle size={18} /> : status.type === 'error' ? <AlertTriangle size={18} /> : <Loader2 className="spin" size={18} />}
                        <span style={{ fontWeight: 500 }}>{status.message}</span>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && draft && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'white', width: '100%', maxWidth: '900px',
                        maxHeight: '90vh', borderRadius: '1.5rem', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Sparkles size={22} />
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem' }}>Pratinjau &amp; Edit Draf SOP</h3>
                                    <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.85 }}>Flowchart akan di-render ke gambar PNG saat dicetak ke Word.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowPreview(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: '0.5rem', padding: '0.4rem', cursor: 'pointer', display: 'flex' }}>
                                <X size={22} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#f8fafc' }}>
                            {/* Row 1 */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>nama sop</label>
                                    <input value={draft.nama_sop} onChange={(e) => setDraft({ ...draft, nama_sop: e.target.value })} style={{ ...inputStyle, fontWeight: '600' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>kepala puskesmas</label>
                                    <input value={draft.kepala_puskesmas} onChange={(e) => setDraft({ ...draft, kepala_puskesmas: e.target.value })} style={inputStyle} />
                                </div>
                            </div>

                            {/* Dates */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                {['tanggal_pembuatan', 'tanggal_revisi', 'tanggal_pengesahan'].map(f => (
                                    <div key={f}>
                                        <label style={labelStyle}>{f.replace(/_/g, ' ')}</label>
                                        <input value={draft[f]} onChange={(e) => setDraft({ ...draft, [f]: e.target.value })} style={inputSmStyle} />
                                    </div>
                                ))}
                            </div>

                            {/* Text areas */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {[
                                    { key: 'ai_dasar_hukum', label: 'dasar hukum / kebijakan' },
                                    { key: 'ai_kualifikasi_pelaksana', label: 'kualifikasi pelaksana' },
                                    { key: 'ai_keterkaitan', label: 'keterkaitan / unit terkait' },
                                    { key: 'ai_pencatatan', label: 'pencatatan & tujuan' },
                                ].map(({ key, label }) => (
                                    <div key={key}>
                                        <label style={labelStyle}>{label}</label>
                                        <textarea value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} style={textareaStyle} />
                                    </div>
                                ))}
                            </div>

                            {/* Peralatan */}
                            <div style={sectionCard}>
                                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <List size={13} /> peralatan &amp; bahan (ai_peralatan_list) — satu item per baris
                                </label>
                                <textarea value={peralatanText}
                                    onChange={(e) => setDraft({ ...draft, ai_peralatan_list: e.target.value.split('\n').filter(s => s.trim()) })}
                                    style={{ ...textareaStyle, fontFamily: 'monospace', minHeight: '80px' }} />
                            </div>

                            {/* Flowchart editor + live preview */}
                            <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        <Activity size={13} color="#60a5fa" /> mermaid diagram (ai_flowchart) → PNG
                                    </label>
                                    <button
                                        onClick={() => setDraft({ ...draft, ai_flowchart: generateMermaidFromProsedur(draft._prosedurRaw || []) })}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', padding: '0.3rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}
                                        title="Generate ulang dari daftar prosedur"
                                    >
                                        <RefreshCw size={12} /> Auto-regen
                                    </button>
                                </div>
                                <textarea
                                    value={draft.ai_flowchart}
                                    onChange={(e) => setDraft({ ...draft, ai_flowchart: e.target.value })}
                                    spellCheck="false"
                                    placeholder={'graph TD\n  A([Mulai]) --> B["Langkah 1"]\n  B --> Z([Selesai])'}
                                    style={{ width: '100%', background: 'transparent', color: '#60a5fa', border: 'none', outline: 'none', fontFamily: 'monospace', fontSize: '0.8rem', minHeight: '130px', boxSizing: 'border-box', resize: 'vertical', lineHeight: '1.6' }}
                                />

                                {/* Live preview component */}
                                {draft.ai_flowchart && <FlowchartPreview mermaidCode={draft.ai_flowchart} key={draft.ai_flowchart.length} />}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.375rem' }}>
                                    <Info size={12} color="#94a3b8" />
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Kode Mermaid di atas otomatis dikonversi ke gambar PNG oleh backend saat cetak ke Word.</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', background: 'white', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={14} /> {SOP_TEMPLATE_NAME}.docx
                            </span>
                            <button onClick={() => setShowPreview(false)} className="btn btn-outline">Batal</button>
                            <button onClick={handleDownload} disabled={isGenerating} className="btn btn-primary" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                                {isGenerating ? <Loader2 className="spin" size={18} /> : <Download size={18} />}
                                Cetak ke Word (.docx)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Shared style tokens
const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' };
const inputStyle = { width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
const inputSmStyle = { ...inputStyle, fontSize: '0.85rem', padding: '0.5rem 0.75rem' };
const textareaStyle = { width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.85rem', outline: 'none', minHeight: '72px', boxSizing: 'border-box', lineHeight: '1.5', resize: 'vertical' };
const sectionCard = { background: 'white', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' };

export default SOPGenerator;
export { SOPGenerator };
