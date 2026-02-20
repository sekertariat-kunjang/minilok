import React, { useState, useEffect } from 'react';
import { User, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react';
import financeService from '../services/FinanceService';

const FinanceSettings = () => {
    const [personnel, setPersonnel] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('PETUGAS');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadPersonnel();
    }, []);

    const loadPersonnel = async () => {
        try {
            setLoading(true);
            const data = await financeService.getPersonnel();
            setPersonnel(data);
        } catch (error) {
            console.error('Failed to load personnel:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            setSubmitting(true);
            await financeService.addPersonnel(newName, newRole);
            setNewName('');
            loadPersonnel();
        } catch (error) {
            alert('Gagal menambah personel');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus personel ini?')) return;
        try {
            await financeService.deletePersonnel(id);
            loadPersonnel();
        } catch (error) {
            alert('Gagal menghapus personel');
        }
    };

    if (loading) return <div className="loading-state">Memuat data pengaturan...</div>;

    const petugas = personnel.filter(p => p.role === 'PETUGAS');
    const evaluators = personnel.filter(p => p.role === 'EVALUATOR');

    return (
        <div className="finance-settings-container">
            <div className="settings-card add-personnel-card">
                <h3>Tambah Personel Baru</h3>
                <form onSubmit={handleAdd} className="settings-form">
                    <div className="form-group">
                        <label>Nama Lengkap</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Masukkan nama..."
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Role plotting</label>
                        <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                            <option value="PETUGAS">Petugas (Pelaksana)</option>
                            <option value="EVALUATOR">Evaluator (Pemeriksa)</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                        {submitting ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
                        <span>Tambah Ke Daftar</span>
                    </button>
                </form>
            </div>

            <div className="settings-grid">
                <div className="settings-card">
                    <div className="card-header">
                        <User size={18} />
                        <h3>Daftar Petugas</h3>
                    </div>
                    <div className="personnel-list">
                        {petugas.length === 0 && <p className="empty-msg">Belum ada petugas</p>}
                        {petugas.map(p => (
                            <div key={p.id} className="personnel-item">
                                <span>{p.name}</span>
                                <button className="delete-btn" onClick={() => handleDelete(p.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="settings-card">
                    <div className="card-header">
                        <AlertCircle size={18} />
                        <h3>Daftar Evaluator</h3>
                    </div>
                    <div className="personnel-list">
                        {evaluators.length === 0 && <p className="empty-msg">Belum ada evaluator</p>}
                        {evaluators.map(p => (
                            <div key={p.id} className="personnel-item">
                                <span>{p.name}</span>
                                <button className="delete-btn" onClick={() => handleDelete(p.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceSettings;
