// src/pages/admin/ManageTimetable.js
import React, { useState, useEffect } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, setDoc, getDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const CLASSES  = ['Grade 10A','Grade 10B','Grade 11A','Grade 11B','Grade 12A','Grade 12B'];
const DAYS     = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const SUBJECTS = ['Mathematics','English Language','Biology','Chemistry','Physics','History','Geography','Economics','Further Maths','Computer Science','Free Period','Assembly','Closing'];
const TIMES    = ['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00'];

const SUBJECT_COLORS = {
  'Mathematics':'#4361EE','English Language':'#2A9D8F','Biology':'#27AE60',
  'Chemistry':'#E63946','Physics':'#F5A623','History':'#6F42C1',
  'Geography':'#E84393','Economics':'#20C997','Further Maths':'#3498DB',
  'Computer Science':'#0D1B3E','Free Period':'#8896AB',
  'Assembly':'#F5A623','Closing':'#8896AB',
};

const EMPTY_PERIOD = {
  subject: 'Mathematics', teacher: '',
  room: '', time: '08:00', endTime: '09:40',
};

export default function ManageTimetable() {
  const [selClass,   setSelClass]   = useState(CLASSES[0]);
  const [selDay,     setSelDay]     = useState('Monday');
  const [timetable,  setTimetable]  = useState({});
  const [loading,    setLoading]    = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(EMPTY_PERIOD);
  const [saving,     setSaving]     = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [teachers,   setTeachers]   = useState([]);

  // Load teachers for dropdown
  useEffect(() => {
    const loadTeachers = async () => {
      const snap = await getDocs(collection(db, 'teachers'));
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadTeachers();
  }, []);

  // Load timetable for selected class
  useEffect(() => {
    loadTimetable(selClass);
  }, [selClass]);

  const loadTimetable = async (className) => {
    setLoading(true);
    try {
      const result = {};
      for (const day of DAYS) {
        const snap = await getDocs(
          collection(db, 'timetable', className, 'days', day, 'periods')
        );
        result[day] = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.time?.localeCompare(b.time));
      }
      setTimetable(result);
    } catch (e) {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.subject || !form.time || !form.endTime) {
      toast.error('Subject, start time and end time are required.');
      return;
    }
    setSaving(true);
    try {
      const periodData = {
        subject:   form.subject,
        teacher:   form.teacher,
        room:      form.room,
        time:      form.time,
        endTime:   form.endTime,
        className: selClass,
        day:       selDay,
        updatedAt: serverTimestamp(),
      };

      if (editItem) {
        // Update existing period
        await setDoc(
          doc(db, 'timetable', selClass, 'days', selDay, 'periods', editItem.id),
          periodData
        );
        toast.success('Period updated!');
      } else {
        // Add new period
        await addDoc(
          collection(db, 'timetable', selClass, 'days', selDay, 'periods'),
          { ...periodData, createdAt: serverTimestamp() }
        );
        toast.success('Period added!');
      }

      setShowForm(false);
      setForm(EMPTY_PERIOD);
      setEditItem(null);
      loadTimetable(selClass);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (period) => {
    if (!window.confirm(`Delete ${period.subject} (${period.time})?`)) return;
    try {
      await deleteDoc(
        doc(db, 'timetable', selClass, 'days', selDay, 'periods', period.id)
      );
      toast.success('Period deleted.');
      loadTimetable(selClass);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleEdit = (period) => {
    setForm({
      subject: period.subject,
      teacher: period.teacher || '',
      room:    period.room    || '',
      time:    period.time,
      endTime: period.endTime || '',
    });
    setEditItem(period);
    setShowForm(true);
  };

  const handleCopyDay = async () => {
    const source = timetable[selDay] || [];
    if (source.length === 0) {
      toast.error('No periods to copy on this day.');
      return;
    }
    const targetDay = window.prompt(
      `Copy ${selDay}'s timetable to which day?\n(Monday/Tuesday/Wednesday/Thursday/Friday)`
    );
    if (!targetDay || !DAYS.includes(targetDay)) {
      toast.error('Invalid day entered.');
      return;
    }
    try {
      for (const period of source) {
        const { id, ...data } = period;
        await addDoc(
          collection(db, 'timetable', selClass, 'days', targetDay, 'periods'),
          { ...data, day: targetDay, updatedAt: serverTimestamp() }
        );
      }
      toast.success(`Copied to ${targetDay}!`);
      loadTimetable(selClass);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleClearDay = async () => {
    const periods = timetable[selDay] || [];
    if (periods.length === 0) { toast.error('No periods to clear.'); return; }
    if (!window.confirm(`Clear ALL periods on ${selDay} for ${selClass}?`)) return;
    try {
      for (const period of periods) {
        await deleteDoc(
          doc(db, 'timetable', selClass, 'days', selDay, 'periods', period.id)
        );
      }
      toast.success(`${selDay} cleared!`);
      loadTimetable(selClass);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const currentPeriods = timetable[selDay] || [];

  return (
    <Layout title="Manage Timetable" subtitle="Set class schedules for each day">

      {/* Class selector */}
      <div style={s.classRow}>
        {CLASSES.map(c => (
          <button
            key={c}
            style={{
              ...s.classBtn,
              background:  selClass === c ? 'linear-gradient(135deg,#4361EE,#2541C4)' : '#fff',
              color:       selClass === c ? '#fff' : '#8896AB',
              borderColor: selClass === c ? '#4361EE' : '#E8ECF4',
              fontWeight:  selClass === c ? 700 : 500,
            }}
            onClick={() => setSelClass(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Day selector */}
      <div style={s.dayRow}>
        {DAYS.map(day => (
          <button
            key={day}
            style={{
              ...s.dayBtn,
              background:  selDay === day ? '#0D1B3E' : '#fff',
              color:       selDay === day ? '#fff' : '#4A5568',
              borderColor: selDay === day ? '#0D1B3E' : '#E8ECF4',
            }}
            onClick={() => setSelDay(day)}
          >
            <div style={s.dayBtnName}>{day.slice(0, 3)}</div>
            <div style={s.dayBtnCount}>
              {(timetable[day] || []).length} periods
            </div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <div style={s.toolbarLeft}>
          <h3 style={s.dayTitle}>{selDay} — {selClass}</h3>
          <span style={s.periodCount}>
            {currentPeriods.length} period{currentPeriods.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={s.toolbarRight}>
          <button style={s.copyBtn} onClick={handleCopyDay}>
            📋 Copy Day
          </button>
          <button style={s.clearBtn} onClick={handleClearDay}>
            🗑 Clear Day
          </button>
          <button
            style={s.addBtn}
            onClick={() => { setShowForm(true); setForm(EMPTY_PERIOD); setEditItem(null); }}
          >
            + Add Period
          </button>
        </div>
      </div>

      {/* Timetable grid */}
      {loading ? (
        <div style={s.loadingWrap}>
          {[1,2,3].map(i => <div key={i} style={s.skeleton} />)}
        </div>
      ) : currentPeriods.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📅</div>
          <div style={s.emptyTitle}>No periods on {selDay}</div>
          <div style={s.emptySub}>Click "+ Add Period" to build this day's schedule</div>
          <button
            style={s.emptyBtn}
            onClick={() => { setShowForm(true); setForm(EMPTY_PERIOD); setEditItem(null); }}
          >
            + Add First Period
          </button>
        </div>
      ) : (
        <div style={s.periodsList}>
          {currentPeriods.map((period, i) => {
            const color = SUBJECT_COLORS[period.subject] || '#4361EE';
            return (
              <div
                key={period.id}
                style={s.periodCard}
                onMouseEnter={e => {
                  e.currentTarget.style.transform   = 'translateX(4px)';
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.boxShadow   = `0 4px 16px ${color}20`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform   = 'translateX(0)';
                  e.currentTarget.style.borderColor = '#E8ECF4';
                  e.currentTarget.style.boxShadow   = '0 2px 8px rgba(13,27,62,0.06)';
                }}
              >
                {/* Color strip */}
                <div style={{ ...s.periodStrip, background: color }} />

                {/* Time */}
                <div style={s.periodTime}>
                  <div style={s.timeStart}>{period.time}</div>
                  <div style={s.timeDash}>—</div>
                  <div style={s.timeEnd}>{period.endTime || '—'}</div>
                </div>

                {/* Info */}
                <div style={s.periodInfo}>
                  <div style={{ ...s.periodSubject, color }}>
                    {period.subject}
                  </div>
                  <div style={s.periodMeta}>
                    {period.teacher && `👤 ${period.teacher}`}
                    {period.teacher && period.room && '  ·  '}
                    {period.room && `📍 ${period.room}`}
                  </div>
                  <div style={{ ...s.periodClass, background: color + '12', color }}>
                    {selClass}
                  </div>
                </div>

                {/* Actions */}
                <div style={s.periodActions}>
                  <button
                    style={s.editBtn}
                    onClick={() => handleEdit(period)}
                    onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#4361EE'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F8F9FD'; e.currentTarget.style.color = '#8896AB'; }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    style={s.deleteBtn}
                    onClick={() => handleDelete(period)}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FFF0F0'; e.currentTarget.style.color = '#E63946'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F8F9FD'; e.currentTarget.style.color = '#8896AB'; }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly overview */}
      <div style={s.weekOverview}>
        <h3 style={s.weekTitle}>Weekly Overview — {selClass}</h3>
        <div style={s.weekGrid}>
          {DAYS.map(day => {
            const periods = timetable[day] || [];
            return (
              <div
                key={day}
                style={{
                  ...s.weekCol,
                  border: day === selDay ? '2px solid #4361EE' : '1px solid #E8ECF4',
                }}
                onClick={() => setSelDay(day)}
              >
                <div style={{
                  ...s.weekColHeader,
                  background: day === selDay ? '#4361EE' : '#0D1B3E',
                }}>
                  {day.slice(0, 3)}
                  <span style={s.weekColCount}>{periods.length}</span>
                </div>
                {periods.map((p, i) => {
                  const color = SUBJECT_COLORS[p.subject] || '#4361EE';
                  return (
                    <div key={i} style={{ ...s.weekPeriod, borderLeft: `3px solid ${color}`, background: color + '08' }}>
                      <div style={{ fontSize: 10, color: '#8896AB', marginBottom: 2 }}>{p.time}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color }}>{p.subject?.split(' ')[0]}</div>
                    </div>
                  );
                })}
                {periods.length === 0 && (
                  <div style={s.weekEmpty}>No periods</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Period Modal */}
      {showForm && (
        <div
          style={s.overlay}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
        >
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>
                {editItem ? 'Edit Period' : 'Add Period'} — {selDay}
              </h2>
              <button
                style={s.modalClose}
                onClick={() => { setShowForm(false); setForm(EMPTY_PERIOD); setEditItem(null); }}
              >
                ✕
              </button>
            </div>

            <div style={s.modalBody}>

              {/* Subject */}
              <div style={s.formGroup}>
                <label style={s.label}>SUBJECT *</label>
                <div style={s.subjectGrid}>
                  {SUBJECTS.map(sub => {
                    const c = SUBJECT_COLORS[sub] || '#4361EE';
                    return (
                      <button
                        key={sub}
                        style={{
                          ...s.subjectBtn,
                          borderColor:  form.subject === sub ? c : '#E8ECF4',
                          background:   form.subject === sub ? c + '15' : '#F8F9FD',
                          color:        form.subject === sub ? c : '#8896AB',
                          fontWeight:   form.subject === sub ? 700 : 500,
                        }}
                        onClick={() => F('subject', sub)}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time row */}
              <div style={s.timeRow}>
                <div style={s.formGroup}>
                  <label style={s.label}>START TIME *</label>
                  <select
                    value={form.time}
                    onChange={e => F('time', e.target.value)}
                    style={s.select}
                  >
                    {TIMES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{ ...s.formGroup, display:'flex', alignItems:'center', paddingTop:28 }}>
                  <span style={{ color:'#8896AB', fontWeight:700 }}>→</span>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>END TIME *</label>
                  <select
                    value={form.endTime}
                    onChange={e => F('endTime', e.target.value)}
                    style={s.select}
                  >
                    {TIMES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teacher */}
              <div style={s.formGroup}>
                <label style={s.label}>TEACHER</label>
                {teachers.length > 0 ? (
                  <select
                    value={form.teacher}
                    onChange={e => F('teacher', e.target.value)}
                    style={s.select}
                  >
                    <option value="">— Select Teacher —</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.subject})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Teacher name"
                    value={form.teacher}
                    onChange={e => F('teacher', e.target.value)}
                    style={s.input}
                    onFocus={e => { e.target.style.borderColor='#4361EE'; e.target.style.boxShadow='0 0 0 3px #4361EE18'; }}
                    onBlur={e => { e.target.style.borderColor='#E8ECF4'; e.target.style.boxShadow='none'; }}
                  />
                )}
              </div>

              {/* Room */}
              <div style={s.formGroup}>
                <label style={s.label}>ROOM / VENUE</label>
                <input
                  type="text"
                  placeholder="e.g. Room 12, Lab 1, Hall"
                  value={form.room}
                  onChange={e => F('room', e.target.value)}
                  style={s.input}
                  onFocus={e => { e.target.style.borderColor='#4361EE'; e.target.style.boxShadow='0 0 0 3px #4361EE18'; }}
                  onBlur={e => { e.target.style.borderColor='#E8ECF4'; e.target.style.boxShadow='none'; }}
                />
              </div>

              {/* Preview */}
              {form.subject && (
                <div style={{
                  ...s.preview,
                  borderLeft: `4px solid ${SUBJECT_COLORS[form.subject] || '#4361EE'}`,
                  background: (SUBJECT_COLORS[form.subject] || '#4361EE') + '08',
                }}>
                  <div style={{ fontWeight:700, color: SUBJECT_COLORS[form.subject] || '#4361EE' }}>
                    Preview
                  </div>
                  <div style={{ fontSize:14, color:'#0D1B3E', marginTop:6 }}>
                    {form.time} – {form.endTime} · {form.subject}
                    {form.teacher && ` · ${form.teacher}`}
                    {form.room && ` · ${form.room}`}
                  </div>
                </div>
              )}

              <div style={s.modalFooter}>
                <button
                  style={s.cancelBtn}
                  onClick={() => { setShowForm(false); setForm(EMPTY_PERIOD); setEditItem(null); }}
                >
                  Cancel
                </button>
                <button
                  style={s.submitBtn}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editItem
                    ? '✅ Update Period'
                    : '✅ Add Period'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </Layout>
  );
}

const s = {
  classRow: { display:'flex', flexWrap:'wrap', gap:10, marginBottom:20 },
  classBtn: {
    padding:'9px 18px', borderRadius:10, border:'1.5px solid',
    fontSize:13, fontWeight:500, cursor:'pointer',
    transition:'all 0.2s', fontFamily:'inherit',
  },

  dayRow: { display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' },
  dayBtn: {
    flex:1, minWidth:100, padding:'12px 8px', borderRadius:12,
    border:'1.5px solid', cursor:'pointer', textAlign:'center',
    transition:'all 0.2s', fontFamily:'inherit',
  },
  dayBtnName:  { fontSize:16, fontWeight:800, marginBottom:4 },
  dayBtnCount: { fontSize:11, opacity:0.7 },

  toolbar:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 },
  toolbarLeft: { display:'flex', alignItems:'center', gap:12 },
  toolbarRight:{ display:'flex', gap:10 },
  dayTitle:    { fontSize:18, fontWeight:900, color:'#0D1B3E', margin:0 },
  periodCount: { background:'#EEF2FF', color:'#4361EE', fontSize:12, fontWeight:700, padding:'3px 12px', borderRadius:20 },

  copyBtn:  { padding:'9px 16px', border:'1.5px solid #E8ECF4', borderRadius:9, background:'#fff', fontSize:13, fontWeight:600, color:'#4A5568', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' },
  clearBtn: { padding:'9px 16px', border:'1.5px solid #FFF0F0', borderRadius:9, background:'#FFF0F0', fontSize:13, fontWeight:600, color:'#E63946', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' },
  addBtn:   { padding:'9px 20px', background:'linear-gradient(135deg,#4361EE,#2541C4)', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 12px rgba(67,97,238,0.3)' },

  loadingWrap: { display:'flex', flexDirection:'column', gap:12, marginBottom:24 },
  skeleton:    { height:80, borderRadius:14, background:'linear-gradient(90deg,#F0F3FA 25%,#E8ECF4 50%,#F0F3FA 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' },

  empty:     { textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1px solid #E8ECF4', marginBottom:24 },
  emptyIcon: { fontSize:52, marginBottom:12 },
  emptyTitle:{ fontSize:18, fontWeight:700, color:'#0D1B3E', marginBottom:8 },
  emptySub:  { color:'#8896AB', fontSize:14, marginBottom:20 },
  emptyBtn:  { padding:'10px 24px', background:'linear-gradient(135deg,#4361EE,#2541C4)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },

  periodsList: { display:'flex', flexDirection:'column', gap:12, marginBottom:32 },
  periodCard:  {
    display:'flex', alignItems:'center',
    background:'#fff', borderRadius:14,
    border:'1.5px solid #E8ECF4',
    boxShadow:'0 2px 8px rgba(13,27,62,0.06)',
    overflow:'hidden', transition:'all 0.25s ease',
  },
  periodStrip:   { width:5, alignSelf:'stretch', flexShrink:0 },
  periodTime:    { width:90, padding:'16px 12px', textAlign:'center', borderRight:'1px solid #F0F3FA', flexShrink:0 },
  timeStart:     { fontSize:15, fontWeight:800, color:'#0D1B3E' },
  timeDash:      { fontSize:11, color:'#C0C8D8', margin:'2px 0' },
  timeEnd:       { fontSize:13, color:'#8896AB' },
  periodInfo:    { flex:1, padding:'14px 16px' },
  periodSubject: { fontSize:16, fontWeight:800, marginBottom:4 },
  periodMeta:    { fontSize:13, color:'#4A5568', marginBottom:6 },
  periodClass:   { display:'inline-block', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20 },
  periodActions: { display:'flex', gap:8, padding:'0 16px', flexShrink:0 },
  editBtn:       { padding:'7px 14px', border:'1.5px solid #E8ECF4', borderRadius:8, background:'#F8F9FD', fontSize:12, fontWeight:600, color:'#8896AB', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },
  deleteBtn:     { padding:'7px 14px', border:'1.5px solid #E8ECF4', borderRadius:8, background:'#F8F9FD', fontSize:12, fontWeight:600, color:'#8896AB', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },

  weekOverview: { background:'#fff', borderRadius:20, padding:24, border:'1px solid #E8ECF4', boxShadow:'0 2px 12px rgba(13,27,62,0.06)' },
  weekTitle:    { fontSize:16, fontWeight:800, color:'#0D1B3E', marginBottom:16 },
  weekGrid:     { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 },
  weekCol:      { borderRadius:12, overflow:'hidden', cursor:'pointer', transition:'all 0.2s' },
  weekColHeader:{ padding:'10px 8px', textAlign:'center', color:'#fff', fontSize:13, fontWeight:800, display:'flex', justifyContent:'space-between', alignItems:'center', transition:'background 0.2s' },
  weekColCount: { background:'rgba(255,255,255,0.2)', fontSize:11, padding:'1px 8px', borderRadius:20 },
  weekPeriod:   { padding:'8px 10px', borderBottom:'1px solid #F0F3FA', transition:'all 0.2s' },
  weekEmpty:    { padding:'16px 10px', textAlign:'center', fontSize:12, color:'#C0C8D8' },

  overlay:     { position:'fixed', inset:0, background:'rgba(13,27,62,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, backdropFilter:'blur(4px)' },
  modal:       { background:'#fff', borderRadius:20, width:'100%', maxWidth:620, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 40px 80px rgba(0,0,0,0.3)' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'24px 32px', borderBottom:'1px solid #E8ECF4' },
  modalTitle:  { fontSize:20, fontWeight:900, color:'#0D1B3E', margin:0 },
  modalClose:  { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#8896AB', padding:4 },
  modalBody:   { overflowY:'auto', padding:'24px 32px', flex:1 },

  formGroup:   { marginBottom:20 },
  label:       { display:'block', fontSize:11, fontWeight:700, color:'#8896AB', letterSpacing:1.5, marginBottom:8 },
  subjectGrid: { display:'flex', flexWrap:'wrap', gap:8 },
  subjectBtn:  { padding:'7px 14px', borderRadius:20, border:'1.5px solid', fontSize:13, cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },
  timeRow:     { display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, alignItems:'flex-start' },
  select:      { width:'100%', height:46, padding:'0 14px', border:'1.5px solid #E8ECF4', borderRadius:10, fontSize:14, color:'#0D1B3E', background:'#F8F9FD', cursor:'pointer', fontFamily:'inherit', outline:'none' },
  input:       { width:'100%', height:46, padding:'0 14px', border:'1.5px solid #E8ECF4', borderRadius:10, fontSize:14, color:'#0D1B3E', background:'#F8F9FD', transition:'all 0.2s', boxSizing:'border-box', fontFamily:'inherit', outline:'none' },
  preview:     { padding:'14px 16px', borderRadius:10, marginBottom:20 },
  modalFooter: { display:'flex', justifyContent:'flex-end', gap:12, marginTop:8 },
  cancelBtn:   { padding:'12px 24px', border:'1.5px solid #E8ECF4', borderRadius:10, background:'#fff', fontSize:14, fontWeight:600, color:'#8896AB', cursor:'pointer', fontFamily:'inherit' },
  submitBtn:   { padding:'12px 28px', background:'linear-gradient(135deg,#4361EE,#2541C4)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
};