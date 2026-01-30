import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, BarChart3, Settings, PlusCircle, ChevronRight, PieChart } from 'lucide-react';
import { CLUSTERS, MONTHS } from './constants/appConstants';
import './index.css';

// Components (To be created)
import Dashboard from './components/Dashboard';
import DataEntry from './components/DataEntry';
import Analysis from './components/Analysis';
import PDCA from './components/PDCA';
import ReportTemplate from './components/ReportTemplate';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCluster, setSelectedCluster] = useState(CLUSTERS[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exportFilter, setExportFilter] = useState([]); // Array of activityIds

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'entry', label: 'Input Data', icon: <PlusCircle size={20} /> },
    { id: 'analysis', label: 'Analisis & Tren', icon: <BarChart3 size={20} /> },
    { id: 'pdca', label: 'PDCA', icon: <FileText size={20} /> },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>MINILOK</h1>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>E-Kinerja Puskesmas</p>
        </div>

        <nav>
          <ul className="nav-list">
            {tabs.map(tab => (
              <li
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
            <h2>{tabs.find(t => t.id === activeTab).label}</h2>
            <p>Sistem Pemantauan Kinerja Bulanan</p>
          </div>

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
        </header>

        {/* Dynamic Content */}
        {activeTab === 'dashboard' && (
          <Dashboard
            month={selectedMonth}
            year={selectedYear}
            cluster={selectedCluster}
            onClusterChange={setSelectedCluster}
            onFilterChange={setExportFilter}
          />
        )}

        {activeTab === 'entry' && (
          <DataEntry
            month={selectedMonth}
            year={selectedYear}
          />
        )}

        {activeTab === 'analysis' && (
          <Analysis
            month={selectedMonth}
            year={selectedYear}
          />
        )}

        {activeTab === 'pdca' && (
          <PDCA
            month={selectedMonth}
            year={selectedYear}
          />
        )}
      </main>
      {/* Hidden Report Template for PDF Export */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', background: 'white' }}>
        <ReportTemplate
          cluster={selectedCluster}
          month={selectedMonth}
          year={selectedYear}
          filterActivityIds={exportFilter}
        />
      </div>
    </div>
  );
}

export default App;
