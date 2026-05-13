// src/pages/teacher/MarkAttendance.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const CLASSES = ['Grade 10A','Grade 10B','Grade 11A','Grade 11B','Grade 12A','Grade 12B'];
const STATUS  = {
  present:{ label:'Present', short:'P', color:'#27AE60', bg:'#F0FAF4' },
  absent: { label:'Absent',  short:'A', color:'#E63946', bg:'#FFF0F0' },
  late:   { label:'Late',    short:'L', color:'#F5A623', bg:'#FFFAF0' },
};

export default function MarkAttendance() {
  const { profile } = useAuth();
  const today       = new Date();
  const todayStr    = today.toISOString().split('T')[0];
  const todayLabel  = today.toDateString();

  const [selClass,  setSelClass]  = useState(CLASSES[0]);
  const [students,  setStudents]  = useState([]);
  const [records,   setRecords]   = useState({});
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadStudents(selClass);
    setSubmitted(false);
  }, [selClass]);

  const loadStudents = async (className) => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db,'students'));
      const all  = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      const cls  = all.filter(s => s.className?.toLowerCase().trim() === className?.toLowerCase().trim());
      setStudents(cls);
      const init = {};
      cls.forEach(s => { init[s.uid || s.id] = 'present'; });
      setRecords(init);
    } catch (e) { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  const cycleStatus = (id) => {
    setRecords(prev => ({
      ...prev,
      [id]: prev[id]==='present' ? 'absent' : prev[id]==='absent' ? 'late' : 'present',
    }));
  };

  const markAll = (status) => {
    const all = {};
    students.forEach(s => { all[s.uid || s.id] = status; });
    setRecords(all);
  };

  const counts = {
    present: Object.values(records).filter(v => v==='present').length,
    absent:  Object.values(records).filter(v => v==='absent').length,
    late:    Object.values(records).filter(v => v==='late').length,
  };

  const handleSave = async () => {
    if (students.length === 0) { toast.error('No students in this class.'); return; }
    setSaving(true);
    try {
      const detailedRecords = {};
      students.forEach(s => {
        const uid = s.uid || s.id;
        detailedRecords[uid] = {
          status:      records[uid] || 'present',
          studentName: s.name,
          admissionNo: s.admissionNo || '',
        };
      });
      await addDoc(collection(db,'attendance'), {
        className:    selClass, date: todayStr,
        dateLabel:    todayLabel, records: detailedRecords,
        teacherId:    profile?.uid  || '',
        teacherName:  profile?.name || '',
        totalPresent: counts.present, totalAbsent: counts.absent,
        totalLate:    counts.late, total: students.length,
        createdAt:    serverTimestamp(),
      });
      setSubmitted(true);
      toast.success(`Attendance saved! Present:${counts.present} · Absent:${counts.absent} · Late:${counts.late}`);
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Layout title="Mark Attendance" subtitle={todayLabel}>

      {/* Class Selector */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>Select Class</h3>
        <div style={s.classGrid}>
          {CLASSES.map(c => (
            <button key={c}
              style={{ ...s.classBtn, ...(selClass===c ? s.classBtnActive : {}) }}
              onClick={() => setSelClass(c)}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* Summary Strip */}
      {students.length > 0 && (
        <div style={s.summaryStrip}>
          {Object.entries(counts).map(([key, val]) => {
            const cfg = STATUS[key];
            return (
              <div key={key} style={{ ...s.summaryItem, background:cfg.bg }}>
                <div style={{ ...s.summaryVal, color:cfg.color }}>{val}</div>
                <div style={{ ...s.summaryKey, color:cfg.color }}>{cfg.label}</div>
              </div>
            );
          })}
          <div style={s.summaryItem}>
            <div style={s.summaryVal}>{students.length}</div>
            <div style={s.summaryKey}>Total</div>
          </div>
        </div>
      )}

      {/* Quick Mark All */}
      {students.length > 0 && (
        <div style={s.markAllRow}>
          <span style={s.markAllLabel}>Mark all as:</span>
          {Object.entries(STATUS).map(([key, cfg]) => (
            <button key={key}
              style={{ ...s.markAllBtn, background:cfg.bg, borderColor:cfg.color, color:cfg.color }}
              onClick={() => markAll(key)}
            >
              {cfg.short} — {cfg.label}
            </button>
          ))}
        </div>
      )}

      {/* Hint */}
      {students.length > 0 && (
        <div style={s.hint}>
          💡 Click a student card to cycle: <b>Present → Absent → Late</b>
        </div>
      )}

      {/* Student List */}
      <div style={s.card}>
        {loading ? (
          <div style={s.loadWrap}>
            {[1,2,3,4,5].map(i => <div key={i} style={s.skeleton} />)}
          </div>
        ) : students.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🎓</div>
            <div style={s.emptyTitle}>No students in {selClass}</div>
            <div style={s.emptySub}>Add students to this class from the admin portal</div>
          </div>
        ) : (
          students.map(student => {
            const uid    = student.uid || student.id;
            const status = records[uid] || 'present';
            const cfg    = STATUS[status];
            return (
              <div
                key={uid}
                style={{ ...s.studentRow, background:cfg.bg, borderColor:cfg.color+'40' }}
                onClick={() => cycleStatus(uid)}
                onMouseEnter={e => e.currentTarget.style.transform='scale(1.01)'}
                onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
              >
                <div style={{ ...s.studentAvatar, background:cfg.color+'20', color:cfg.color }}>
                  {student.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={s.studentInfo}>
                  <div style={s.studentName}>{student.name}</div>
                  <div style={s.studentMeta}>{student.admissionNo || student.className}</div>
                </div>
                <div style={{ ...s.statusBadge, background:cfg.color, color:'#fff' }}>
                  {cfg.short}
                </div>
                <div style={{ fontSize:11, color:'#8896AB' }}>tap to change</div>
              </div>
            );
          })
        )}
      </div>

      {/* Save */}
      {students.length > 0 && (
        <button
          style={{
            ...s.saveBtn,
            background: submitted ? '#aaa' : 'linear-gradient(135deg,#2A9D8F,#1A6B64)',
            cursor: submitted ? 'not-allowed' : 'pointer',
          }}
          onClick={handleSave}
          disabled={saving || submitted}
        >
          {saving ? 'Saving...' : submitted ? '✅ Attendance Submitted' : `💾 Save Attendance (${students.length} students)`}
        </button>
      )}
    </Layout>
  );
}

const s = {
  card:      { background:'#fff', borderRadius:16, padding:24, border:'1px solid #E8ECF4', boxShadow:'0 2px 12px rgba(13,27,62,0.06)', marginBottom:20 },
  cardTitle: { fontSize:16, fontWeight:800, color:'#0D1B3E', marginBottom:16 },
  classGrid: { display:'flex', flexWrap:'wrap', gap:10 },
  classBtn:  { padding:'10px 20px', border:'1.5px solid #E8ECF4', borderRadius:10, background:'#F8F9FD', fontSize:13, fontWeight:600, color:'#8896AB', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },
  classBtnActive:{ borderColor:'#2A9D8F', background:'#F0FAFA', color:'#2A9D8F' },

  summaryStrip: { display:'flex', gap:12, marginBottom:16 },
  summaryItem:  { flex:1, borderRadius:12, padding:'14px 10px', textAlign:'center' },
  summaryVal:   { fontSize:28, fontWeight:900, lineHeight:1, marginBottom:4 },
  summaryKey:   { fontSize:12, fontWeight:700, textTransform:'capitalize' },

  markAllRow:  { display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' },
  markAllLabel:{ fontSize:13, color:'#8896AB', fontWeight:600 },
  markAllBtn:  { padding:'7px 16px', borderRadius:20, border:'1.5px solid', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },

  hint: { background:'#EEF2FF', borderRadius:10, padding:'10px 16px', fontSize:13, color:'#4361EE', marginBottom:16 },

  loadWrap: { padding:8 },
  skeleton: { height:60, borderRadius:10, background:'linear-gradient(90deg,#F0F3FA 25%,#E8ECF4 50%,#F0F3FA 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite', marginBottom:8 },

  studentRow:   { display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:12, border:'1.5px solid', marginBottom:8, cursor:'pointer', transition:'all 0.2s' },
  studentAvatar:{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, flexShrink:0 },
  studentInfo:  { flex:1 },
  studentName:  { fontSize:14, fontWeight:700, color:'#0D1B3E' },
  studentMeta:  { fontSize:12, color:'#8896AB', marginTop:2 },
  statusBadge:  { width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:16, flexShrink:0 },

  empty:     { textAlign:'center', padding:'48px 20px' },
  emptyIcon: { fontSize:52, marginBottom:12 },
  emptyTitle:{ fontSize:16, fontWeight:700, color:'#0D1B3E', marginBottom:6 },
  emptySub:  { color:'#8896AB', fontSize:13 },

  saveBtn: { width:'100%', height:56, color:'#fff', border:'none', borderRadius:14, fontSize:16, fontWeight:800, transition:'all 0.2s', fontFamily:'inherit', boxShadow:'0 4px 20px rgba(42,157,143,0.3)' },
};