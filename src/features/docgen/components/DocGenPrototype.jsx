import React, { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, Settings, AlertTriangle, Loader2, CheckCircle, Upload, Trash2, ChevronDown } from 'lucide-react';
import DocxGenerator from '../utils/DocxGenerator';
import MetadataService from '../utils/MetadataService';
import AIService from '../services/AIService';

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
    }, []);

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
        reader.onload = (event) => {
            const base64 = event.target.result.split(',')[1];
            setTemplates(prev => ({
                ...prev,
                [selectedType]: {
                    name: file.name,
                    data: base64,
                    updatedAt: new Date().toISOString()
                }
            }));
            setStatus({ type: 'success', message: `Template ${selectedType.toUpperCase()} berhasil diunggah!` });
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

    const handleDownload = async () => {
        if (!draft) return;

        try {
            const currentTemplate = templates[selectedType];
            let templateSource;

            if (currentTemplate) {
                // Convert Base64 back to ArrayBuffer
                const binaryString = window.atob(currentTemplate.data);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                templateSource = bytes.buffer;
            } else {
                // Fallback to default in public folder
                templateSource = `/templates/${selectedType.toUpperCase()}_Template.docx`;
            }

            const finalData = {
                ...globalMeta,
                ...draft,
                prosedur_list: draft.prosedur.map((text, index) => ({ step: text, num: index + 1 })),
                tanggal_terbit: new Date().toLocaleDateString('id-ID')
            };

            const typeLabel = DOCUMENT_TYPES.find(t => t.id === selectedType)?.id.toUpperCase();
            await DocxGenerator.generate(templateSource, finalData, `${typeLabel}_${draft.judul.replace(/\s+/g, '_')}.docx`);

            setStatus({ type: 'success', message: 'Dokumen berhasil diunduh!' });
        } catch (error) {
            console.error(error);
            setStatus({
                type: 'error',
                message: 'Gagal generate. Pastikan template sudah diunggah atau ada di folder public/templates.'
            });
        }
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

            {/* Template Manager Panel */}
            {showTemplateManager && (
                <div className="template-manager" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1.1rem', marginBottom: '1rem' }}>Pengaturan Template (.docx)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                        {DOCUMENT_TYPES.map(type => (
                            <div key={type.id} style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', position: 'relative' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{type.label}</div>
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
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem', border: '1px dashed #e2e8f0', borderRadius: '0.4rem' }}>Belum ada template.</div>
                                )}
                                <div style={{ marginTop: '0.75rem' }}>
                                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}>
                                        <Upload size={14} style={{ marginRight: '4px' }} />
                                        Upload Baru
                                        <input type="file" accept=".docx" onChange={(e) => { setSelectedType(type.id); handleFileUpload(e); }} style={{ display: 'none' }} />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
        </div>
    );
};

export default DocGenPrototype;
