import React from 'react';
import babData from '../../data/akreditasiData.json';
import { hitungCapaian, hitungLevelAkreditasi, LEVEL_COLOR } from '../../constants/akreditasiConstants';
import headerImg from '../../../../assets/header.png';

const SAReportTemplate = ({ periode, skorData }) => {
    if (!periode) return null;

    // Hitung capaian per BAB
    const capaianPerBab = {};
    babData.forEach((bab) => {
        const epIds = bab.standar.flatMap((s) => s.kriteria.flatMap((k) => k.ep.map((e) => e.id)));
        const skorList = epIds.map((id) => skorData[id]?.skor ?? 0);
        capaianPerBab[bab.id] = hitungCapaian(skorList, epIds.length);
    });

    const levelAkreditasi = hitungLevelAkreditasi(capaianPerBab);
    const totalEP = babData.reduce((acc, bab) =>
        acc + bab.standar.reduce((accS, s) =>
            accS + s.kriteria.reduce((accK, k) => accK + k.ep.length, 0), 0), 0);

    const allSkor = Object.values(skorData).map(s => s.skor || 0);
    const totalCapaianNasional = hitungCapaian(allSkor, totalEP);

    return (
        <div id="sa-report-content" style={{ padding: '20px', background: 'white', width: '800px', color: '#000', fontFamily: 'Arial, sans-serif' }}>

            {/* SECTION 1: HEADER & RINGKASAN EKSEKUTIF */}
            <div className="report-section" style={{ marginBottom: '40px', textAlign: 'center' }}>
                <img src={headerImg} alt="Header" style={{ width: '100%', height: 'auto' }} />
                <div style={{ marginTop: '20px', borderTop: '2px solid #000', paddingTop: '10px' }}>
                    <h1 style={{ margin: '10px 0', fontSize: '1.6rem' }}>LAPORAN SELF-ASSESSMENT AKREDITASI</h1>
                    <h2 style={{ margin: '5px 0', fontSize: '1.2rem', color: '#475569' }}>PUSKESMAS KUNJANG</h2>
                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>PERIODE: {periode.nama.toUpperCase()}</p>
                </div>

                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '30px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '10px', minWidth: '200px' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#64748b' }}>Estimasi Kelulusan</p>
                        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold', color: LEVEL_COLOR[levelAkreditasi] }}>{levelAkreditasi}</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '10px', minWidth: '150px' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#64748b' }}>Rerata Capaian</p>
                        <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>{totalCapaianNasional}%</p>
                    </div>
                </div>
            </div>

            {/* SECTION 2: CAPAIAN PER BAB */}
            <div className="report-section" style={{ marginBottom: '40px' }}>
                <h3 style={{ borderLeft: '5px solid #0d9488', paddingLeft: '10px', marginBottom: '20px', fontSize: '1.2rem' }}>I. REKAPITULASI CAPAIAN PER BAB</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'left' }}>KODE</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'left' }}>NAMA BAB</th>
                            <th style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'center' }}>CAPAIAN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {babData.map((bab) => (
                            <tr key={bab.id}>
                                <td style={{ border: '1px solid #cbd5e1', padding: '12px', fontWeight: 'bold' }}>{bab.kode}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '12px' }}>{bab.nama}</td>
                                <td style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'center', fontWeight: '800', fontSize: '1.1rem' }}>
                                    {capaianPerBab[bab.id]}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* SECTION 3: RINCIAN PER STANDAR (BAB 1-5) */}
            {babData.map((bab) => (
                <div key={bab.id} className="report-section" style={{ marginBottom: '40px' }}>
                    <h3 style={{ borderLeft: '5px solid #0d9488', paddingLeft: '10px', marginBottom: '15px' }}>
                        II.{bab.id.replace('bab', '')} RINCIAN {bab.kode}: {bab.nama}
                    </h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left', width: '100px' }}>STANDAR</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'left' }}>URAIAN</th>
                                <th style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', width: '80px' }}>SKOR (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bab.standar.map((s) => {
                                const epList = s.kriteria.flatMap(k => k.ep.map(e => e.id));
                                const skorList = epList.map(id => skorData[id]?.skor || 0);
                                const pct = hitungCapaian(skorList, epList.length);
                                return (
                                    <tr key={s.id}>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 'bold' }}>{s.id}</td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{s.nama}</td>
                                        <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{pct}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ))}

            {/* SECTION 4: TANDA TANGAN */}
            <div className="report-section" style={{ marginTop: '60px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '50px' }}>
                    <div style={{ textAlign: 'center', width: '250px' }}>
                        <p style={{ margin: 0 }}>Mengetahui,</p>
                        <p style={{ margin: '0 0 10px 0' }}>Ketua Tim Akreditasi</p>
                        <div style={{ height: '80px' }}></div>
                        <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>( .................................... )</p>
                        <p style={{ margin: 0 }}>NIP. ............................</p>
                    </div>
                    <div style={{ textAlign: 'center', width: '250px' }}>
                        <p style={{ margin: 0 }}>Kunjang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p style={{ margin: '0 0 10px 0' }}>Kepala Puskesmas</p>
                        <div style={{ height: '80px' }}></div>
                        <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>( .................................... )</p>
                        <p style={{ margin: 0 }}>NIP. ............................</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SAReportTemplate;
