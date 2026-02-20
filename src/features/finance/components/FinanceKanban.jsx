import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Search, Filter, MoreVertical,
    User, Calendar, DollarSign, ArrowRight,
    AlertCircle, CheckCircle2, Clock, Maximize2, Minimize2,
    ChevronLeft, ChevronRight, LayoutGrid, Layers
} from 'lucide-react';
import financeService from '../services/FinanceService';
import { FINANCE_STATUS, STATUS_LABELS, WORKFLOW_ORDER } from '../constants/financeConstants';
import ActivityDetailModal from './ActivityDetailModal';
import CreateActivityModal from './CreateActivityModal';

const FinanceKanban = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isCompact, setIsCompact] = useState(false);
    const [activeStage, setActiveStage] = useState('persiapan');

    const boardRef = useRef(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = async () => {
        try {
            setLoading(true);
            const data = await financeService.getActivities();
            setActivities(data);
        } catch (error) {
            console.error('Error loading finance activities:', error);
        } finally {
            setLoading(false);
        }
    };

    // Stage Navigation Logic
    const stages = [
        { id: 'persiapan', label: 'Persiapan', columns: [FINANCE_STATUS.DRAFT, FINANCE_STATUS.PENDING_PPTK] },
        { id: 'pelaksanaan', label: 'Pelaksanaan', columns: [FINANCE_STATUS.PENDING_REPORT, FINANCE_STATUS.PENDING_EVALUATION] },
        {
            id: 'penyelesaian', label: 'Penyelesaian', columns: [
                FINANCE_STATUS.PENDING_BPP, FINANCE_STATUS.PENDING_REQUEST,
                FINANCE_STATUS.PENDING_KAPUS, FINANCE_STATUS.PENDING_CROSSCHECK,
                FINANCE_STATUS.COMPLETED
            ]
        }
    ];

    const scrollToStage = (stageId) => {
        const stage = stages.find(s => s.id === stageId);
        if (!stage || !boardRef.current) return;

        const firstCol = boardRef.current.querySelector(`[data-status="${stage.columns[0]}"]`);
        if (firstCol) {
            boardRef.current.scrollTo({
                left: firstCol.offsetLeft - 20,
                behavior: 'smooth'
            });
            setActiveStage(stageId);
        }
    };

    // Draggable Board Logic
    const handleMouseDown = (e) => {
        // Only allow drag if clicking on the board background, not on cards
        if (e.target.closest('.kanban-card') || e.target.closest('.btn')) return;

        isDragging.current = true;
        startX.current = e.pageX - boardRef.current.offsetLeft;
        scrollLeft.current = boardRef.current.scrollLeft;
        boardRef.current.style.cursor = 'grabbing';
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
        if (boardRef.current) boardRef.current.style.cursor = 'grab';
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (boardRef.current) boardRef.current.style.cursor = 'grab';
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();
        const x = e.pageX - boardRef.current.offsetLeft;
        const walk = (x - startX.current) * 2; // Scroll speed
        boardRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const filteredActivities = activities.filter(act =>
        act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (act.petugas_name && act.petugas_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getActivitiesByStatus = (status) => {
        return filteredActivities.filter(act => act.status === status);
    };

    if (loading) {
        return <div className="loading-state">Memuat data keuangan...</div>;
    }

    return (
        <div className={`finance-kanban-container ${isCompact ? 'is-compact' : ''}`}>
            <div className="kanban-top-nav">
                <div className="stage-navigation">
                    {stages.map(stage => (
                        <button
                            key={stage.id}
                            className={`stage-btn ${activeStage === stage.id ? 'active' : ''}`}
                            onClick={() => scrollToStage(stage.id)}
                        >
                            {stage.label}
                        </button>
                    ))}
                </div>

                <div className="kanban-controls">
                    <button
                        className={`ux-toggle-btn ${isCompact ? 'active' : ''}`}
                        onClick={() => setIsCompact(!isCompact)}
                        title={isCompact ? 'Tampilan Standar' : 'Tampilan Kompak'}
                    >
                        {isCompact ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                        <span>{isCompact ? 'Standar' : 'Kompres'}</span>
                    </button>
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Cari kegiatan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={18} />
                        <span>Baru</span>
                    </button>
                </div>
            </div>

            <div
                className="kanban-board"
                ref={boardRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ cursor: 'grab' }}
            >
                {WORKFLOW_ORDER.map(status => (
                    <div key={status} className="kanban-column" data-status={status}>
                        <div className="column-header">
                            <h3>{STATUS_LABELS[status]}</h3>
                            <span className="count">{getActivitiesByStatus(status).length}</span>
                        </div>
                        <div className="column-content">
                            {getActivitiesByStatus(status).length === 0 ? (
                                <div className="empty-column-state">Kosong</div>
                            ) : (
                                getActivitiesByStatus(status).map(activity => (
                                    <ActivityCard
                                        key={activity.id}
                                        activity={activity}
                                        isCompact={isCompact}
                                        onClick={() => setSelectedActivity(activity)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showCreate && (
                <CreateActivityModal
                    onClose={() => setShowCreate(false)}
                    onRefresh={loadActivities}
                />
            )}

            {selectedActivity && (
                <ActivityDetailModal
                    activity={selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                    onRefresh={loadActivities}
                />
            )}
        </div>
    );
};

const ActivityCard = ({ activity, onClick, isCompact }) => {
    return (
        <div className="kanban-card" onClick={onClick}>
            <div className="card-top">
                <h4>{activity.title}</h4>
            </div>

            <div className="card-info">
                {!isCompact && (
                    <div className="info-item budget">
                        <DollarSign size={14} />
                        <span>Rp {new Intl.NumberFormat('id-ID').format(activity.budget)}</span>
                    </div>
                )}
                {activity.petugas_name && (
                    <div className="info-item">
                        <User size={14} />
                        <span>{activity.petugas_name}</span>
                    </div>
                )}
                {!isCompact && activity.activity_date && (
                    <div className="info-item">
                        <Calendar size={14} />
                        <span>{activity.activity_date}</span>
                    </div>
                )}
            </div>

            <div className="card-footer">
                <div className="status-indicator">
                    {activity.rejection_note && (
                        <AlertCircle size={14} className="text-red" title="Ada catatan penolakan" />
                    )}
                    <span className="timestamp">
                        <Clock size={12} />
                        {new Date(activity.updated_at).toLocaleDateString('id-ID')}
                    </span>
                </div>
                {isCompact && (
                    <div className="compact-budget">
                        Rp {new Intl.NumberFormat('id-ID').format(activity.budget)}
                    </div>
                )}
                {!isCompact && (
                    <div className="btn-next">
                        <ArrowRight size={14} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinanceKanban;
