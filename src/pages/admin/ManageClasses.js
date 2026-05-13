// src/pages/admin/ManageClasses.js
import React, { useState, useEffect } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const EMPTY = { name:'', teacherName:'', room:'', capacity:'35', description:'' };

const CLASS_COLORS = ['#4361EE','#2A9D8F','#E63946','#F5A623','#27AE60','#6F42C1','#20C997','#E84393'];

export default function ManageClasses() {
  const [classes,  setClasses]  = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [search,   setSearch]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [classSnap, teachSnap, studSnap] = await Promise.all([
        getDocs(collection(db,'classes')),
        getDocs(collection(db,'teachers')),
        getDocs(collection(db,'students')),
      ]);
      setClasses(classSnap.docs.map(d => ({ id:d.id, ...d.data() })));
      setTeachers(teachSnap.docs.map(d => ({ id:d.id, ...d.data() })));
      setStudents(studSnap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch (e) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getStudentCount = (className) => students.filter(s => s.className === className).length;

  const filtered = search
    ? classes.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.teacherName?.toLowerCase().includes(search.toLowerCase()))
    : classes;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Class name is required.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db,'classes'), {
        ...form, capacity: Number(form.capacity) || 35,
        createdAt: serverTimestamp(),
      });
      toast.success(`${form.name} created!`);
      setShowForm(false);
      setForm(EMPTY);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cls) => {
    if (!window.confirm(`Delete ${cls.name}?`)) return;
    try {
      await deleteDoc(doc(db,'classes', cls.id));
      toast.success('Class deleted.');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Layout title="Manage Classes" subtitle={`${classes.length} classes · ${students.length} total students`}>

      <div style={s.toolbar}>
        <div style={s.searchWrap}>
          <span style={{ fontSize:16, color:'#8896AB' }}>🔍</span>
          <input type="text" placeholder="Search class name or teacher..."
            value={search} onChange={e => setSearch(e.target.value)} style={s.searchInput} />
        </div>
        <button style={s.addBtn} onClick={() => setShowForm(true)}>+ Create Class</button>
      </div>

      {/* Summary */}
      <div style={s.summary}>
        {[
          { icon:'🏫', label:'Total Classes',   value:classes.length,   color:'#4361EE' },
          { icon:'🎓', label:'Total Students',  value:students.length,  color:'#2A9D8F' },
          { icon:'📚', label:'Total Teachers',  value:teachers.length,  color:'#E63946' },
          { icon:'👥', label:'Avg Class Size',  value:classes.length ? Math.round(students.length / classes.length) : 0, color:'#F5A623' },
        ].map((s2, i) => (
          <div key={i} style={s.summaryCard}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor=s2.color; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='#E8ECF4'; }}
          >
            <div style={{ ...s.summaryIcon, background: s2.color + '15' }}>{s2.icon}</div>
            <div style={{ ...s.summaryValue, color: s2.color }}>{s2.value}</div>
            <div style={s.summaryLabel}>{s2.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={s.skeletonGrid}>{[1,2,3,4,5,6].map(i => <div key={i} style={s.skeleton} />)}</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🏫</div>
          <div style={s.emptyTitle}>{search ? 'No classes match your search' : 'No classes yet'}</div>
          <div style={s.emptySub}>Create your first class using the button above</div>
        </div>
      ) : (
        <div style={s.classGrid}>
          {filtered.map((cls, i) => {
            const color   = CLASS_COLORS[i % CLASS_COLORS.length];
            const count   = getStudentCount(cls.name);
            const capacity= cls.capacity || 35;
            const pct     = Math.min(Math.round((count / capacity) * 100), 100);
            const fill    = pct >= 90 ? '#E63946' : pct >= 70 ? '#F5A623' : '#27AE60';
            return (
              <div key={cls.id} style={s.classCard}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow=`0 20px 40px ${color}20`; e.currentTarget.style.borderColor=color; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 12px rgba(13,27,62,0.06)'; e.currentTarget.style.borderColor='#E8ECF4'; }}
              >
                <div style={{ ...s.classTop, background:`linear-gradient(135deg, ${color}, ${color}CC)` }}>
                  <div style={s.classTopLeft}>
                    <div style={s.className2}>{cls.name}</div>
                    <div style={s.classRoom}>{cls.room ? `📍 ${cls.room}` : '📍 No room set'}</div>
                  </div>
                  <div style={s.classCount}>{count}</div>
                </div>
                <div style={s.classBody}>
                  <div style={s.classDetail}>
                    <span style={s.detailIcon}>👤</span>
                    <span style={s.detailText}>{cls.teacherName || 'No teacher assigned'}</span>
                  </div>
                  <div style={s.classDetail}>
                    <span style={s.detailIcon}>👥</span>
                    <span style={s.detailText}>{count} / {capacity} students</span>
                  </div>
                  {cls.description && (
                    <div style={s.classDesc}>{cls.description}</div>
                  )}
                  {/* Capacity bar */}
                  <div style={s.capWrap}>
                    <div style={s.capLabel}>
                      <span style={{ fontSize:12, color:'#8896AB' }}>Capacity</span>
                      <span style={{ fontSize:12, fontWeight:700, color:fill }}>{pct}%</span>
                    </div>
                    <div style={s.capBarBg}>
                      <div style={{ ...s.capBarFill, width:`${pct}%`, background:fill }} />
                    </div>
                  </div>
                  <div style={s.classFooter}>
                    <div style={{ ...s.classBadge, background: color + '15', color }}>Active</div>
                    <button style={s.deleteBtn} onClick={() => handleDelete(cls)}>🗑 Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Create New Class</h2>
              <button style={s.modalClose} onClick={() => { setShowForm(false); setForm(EMPTY); }}>✕</button>
            </div>
            <div style={s.modalBody}>
              <form onSubmit={handleAdd}>
                <div style={s.formGroup}>
                  <label style={s.flabel}>CLASS NAME *</label>
                  <input type="text" placeholder="e.g. Grade 10A" value={form.name}
                    onChange={e => F('name', e.target.value)} style={s.input}
                    onFocus={e => { e.target.style.borderColor='#20C997'; e.target.style.boxShadow='0 0 0 3px #20C99718'; }}
                    onBlur={e => { e.target.style.borderColor='#E8ECF4'; e.target.style.boxShadow='none'; }}
                  />
                </div>
                <div style={s.formGrid}>
                  <div style={s.formGroup}>
                    <label style={s.flabel}>ROOM</label>
                    <input type="text" placeholder="e.g. Room 12" value={form.room}
                      onChange={e => F('room', e.target.value)} style={s.input}
                      onFocus={e => { e.target.style.borderColor='#20C997'; e.target.style.boxShadow='0 0 0 3px #20C99718'; }}
                      onBlur={e => { e.target.style.borderColor='#E8ECF4'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.flabel}>CAPACITY</label>
                    <input type="number" placeholder="35" value={form.capacity}
                      onChange={e => F('capacity', e.target.value)} style={s.input}
                      onFocus={e => { e.target.style.borderColor='#20C997'; e.target.style.boxShadow='0 0 0 3px #20C99718'; }}
                      onBlur={e => { e.target.style.borderColor='#E8ECF4'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.flabel}>CLASS TEACHER</label>
                  {teachers.length === 0 ? (
                    <p style={{ color:'#8896AB', fontSize:14 }}>No teachers added yet. Add teachers first.</p>
                  ) : (
                    <div style={s.teacherPickerGrid}>
                      {teachers.map(t => (
                        <button key={t.id} type="button"
                          style={{ ...s.teacherPickerBtn, ...(form.teacherName === t.name ? s.teacherPickerBtnActive : {}) }}
                          onClick={() => F('teacherName', t.name)}
                        >
                          <div style={s.pickerAvatar}>{t.name?.charAt(0)}</div>
                          <div>
                            <div style={s.pickerName}>{t.name}</div>
                            <div style={s.pickerSubject}>{t.subject}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={s.formGroup}>
                  <label style={s.flabel}>DESCRIPTION</label>
                  <input type="text" placeholder="Optional description" value={form.description}
                    onChange={e => F('description', e.target.value)} style={s.input}
                    onFocus={e => { e.target.style.borderColor='#20C997'; e.target.style.boxShadow='0 0 0 3px #20C99718'; }}
                    onBlur={e => { e.target.style.borderColor='#E8ECF4'; e.target.style.boxShadow='none'; }}
                  />
                </div>
                <div style={s.modalFooter}>
                  <button type="button" style={s.cancelBtn} onClick={() => { setShowForm(false); setForm(EMPTY); }}>Cancel</button>
                  <button type="submit" style={{ ...s.submitBtn, background:'linear-gradient(135deg,#20C997,#158A6E)' }} disabled={saving}>
                    {saving ? 'Creating...' : '🏫 Create Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const s = {
  toolbar:    { display:'flex', alignItems:'center', gap:16, marginBottom:24 },
  searchWrap: { flex:1, display:'flex', alignItems:'center', gap:10, background:'#fff', border:'1.5px solid #E8ECF4', borderRadius:10, padding:'0 14px', height:44 },
  searchInput:{ flex:1, border:'none', outline:'none', fontSize:14, color:'#0D1B3E', background:'transparent', fontFamily:'inherit' },
  addBtn:     { padding:'10px 22px', background:'linear-gradient(135deg,#20C997,#158A6E)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(32,201,151,0.3)' },

  summary:     { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:24 },
  summaryCard: { background:'#fff', borderRadius:16, padding:20, border:'1.5px solid #E8ECF4', boxShadow:'0 2px 12px rgba(13,27,62,0.06)', transition:'all 0.3s', cursor:'default', textAlign:'center' },
  summaryIcon: { width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, margin:'0 auto 10px' },
  summaryValue:{ fontSize:32, fontWeight:900, lineHeight:1, marginBottom:4 },
  summaryLabel:{ fontSize:13, color:'#8896AB', fontWeight:500 },

  skeletonGrid:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 },
  skeleton:    { height:240, borderRadius:16, background:'linear-gradient(90deg,#F0F3FA 25%,#E8ECF4 50%,#F0F3FA 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' },

  classGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 },
  classCard: { background:'#fff', borderRadius:16, overflow:'hidden', border:'1.5px solid #E8ECF4', boxShadow:'0 2px 12px rgba(13,27,62,0.06)', transition:'all 0.3s ease', cursor:'default' },
  classTop:  { padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  classTopLeft:{},
  className2:{ color:'#fff', fontWeight:900, fontSize:20 },
  classRoom: { color:'rgba(255,255,255,0.8)', fontSize:13, marginTop:4 },
  classCount:{ fontSize:40, fontWeight:900, color:'rgba(255,255,255,0.9)' },
  classBody: { padding:'20px 24px' },
  classDetail:{ display:'flex', alignItems:'center', gap:8, marginBottom:8 },
  detailIcon: { fontSize:14 },
  detailText: { fontSize:13, color:'#4A5568' },
  classDesc:  { fontSize:12, color:'#8896AB', marginBottom:12, fontStyle:'italic' },
  capWrap:    { marginBottom:16 },
  capLabel:   { display:'flex', justifyContent:'space-between', marginBottom:6 },
  capBarBg:   { height:6, background:'#F0F3FA', borderRadius:3, overflow:'hidden' },
  capBarFill: { height:6, borderRadius:3, transition:'width 0.8s ease' },
  classFooter:{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:12, borderTop:'1px solid #E8ECF4' },
  classBadge: { fontSize:11, fontWeight:700, padding:'3px 12px', borderRadius:20 },
  deleteBtn:  { background:'transparent', border:'none', cursor:'pointer', color:'#E63946', fontSize:13, fontWeight:600, padding:'6px 10px', borderRadius:8, transition:'all 0.2s', fontFamily:'inherit' },

  empty:     { textAlign:'center', padding:'80px 20px' },
  emptyIcon: { fontSize:52, marginBottom:12 },
  emptyTitle:{ fontSize:18, fontWeight:700, color:'#0D1B3E', marginBottom:8 },
  emptySub:  { color:'#8896AB', fontSize:14 },

  overlay:     { position:'fixed', inset:0, background:'rgba(13,27,62,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, backdropFilter:'blur(4px)' },
  modal:       { background:'#fff', borderRadius:20, width:'100%', maxWidth:580, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 40px 80px rgba(0,0,0,0.3)' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'24px 32px', borderBottom:'1px solid #E8ECF4' },
  modalTitle:  { fontSize:20, fontWeight:900, color:'#0D1B3E', margin:0 },
  modalClose:  { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#8896AB', padding:4 },
  modalBody:   { overflowY:'auto', padding:'24px 32px', flex:1 },
  formGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  formGroup:   { marginBottom:16 },
  flabel:      { display:'block', fontSize:11, fontWeight:700, color:'#8896AB', letterSpacing:1.5, marginBottom:6 },
  input:       { width:'100%', height:46, padding:'0 14px', border:'1.5px solid #E8ECF4', borderRadius:10, fontSize:14, color:'#0D1B3E', background:'#F8F9FD', transition:'all 0.2s', boxSizing:'border-box', fontFamily:'inherit' },

  teacherPickerGrid:   { display:'flex', flexDirection:'column', gap:8 },
  teacherPickerBtn:    { display:'flex', alignItems:'center', gap:12, padding:'10px 14px', border:'1.5px solid #E8ECF4', borderRadius:10, background:'#F8F9FD', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit', textAlign:'left' },
  teacherPickerBtnActive:{ borderColor:'#20C997', background:'#F0FAFA' },
  pickerAvatar:        { width:36, height:36, borderRadius:10, background:'#20C99720', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#20C997', fontSize:16, flexShrink:0 },
  pickerName:          { fontSize:13, fontWeight:700, color:'#0D1B3E' },
  pickerSubject:       { fontSize:11, color:'#8896AB', marginTop:2 },

  modalFooter: { display:'flex', justifyContent:'flex-end', gap:12, marginTop:24 },
  cancelBtn:   { padding:'12px 24px', border:'1.5px solid #E8ECF4', borderRadius:10, background:'#fff', fontSize:14, fontWeight:600, color:'#8896AB', cursor:'pointer', fontFamily:'inherit' },
  submitBtn:   { padding:'12px 28px', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },
};