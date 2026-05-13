// src/pages/student/MyAttendance.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';

export default function MyAttendance() {
  const { profile } = useAuth();
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selMonth, setSelMonth] = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db,'attendance'), orderBy('createdAt','desc')));
        const all  = snap.docs.map(d => ({ id:d.id, ...d.data() }));
        const mine = [];
        all.forEach(rec => {
          const r = rec.records || {};
          const entry = r[profile?.uid];
          if (entry) {
            mine.push({
              id:        rec.id,
              date:      rec.date,
              dateLabel: rec.dateLabel || rec.date,
              className: rec.className,
              teacher:   rec.teacherName,
              status:    entry.status || 'present',
            });
          }
        });
        setRecords(mine);
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    };
    if (profile?.uid) load();
  }, [profile]);

  const months = ['All', ...new Set(records.map(r => r.date?.slice(0,7)).filter(Boolean))];
  const filtered = selMonth === 'All' ? records : records.filter(r => r.date?.startsWith(selMonth));

  const present = filtered.filter(r => r.status === 'present').length;
  const absent  = filtered.filter(r => r.status === 'absent').length;
  const late    = filtered.filter(r => r.status === 'late').length;
  const total   = filtered.length;
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

  const STATUS_CFG = {
    present:{ label:'Present', color:'#27AE60', bg:'#F0FAF4', icon:'✅' },
    absent: { label:'Absent',  color:'#E63946', bg:'#FFF0F0', icon:'❌' },
    late:   { label:'Late',    color:'#F5A623', bg:'#FFFAF0', icon:'⏰' },
  };

  return (
    <Layout title="My Attendance" subtitle={`${profile?.className || ''}`}>

      {/* Summary */}
      <div style={s.summaryBanner}>
        <div style={s.summaryLeft}>
          <div style={s.attPct}>{pct}%</div>
          <div style={s.attLabel}>Attendance Rate</div>
          <div style={s.attBar}>
            <div style={{ ...s.attBarFill, width:`${pct}%`, background: pct>=90?'#7FFF00':pct>=75?'#FFC85A':'#FF6B6B' }} />
          </div>
          <div style={{ ...s.attStatus, color: pct>=90?'#7FFF00':pct>=75?'#FFC85A':'#FF6B6B' }}>
            {pct>=90?'Excellent':pct>=75?'Good':pct>=50?'Needs Improvement':'Critical'}
          </div>
        </div>
        <div style={s.summaryStats}>
          {[
            { label:'Present', value:present, icon:'✅', color:'#7FFF00' },
            { label:'Absent',  value:absent,  icon:'❌', color:'#FF6B6B' },
            { label:'Late',    value:late,    icon:'⏰', color:'#FFC85A' },
            { label:'Total',   value:total,   icon:'📋', color:'rgba(255,255,255,0.8)' },
          ].map((st, i) => (
            <div key={i} style={s.summaryStatItem}>
              <div style={{ ...s.summaryStatVal, color:st.color }}>{st.value}</div>
              <div style={s.summaryStatLabel}>{st.icon} {st.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Month filter */}
      <div style={s.monthFilter}>
        {months.map(m => (
          <button key={m}
            style={{ ...s.chip, ...(selMonth===m ? s.chipActive : {}) }}
            onClick={() => setSelMonth(m)}
          >
            {m === 'All' ? '📅 All' : m}
          </button>
        ))}
      </div>

      {/* Records */}
      <div style={s.tableCard}>
        <div style={s.tableHeader}>
          <span style={{ flex:1 }}>Date</span>
          <span>Class</span>
          <span>Teacher</span>
          <span style={{ textAlign:'center' }}>Status</span>
        </div>

        {loading ? (
          <div style={s.loadWrap}>{[1,2,3,4,5].map(i => <div key={i} style={s.skeleton} />)}</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>✅</div>
            <div style={s.emptyTitle}>No attendance records yet</div>
            <div style={s.emptySub}>Records will appear here once teachers mark attendance</div>
          </div>
        ) : (
          filtered.map((rec, i) => {
            const cfg = STATUS_CFG[rec.status] || STATUS_CFG.present;
            return (
              <div key={rec.id} style={{ ...s.tableRow, background:i%2===0?'#fff':'#F8F9FD' }}
                onMouseEnter={e => e.currentTarget.style.background='#F0F3FF'}
                onMouseLeave={e => e.currentTarget.style.background=i%2===0?'#fff':'#F8F9FD'}
              >
                <span style={{ flex:1, fontSize:14, fontWeight:600, color:'#0D1B3E' }}>
                  {rec.dateLabel || rec.date}
                </span>
                <span style={s.cell}>{rec.className}</span>
                <span style={s.cell}>{rec.teacher || '—'}</span>
                <span style={{ textAlign:'center' }}>
                  <span style={{ ...s.statusBadge, background:cfg.bg, color:cfg.color }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}

const s = {
  summaryBanner: { background:'linear-gradient(135deg,#4361EE,#2541C4)', borderRadius:20, padding:'28px 32px', marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center', gap:24 },
  summaryLeft:   { flex:1 },
  attPct:        { fontSize:56, fontWeight:900, color:'#fff', lineHeight:1, marginBottom:4 },
  attLabel:      { fontSize:13, color:'rgba(255,255,255,0.7)', marginBottom:10 },
  attBar:        { height:8, background:'rgba(255,255,255,0.2)', borderRadius:4, overflow:'hidden', marginBottom:8 },
  attBarFill:    { height:8, borderRadius:4, transition:'width 0.8s ease' },
  attStatus:     { fontSize:14, fontWeight:700 },
  summaryStats:  { display:'flex', gap:28 },
  summaryStatItem:{ textAlign:'center' },
  summaryStatVal: { fontSize:32, fontWeight:900, lineHeight:1, marginBottom:4 },
  summaryStatLabel:{ fontSize:12, color:'rgba(255,255,255,0.7)' },

  monthFilter: { display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' },
  chip:        { padding:'7px 16px', borderRadius:20, border:'1.5px solid #E8ECF4', background:'#fff', fontSize:12, fontWeight:600, color:'#8896AB', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },
  chipActive:  { borderColor:'#4361EE', background:'#EEF2FF', color:'#4361EE' },

  tableCard:   { background:'#fff', borderRadius:16, overflow:'hidden', border:'1px solid #E8ECF4', boxShadow:'0 2px 12px rgba(13,27,62,0.06)' },
  tableHeader: { display:'flex', padding:'12px 20px', background:'#0D1B3E', color:'#fff', fontSize:11, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase', gap:16 },
  tableRow:    { display:'flex', padding:'14px 20px', alignItems:'center', borderBottom:'1px solid #F0F3FA', transition:'background 0.15s', gap:16 },
  cell:        { flex:1, fontSize:13, color:'#4A5568' },
  statusBadge: { fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20 },
  loadWrap:    { padding:20 },
  skeleton:    { height:48, borderRadius:8, background:'linear-gradient(90deg,#F0F3FA 25%,#E8ECF4 50%,#F0F3FA 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite', marginBottom:8 },
  empty:       { textAlign:'center', padding:'60px 20px' },
  emptyIcon:   { fontSize:52, marginBottom:12 },
  emptyTitle:  { fontSize:16, fontWeight:700, color:'#0D1B3E', marginBottom:6 },
  emptySub:    { color:'#8896AB', fontSize:13 },
};