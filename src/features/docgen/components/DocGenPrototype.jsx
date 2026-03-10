import React, { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, Settings, AlertTriangle, Loader2, CheckCircle, Upload, Trash2, ChevronDown, X, Info } from 'lucide-react';
import DocxGenerator from '../utils/DocxGenerator';
import MetadataService from '../utils/MetadataService';
import AIService from '../services/AIService';
import { docGenService } from '../services/DocGenService';

const DOCUMENT_TYPES = [
    { id: 'sop', label: 'SOP (Standar Operasional Prosedur)' },
    { id: 'sk', label: 'SK (Surat Keputusan)' },
    { id: 'kak', label: 'KAK (Kerangka Acuan Kerja)' }
];

const DocGenPrototype = () => {
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [draft, setDraft] = useState(null);
    const [globalMeta] = useState(MetadataService.getGlobalMetadata());
    const [status, setStatus] = useState({ type: '', message: '' });

    // Template Management State
    const [selectedType, setSelectedType] = useState('sop');
    const [templates, setTemplates] = useState({}); // { sop: { name: '...', data: 'base64' } }
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [serverTemplates, setServerTemplates] = useState([]);

    // Preview Modal State
    const [showPreview, setShowPreview] = useState(false);
    const [previewVars, setPreviewVars] = useState([]);
    const [fieldValues, setFieldValues] = useState({});
    const [activeTemplate, setActiveTemplate] = useState('');

    // Load templates from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('minlok_doc_templates');
        if (saved) {
            try {
                setTemplates(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse templates', e);
            }
        }

        // Fetch templates from FastAPI server
        fetchServerTemplates();
    }, []);

    const fetchServerTemplates = async () => {
        try {
            const list = await docGenService.listTemplates();
            setServerTemplates(list);
        } catch (e) {
            console.error('Failed to fetch server templates', e);
        }
    };

    // Save templates to localStorage when updated
    useEffect(() => {
        localStorage.setItem('minlok_doc_templates', JSON.stringify(templates));
    }, [templates]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.docx')) {
            setStatus({ type: 'error', message: 'Hanya file .docx yang diizinkan.' });
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                // 1. Upload to FastAPI Server
                await docGenService.uploadTemplate(file);

                // 2. Keep local copy for preview if needed
                const base64 = event.target.result.split(',')[1];
                setTemplates(prev => ({
                    ...prev,
                    [selectedType]: {
                        name: file.name,
                        data: base64,
                        updatedAt: new Date().toISOString()
                    }
                }));

                // Refresh list from server
                await fetchServerTemplates();

                setStatus({ type: 'success', message: `Template ${file.name} berhasil diunggah ke server!` });
            } catch (error) {
                console.error('Upload failed:', error);
                setStatus({ type: 'error', message: 'Gagal unggah ke server: ' + error.message });
            }
        };
        reader.readAsDataURL(file);
    };

    const removeTemplate = (type) => {
        const newTemplates = { ...templates };
        delete newTemplates[type];
        setTemplates(newTemplates);
        setStatus({ type: 'success', message: `Template ${type.toUpperCase()} dihapus.` });
    };

    // Real AI Call using SumoPod AIService
    const handleGenerateAI = async () => {
        if (!prompt.trim()) return;

        setGenerating(true);
        setStatus({ type: '', message: '' });

        try {
            const aiResponse = await AIService.generateDocument(prompt, selectedType, globalMeta);

            // Validate response has required fields or set defaults
            const formattedDraft = {
                judul: aiResponse.judul || prompt.toUpperCase(),
                pengertian: aiResponse.pengertian || '',
                tujuan: aiResponse.tujuan || '',
                kebijakan: aiResponse.kebijakan || '',
                prosedur: aiResponse.prosedur || [],
                unit_terkait: aiResponse.unit_terkait || '',
                pengusul: aiResponse.pengusul || '',
                flowchart: aiResponse.flowchart || '',
                nomor_sk: aiResponse.nomor_sk || "440/ / /2025",
                tanggal_sk: aiResponse.tanggal_sk || new Date().toLocaleDateString('id-ID')
            };

            setDraft(formattedDraft);
            setStatus({ type: 'success', message: 'Draf berhasil dibuat oleh AI SumoPod!' });
        } catch (error) {
            console.error('Generation Failed:', error);
            setStatus({
                type: 'error',
                message: `Gagal generate AI: ${error.message || 'Cek koneksi atau API Key.'}`
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleOpenPreview = async () => {
        if (!draft) return;

        setGenerating(true);
        try {
            // 1. Determine template name
            let templateName = selectedType === 'sop' ? 'sop_template' :
                selectedType === 'sk' ? 'sk_sample' : selectedType;

            const currentTemplate = templates[selectedType];
            if (currentTemplate) {
                templateName = currentTemplate.name.replace('.docx', '');
            }
            setActiveTemplate(templateName);

            // 2. Get variables from server
            const vars = await docGenService.getTemplateVariables(templateName);
            setPreviewVars(vars);

            // 3. Map AI Draft & Global Meta to these variables
            const initialValues = {};

            // Helpful mapping logic
            vars.forEach(v => {
                const key = v.toLowerCase();

                // Try to find matching data in draft or globalMeta
                if (draft[key] !== undefined) {
                    initialValues[v] = Array.isArray(draft[key]) ? draft[key].join('\n') : draft[key];
                } else if (globalMeta[key] !== undefined) {
                    initialValues[v] = globalMeta[key];
                } else if (key.includes('judul')) {
                    initialValues[v] = draft.judul;
                } else if (key.includes('prosedur')) {
                    // Flatten prosedur for single field if needed
                    initialValues[v] = Array.isArray(draft.prosedur) ? draft.prosedur.join('\n') : draft.prosedur;
                } else if (key.includes('tanggal')) {
                    initialValues[v] = new Date().toLocaleDateString('id-ID');
                } else if (key.includes('puskesmas')) {
                    initialValues[v] = globalMeta.nama_puskesmas || 'PUSKESMAS KUNJANG';
                } else {
                    initialValues[v] = ''; // Default empty
                }
            });

            setFieldValues(initialValues);
            setShowPreview(true);
        } catch (error) {
            console.error('Preview Error:', error);
            setStatus({ type: 'error', message: 'Gagal memuat pratinjau: ' + error.message });
        } finally {
            setGenerating(false);
        }
    };

    const handleFinalDownload = async () => {
        setGenerating(true);
        try {
            const finalData = {
                ...fieldValues,
                tanggal_terbit: fieldValues['tanggal_terbit'] || new Date().toLocaleDateString('id-ID')
            };

            await docGenService.generateDocument(activeTemplate, finalData);
            setShowPreview(false);
            setStatus({ type: 'success', message: 'Dokumen berhasil diunduh!' });
        } catch (error) {
            console.error('Download Error:', error);
            setStatus({ type: 'error', message: 'Gagal generate: ' + error.message });
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = async () => {
        // Direct download is now replaced by Preview
        handleOpenPreview();
    };

    return (
        <div className="docgen-container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header with Template Manager Toggle */}
            <div className="header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <FileText size={32} color="var(--primary)" />
                    <div>
                        <h2 style={{ margin: 0 }}>AI Document Generator</h2>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Pilih jenis dokumen, generate isi via AI, dan cetak ke Word.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowTemplateManager(!showTemplateManager)}
                    className={`btn ${showTemplateManager ? 'btn-primary' : 'btn-outline'}`}
                >
                    <Settings size={18} />
                    <span>Manage Templates</span>
                </button>
            </div>

            <div className="template-manager" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Pengaturan Template (Server Side)</h3>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {serverTemplates.length} template tersedia di server
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {DOCUMENT_TYPES.map(type => {
                        // Check if this type has a matching template on server
                        const hasOnServer = serverTemplates.some(t =>
                            t.toLowerCase().includes(type.id.toLowerCase())
                        );

                        return (
                            <div key={type.id} style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', position: 'relative' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    {type.label}
                                    {hasOnServer && <span style={{ color: '#059669', fontSize: '0.7rem' }}>● Server Ready</span>}
                                </div>
                                {templates[type.id] ? (
                                    <div style={{ fontSize: '0.8rem', color: '#166534', background: '#f0fdf4', padding: '0.5rem', borderRadius: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                            <CheckCircle size={12} style={{ marginRight: '4px' }} />
                                            {templates[type.id].name}
                                        </span>
                                        <button onClick={() => removeTemplate(type.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem', border: '1px dashed #e2e8f0', borderRadius: '0.4rem' }}>
                                        {hasOnServer ? 'Menggunakan template bawaan server.' : 'Belum ada template khusus.'}
                                    </div>
                                )}
                                <div style={{ marginTop: '0.75rem' }}>
                                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}>
                                        <Upload size={14} style={{ marginRight: '4px' }} />
                                        Upload Ke Server
                                        <input type="file" accept=".docx" onChange={(e) => { setSelectedType(type.id); handleFileUpload(e); }} style={{ display: 'none' }} />
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
                {/* Left Side: Control */}
                <div className="input-section">
                    <div className="card" style={{ padding: '1.5rem', background: 'white', borderRadius: '1rem', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>JENIS DOKUMEN</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', appearance: 'none', background: 'white', fontSize: '0.95rem' }}
                                >
                                    {DOCUMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                                <ChevronDown size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                            </div>
                        </div>

                        <h4 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={18} color="#8b5cf6" />
                            Instruksi AI
                        </h4>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={`Contoh: Buat ${selectedType.toUpperCase()} tentang...`}
                            style={{ width: '100%', minHeight: '120px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', marginBottom: '1rem', outline: 'none' }}
                        />
                        <button
                            onClick={handleGenerateAI}
                            disabled={generating || !prompt}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            {generating ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                            <span>Generate Draft AI</span>
                        </button>
                    </div>

                    {status.message && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem',
                            background: status.type === 'error' ? '#fef2f2' : '#f0fdf4',
                            color: status.type === 'error' ? '#991b1b' : '#166534',
                            border: `1px solid ${status.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            {status.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                            {status.message}
                        </div>
                    )}
                </div>

                {/* Right Side: Preview */}
                <div className="preview-section">
                    {!draft && !generating ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border)', borderRadius: '1rem', padding: '2rem', textAlign: 'center' }}>
                            <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>Draf isi dokumen akan muncul di sini. Silakan pilih jenis dokumen dan ketik instruksi di samping.</p>
                        </div>
                    ) : generating ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '1rem', border: '1px solid var(--border)', padding: '2rem' }}>
                            <Loader2 className="spin" size={48} color="var(--primary)" />
                            <p style={{ marginTop: '1rem' }}>AI sedang menyusun struktur {selectedType.toUpperCase()}...</p>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '1.5rem', background: 'white', borderRadius: '1rem', border: '2px solid var(--primary-light)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>Pratinjau Draf {selectedType.toUpperCase()}</h3>
                                    <div style={{ fontSize: '0.8rem', color: templates[selectedType] ? '#166534' : '#b45309', fontWeight: 'bold', marginTop: '4px' }}>
                                        {templates[selectedType] ? `✅ Menggunakan Template: ${templates[selectedType].name}` : '⚠️ Menggunakan Template Default'}
                                    </div>
                                </div>
                                <button onClick={handleDownload} className="btn btn-primary">
                                    <Download size={18} />
                                    <span>Download .DOCX</span>
                                </button>
                            </div>

                            <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                <div>
                                    <label style={{ fontWeight: '700', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Judul Dokumen</label>
                                    <textarea
                                        value={draft.judul}
                                        onChange={(e) => setDraft({ ...draft, judul: e.target.value })}
                                        style={{ width: '100%', border: 'none', borderBottom: '1px solid #eee', padding: '4px 0', fontSize: '1.1rem', fontWeight: 'bold', outline: 'none', resize: 'none' }}
                                        rows={2}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontWeight: '700', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Isi Utama / Pengertian</label>
                                    <textarea
                                        value={draft.pengertian}
                                        onChange={(e) => setDraft({ ...draft, pengertian: e.target.value })}
                                        style={{ width: '100%', minHeight: '100px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', lineHeight: '1.6' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontWeight: '700', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Langkah-langkah / Prosedur</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                        {draft.prosedur.map((p, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                <span style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{i + 1}.</span>
                                                <textarea
                                                    value={p}
                                                    onChange={(e) => {
                                                        const newProc = [...draft.prosedur];
                                                        newProc[i] = e.target.value;
                                                        setDraft({ ...draft, prosedur: newProc });
                                                    }}
                                                    style={{ flex: 1, border: 'none', borderBottom: '1px solid #f1f5f9', outline: 'none', resize: 'none' }}
                                                    rows={1}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Flowchart Preview Section (Mermaid) */}
                                <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                    <label style={{ fontWeight: '700', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        Flowchart (Mermaid Code)
                                    </label>
                                    <code style={{ display: 'block', whiteSpace: 'pre', padding: '1rem', background: '#0f172a', color: '#38bdf8', borderRadius: '0.5rem', fontSize: '0.8rem', overflowX: 'auto' }}>
                                        {draft.flowchart}
                                    </code>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                        * Gunakan penanda <code>{'{flowchart}'}</code> di file Word untuk memasukkan kode ini.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Preview & Edit Modal */}
            {showPreview && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="card" style={{
                        width: '90%', maxWidth: '800px', maxHeight: '90vh',
                        background: 'white', borderRadius: '1.25rem', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                    }}>
                        <div style={{
                            padding: '1.25rem 1.5rem', borderBottom: '1px solid #eee',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'var(--primary)', color: 'white'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Settings size={20} />
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Data Mapping & Preview</h3>
                            </div>
                            <button onClick={() => setShowPreview(false)} style={{ border: 'none', background: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                            <div style={{
                                background: '#f0f9ff', border: '1px solid #bae6fd',
                                padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
                                display: 'flex', gap: '0.75rem'
                            }}>
                                <Info size={20} color="#0369a1" style={{ flexShrink: 0 }} />
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#0369a1' }}>
                                    Berikut adalah variabel yang ditemukan di template <strong>{activeTemplate}.docx</strong>.
                                    Data di bawah sudah diisi otomatis oleh AI, silakan koreksi jika ada yang kurang tepat.
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                {previewVars.map(v => (
                                    <div key={v}>
                                        <label style={{
                                            display: 'block', fontSize: '0.75rem', fontWeight: '700',
                                            color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase'
                                        }}>
                                            {v.replace(/_/g, ' ')}
                                        </label>
                                        <input
                                            type="text"
                                            value={fieldValues[v] || ''}
                                            onChange={(e) => setFieldValues({ ...fieldValues, [v]: e.target.value })}
                                            style={{
                                                width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem',
                                                border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none'
                                            }}
                                        />
                                    </div>
                                ))}
                                {previewVars.length === 0 && (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        Tidak ada variabel yang perlu di-mapping khusus.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{
                            padding: '1.25rem 1.5rem', borderTop: '1px solid #eee',
                            display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#f8fafc'
                        }}>
                            <button onClick={() => setShowPreview(false)} className="btn btn-outline">
                                Batal
                            </button>
                            <button onClick={handleFinalDownload} disabled={generating} className="btn btn-primary" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                                {generating ? <Loader2 className="spin" size={18} /> : <Download size={18} />}
                                <span>Cetak Dokumen Sekarang</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocGenPrototype;
