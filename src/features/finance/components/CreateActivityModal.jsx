import React, { useState } from 'react';
import { X, DollarSign, Loader2 } from 'lucide-react';
import financeService from '../services/FinanceService';

const CreateActivityModal = ({ onClose, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [budget, setBudget] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await financeService.createActivity({
                title,
                budget: Number(budget),
                description
            });
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Failed to create activity:', error);
            alert('Gagal membuat kegiatan: ' + (error.message || error.details || 'Error tidak diketahui'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sa-modal-overlay">
            <div className="sa-modal">
                <div className="modal-header">
                    <h2>Buat Kegiatan Baru</h2>
                    <button className="close-btn" onClick={onClose}><X /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Judul Kegiatan</label>
                        <input
                            required
                            type="text"
                            placeholder="Contoh: Belanja Bahan Bakar Pusling"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Pagu Anggaran (Rp)</label>
                        <div className="input-with-icon">
                            <DollarSign size={18} />
                            <input
                                required
                                type="number"
                                placeholder="0"
                                value={budget}
                                onChange={e => setBudget(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Deskripsi/Tujuan Kegiatan</label>
                        <textarea
                            placeholder="Contoh: Untuk mendukung operasional Puskesmas Keliling..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <Loader2 className="spin" /> : 'Buat Card'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateActivityModal;
