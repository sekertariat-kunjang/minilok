import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, BarChart3, Settings, PlusCircle,
  ChevronRight, ChevronDown, ClipboardCheck, Activity, DollarSign
} from 'lucide-react';
import { CLUSTERS } from './features/minlok/constants/minlokConstants';
import { MONTHS } from './core/constants/globalConstants';
import './index.css';

import Dashboard from './features/minlok/components/Dashboard';
import DataEntry from './features/minlok/components/DataEntry';
import Analysis from './features/minlok/components/Analysis';
import PDCA from './features/minlok/components/PDCA';
import SelfAssessment from './features/akreditasi/components/SelfAssessment';
import FinanceKanban from './features/finance/components/FinanceKanban';
import PublicReportForm from './features/finance/components/PublicReportForm';
import PublicEvaluationForm from './features/finance/components/PublicEvaluationForm';
import FinanceSettings from './features/finance/components/FinanceSettings';

const MODULE_MINLOK = 'minlok';
const MODULE_AKREDITASI = 'akreditasi';
const MODULE_FINANCE = 'finance';

function App() {
  const [activeModule, setActiveModule] = useState(MODULE_MINLOK);
  const [openAccordion, setOpenAccordion] = useState(MODULE_MINLOK);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCluster, setSelectedCluster] = useState(CLUSTERS[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Public Link Logic (Petugas/Evaluator)
  const [publicView, setPublicView] = useState(null); // { type: 'report'|'evaluate', token: '...' }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const petugasToken = params.get('petugas_token');
    const evaluatorToken = params.get('evaluator_token');

    if (petugasToken) {
      setPublicView({ type: 'report', token: petugasToken });
    } else if (evaluatorToken) {
      setPublicView({ type: 'evaluate', token: evaluatorToken });
    }
  }, []);

  const minlokTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'entry', label: 'Input Data', icon: <PlusCircle size={18} /> },
    { id: 'analysis', label: 'Analisis & Tren', icon: <BarChart3 size={18} /> },
    { id: 'pdca', label: 'PDCA', icon: <FileText size={18} /> },
  ];

  const toggleAccordion = (mod) => {
    setOpenAccordion((prev) => (prev === mod ? null : mod));
  };

  const selectMinlokTab = (tabId) => {
    setActiveTab(tabId);
    setActiveModule(MODULE_MINLOK);
    setOpenAccordion(MODULE_MINLOK);
  };

  const selectAkreditasi = () => {
    setActiveModule(MODULE_AKREDITASI);
    setOpenAccordion(MODULE_AKREDITASI);
  };

  const selectFinance = () => {
    setActiveModule(MODULE_FINANCE);
    setOpenAccordion(MODULE_FINANCE);
  };

  const headerTitle =
    activeModule === MODULE_AKREDITASI
      ? 'Self-Assessment Akreditasi'
      : activeModule === MODULE_FINANCE
        ? activeTab === 'settings' ? 'Pengaturan Personel Keuangan' : 'Pelacakan Pencairan Dana'
        : minlokTabs.find((t) => t.id === activeTab)?.label ?? '';

  const headerSubtitle =
    activeModule === MODULE_AKREDITASI
      ? 'Akreditasi Puskesmas 2023'
      : activeModule === MODULE_FINANCE
        ? 'Workflow Manajemen Keuangan'
        : 'Sistem Pemantauan Kinerja Bulanan';

  if (publicView) {
    return (
      <div className="app-container public-mode">
        {publicView.type === 'report' ? (
          <PublicReportForm token={publicView.token} />
        ) : (
          <PublicEvaluationForm token={publicView.token} />
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '1px' }}>PUSAKA</h1>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem', lineHeight: '1.4' }}>
            Pusat Data Kinerja Puskesmas Kunjang
          </p>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {/* ─── Accordion: Minlok ─── */}
          <div className="accordion-group">
            <button
              className={`accordion-header ${openAccordion === MODULE_MINLOK ? 'open' : ''} ${activeModule === MODULE_MINLOK ? 'module-active' : ''}`}
              onClick={() => toggleAccordion(MODULE_MINLOK)}
            >
              <span className="accordion-header-content">
                <Activity size={18} />
                <span>Minlok</span>
              </span>
              {openAccordion === MODULE_MINLOK
                ? <ChevronDown size={16} />
                : <ChevronRight size={16} />}
            </button>

            <div className={`accordion-body ${openAccordion === MODULE_MINLOK ? 'open' : ''}`}>
              <ul className="nav-list">
                {minlokTabs.map((tab) => (
                  <li
                    key={tab.id}
                    className={`nav-item nav-child ${activeModule === MODULE_MINLOK && activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => selectMinlokTab(tab.id)}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ─── Accordion: Akreditasi ─── */}
          <div className="accordion-group">
            <button
              className={`accordion-header ${openAccordion === MODULE_AKREDITASI ? 'open' : ''} ${activeModule === MODULE_AKREDITASI ? 'module-active' : ''}`}
              onClick={() => toggleAccordion(MODULE_AKREDITASI)}
            >
              <span className="accordion-header-content">
                <ClipboardCheck size={18} />
                <span>Akreditasi</span>
              </span>
              {openAccordion === MODULE_AKREDITASI
                ? <ChevronDown size={16} />
                : <ChevronRight size={16} />}
            </button>

            <div className={`accordion-body ${openAccordion === MODULE_AKREDITASI ? 'open' : ''}`}>
              <ul className="nav-list">
                <li
                  className={`nav-item nav-child ${activeModule === MODULE_AKREDITASI ? 'active' : ''}`}
                  onClick={selectAkreditasi}
                >
                  <ClipboardCheck size={18} />
                  <span>Self-Assessment</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ─── Accordion: Keuangan ─── */}
          <div className="accordion-group">
            <button
              className={`accordion-header ${openAccordion === MODULE_FINANCE ? 'open' : ''} ${activeModule === MODULE_FINANCE ? 'module-active' : ''}`}
              onClick={() => toggleAccordion(MODULE_FINANCE)}
            >
              <span className="accordion-header-content">
                <DollarSign size={18} />
                <span>Keuangan</span>
              </span>
              {openAccordion === MODULE_FINANCE
                ? <ChevronDown size={16} />
                : <ChevronRight size={16} />}
            </button>

            <div className={`accordion-body ${openAccordion === MODULE_FINANCE ? 'open' : ''}`}>
              <ul className="nav-list">
                <li
                  className={`nav-item nav-child ${activeModule === MODULE_FINANCE && activeTab !== 'settings' ? 'active' : ''}`}
                  onClick={() => { selectFinance(); setActiveTab('tracking'); }}
                >
                  <BarChart3 size={18} />
                  <span>Tracking Dana</span>
                </li>
                <li
                  className={`nav-item nav-child ${activeModule === MODULE_FINANCE && activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => { selectFinance(); setActiveTab('settings'); }}
                >
                  <Settings size={18} />
                  <span>Pengaturan Personel</span>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="nav-item">
            <Settings size={20} />
            <span>Pengaturan</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header>
          <div className="header-title">
            <h2>{headerTitle}</h2>
            <p>{headerSubtitle}</p>
          </div>

          {/* Hanya tampilkan filter bulan/tahun untuk modul Minlok */}
          {activeModule === MODULE_MINLOK && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                style={{ width: 'auto' }}
              >
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{ width: 'auto' }}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          )}
        </header>

        {/* Dynamic Content */}
        {activeModule === MODULE_AKREDITASI && <SelfAssessment />}

        {activeModule === MODULE_MINLOK && activeTab === 'dashboard' && (
          <Dashboard month={selectedMonth} year={selectedYear} cluster={selectedCluster} onClusterChange={setSelectedCluster} />
        )}
        {activeModule === MODULE_MINLOK && activeTab === 'entry' && (
          <DataEntry month={selectedMonth} year={selectedYear} />
        )}
        {activeModule === MODULE_MINLOK && activeTab === 'analysis' && (
          <Analysis month={selectedMonth} year={selectedYear} />
        )}
        {activeModule === MODULE_MINLOK && activeTab === 'pdca' && (
          <PDCA month={selectedMonth} year={selectedYear} />
        )}

        {activeModule === MODULE_FINANCE && activeTab !== 'settings' && (
          <FinanceKanban />
        )}

        {activeModule === MODULE_FINANCE && activeTab === 'settings' && (
          <FinanceSettings />
        )}
      </main>
    </div>
  );
}

export default App;
