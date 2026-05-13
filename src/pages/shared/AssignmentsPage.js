// src/pages/shared/AssignmentsPage.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const SUBJECTS  = ['Mathematics','English Language','Biology','Chemistry','Physics','History','Geography','Economics'];
const CLASSES   = ['Grade 10A','Grade 10B','Grade 11A','Grade 11B','Grade 12A','Grade 12B'];
const EMPTY     = { title:'', subject:'Mathematics', className:'Grade 10A', description:'', dueDate:'', totalMarks:'100' };

const SUBJECT_ICONS = {
  'Mathematics':'🔢','English Language':'📖','Biology':'🧬',
  'Chemistry':'⚗️','Physics':'⚡','History':'📜',
  'Geography':'🌍','Economics':'📈',
};

const SUBJECT_COLORS = {
  'Mathematics':'#4361EE','English Language':'#2A9D8F','Biology':'#27AE60',
  'Chemistry':'#E63946','Physics':'#F5A623','History':'#6F42C1',
  'Geography':'#E84393','Economics':'#20C997',
};

export default function AssignmentsPage() {
  const { profile }  = useAuth();
  const isTeacher    = profile?.role === 'teacher';
  const isAdmin      = profile?.role === 'admin';
  const canPost      = isTeacher || isAdmin;

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [selSub,   setSelSub]   = useState('All');

  const load = async () => {
    try {
      const snap = await getDocs(query(collection(db,'assignments'), orderBy('createdAt','desc')));
      setItems(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = selSub === 'All' ? items : items.filter(a => a.subject === selSub);

  const getDueDays = (dueDate) => {
    if (!dueDate) return null;
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0)   return { label:`${Math.abs(diff)}d overdue`, color:'#E63946' };
    if (diff === 0) return { label:'Due Today',    color:'#E63946' };
    if (diff === 1) return { label:'Due Tomorrow', color:'#F5A623' };
    if (diff <= 7)  return { label:`${diff}d left`, color:'#F5A623' };
    return { label:`${diff}d left`, color:'#27AE60' };
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!form.title || !form.subject) { toast.error('Title and subject are required.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db,'assignments'), {
        ...form,
        totalMarks:  Number(form.totalMarks) || 100,
        teacherId:   profile?.uid  || '',
        teacherName: profile?.name || '',
        createdAt:   serverTimestamp(),
      });
      toast.success('Assignment posted!');
      setShowForm(false); setForm(EMPTY); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Layout title="Assignments" subtitle="Track and manage assignments">

      <div style={s.toolbar}>
        <div style={s.subjectFilter}>
          <button
            style={{ ...s.subBtn, ...(selSub==='All' ? s.subBtnActive : {}) }}
            onClick={() => setSelSub('All')}
          >
            📋 All ({items.length})
          </button>
          {[...new Set(items.map(i => i.subject))].map(sub => (
            <button key={sub}
              style={{ ...s.subBtn, ...(selSub===sub ? { ...s.subBtnActive, borderColor: SUBJECT_COLORS[sub], background: SUBJECT_COLORS[sub]+'15', color: SUBJECT_COLORS[sub] } : {}) }}
              onClick={() => setSelSub(sub)}
            >
              {SUBJECT_ICONS[sub] || '📚'} {sub.split(' ')[0]}
            </button>
          ))}
        </div>
        {canPost && (
          <button style={s.addBtn} onClick={() => setShowForm(true)}>+ Post Assignment</button>
        )}
      </div>

      {loading ? (
        <div style={s.skeletonWrap}>{[1,2,3].map(i => <div key={i} style={s.skeleton} />)}</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📝</div>
          <div style={s.emptyTitle}>No assignments found</div>
          {canPost && <div style={s.emptySub}>Post the first assignment using the button above</div>}
        </div>
      ) : (
        <div style={s.assignGrid}>
          {filtered.map((a, i) => {
            const color = SUBJECT_COLORS[a.subject] || '#4361EE';
            const icon  = SUBJECT_ICONS[a.subject] || '📚';
            const due   = getDueDays(a.dueDate);
            return (
              <div key={a.id} style={s.assignCard}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow=`0 16px 40px ${color}20`; e.currentTarget.style.borderColor=color; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 12px rgba(13,27,62,0.08)'; e.currentTarget.style.borderColor='#E8ECF4'; }}
              >
                <div style={{ ...s.assignTop, background:`linear-gradient(135deg,${color},${color}CC)` }}>
                  <div style={s.assignTopLeft}>
                    <span style={{ fontSize:32 }}>{icon}</span>
                    <div>
                      <div style={s.assignSubject}>{a.subject}</div>
                      <div style={s.assignClass}>{a.className}</div>
                    </div>
                  </div>
                  <div style={s.assignMarks}>{a.totalMarks || 100} marks</div>
                </div>
                <div style={s.assignBody}>
                  <h3 style={s.assignTitle}>{a.title}</h3>
                  {a.description && (
                    <p style={s.assignDesc}>{a.description}</p>
                  )}
                  <div style={s.assignFooter}>
                    <div style={s.assignTeacher}>By {a.teacherName || 'Teacher'}</div>
                    {due && (
                      <div style={{ ...s.dueBadge, background:due.color+'15', color:due.color }}>
                        ⏰ {due.label}
                      </div>
                    )}
                    {a.dueDate && (
                      <div style={s.assignDue}>📅 {a.dueDate}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Modal */}
      {showForm && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Post Assignment</h2>
              <button style={s.modalClose} onClick={() => { setShowForm(false); setForm(EMPTY); }}>✕</button>
            </div>
            <div style={s.modalBody}>
              <form onSubmit={handlePost}>
                <div style={s.formGroup}>
                  <label style={s.label}>ASSIGNMENT TITLE *</label>
                  <input type="text" placeholder="e.g. Chapter 5 Exercise" value={form.title}
                    onChange={e => F('title', e.target.value)} style={s.input}
                    onFocus={e => { e.target.style.borderColor='#4361EE'; e.target.style.boxShadow='0 0 0 3px #4361EE18'; }}
                    onBlur={e => { e.target.style.borderColor='#E8ECF4'; e.target.style.boxShadow='none'; }}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>DESCRIPTION</label>
                  <textarea placeholder="Describe the assignment..." value={form.description}
                    onChange={e => F('description', e.target.value)} rows={3}
                    style={s.textarea}
                    onFocus={e => { e.target.style.borderColor='#4361EE'; e.target.style.boxShadow='0 0 0 3px #4361EE18'; }}
                    onBlur={e => { e.target.style.borderColor='#E8ECF4'; e.target.style.boxShadow='none'; }}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>SUBJECT *</label>
                  <div style={s.chipGrid}>
                    {SUBJECTS.map(sub => {
                      const c = SUBJECT_COLORS[sub] || '#4361EE';
                      return (
                        <button key={sub} type="button"
                          style={{ ...s.chip, ...(form.subject===sub ? { borderColor:c, background:c+'15', color:c } : {}) }}
                          onClick={() => F('subject', sub)}
                        >
                          {SUBJECT_ICONS[sub]} {sub.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>CLASS</label>
                  <div style={s.chipGrid}>
                    {CLASSES.map(c => (
                      <button key={c} type="button"
                        style={{ ...s.chip, ...(form.className===c ? s.chipActive : {}) }}
                        onClick={() => F('className', c)}
                      >{c}</button>
                    ))}
                  </div>
                </div>
                <div style={s.formGrid}>
                  <div style={s.formGroup}>
                    <label style={s.label}>DUE DATE</label>
                    <input type="date" value={form.dueDate}
                      onChange={e => F('dueDate', e.target.value)} style={s.input}
                      onFocus={e => { e.target.style.borderColor='#4361EE'; e.target.style.boxShadow='0 0 0 3px #4361EE18'; }}
                      onBlur={e => { e.target.style.borderColor='#E8ECF4'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>TOTAL MARKS</label>
                    <input type="number" placeholder="100" value={form.totalMarks}
                      onChange={e => F('totalMarks', e.target.value)} style={s.input}
                      onFocus={e => { e.target.style.borderColor='#4361EE'; e.target.style.boxShadow='0 0 0 3px #4361EE18'; }}
                      onBlur={e => { e.target.style.borderColor='#E8ECF4'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                </div>
                <div style={s.modalFooter}>
                  <button type="button" style={s.cancelBtn} onClick={() => { setShowForm(false); setForm(EMPTY); }}>Cancel</button>
                  <button type="submit" style={s.submitBtn} disabled={saving}>
                    {saving ? 'Posting...' : '📝 Post Assignment'}
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
  toolbar:       { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, gap:16, flexWrap:'wrap' },
  subjectFilter: { display:'flex', gap:8, flexWrap:'wrap' },
  subBtn:        { padding:'8px 14px', borderRadius:20, border:'1.5px solid #E8ECF4', background:'#fff', fontSize:12, fontWeight:600, color:'#8896AB', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },
  subBtnActive:  { borderColor:'#4361EE', background:'#EEF2FF', color:'#4361EE' },
  addBtn:        { padding:'10px 22px', background:'linear-gradient(135deg,#4361EE,#2541C4)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(67,97,238,0.3)' },

  skeletonWrap: { display:'flex', flexDirection:'column', gap:16 },
  skeleton:     { height:160, borderRadius:16, background:'linear-gradient(90deg,#F0F3FA 25%,#E8ECF4 50%,#F0F3FA 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' },

  assignGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 },
  assignCard: { background:'#fff', borderRadius:18, overflow:'hidden', border:'1.5px solid #E8ECF4', boxShadow:'0 2px 12px rgba(13,27,62,0.08)', transition:'all 0.3s ease', cursor:'default' },
  assignTop:  { padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  assignTopLeft:{ display:'flex', alignItems:'center', gap:12 },
  assignSubject:{ color:'#fff', fontWeight:800, fontSize:15 },
  assignClass:  { color:'rgba(255,255,255,0.75)', fontSize:12, marginTop:2 },
  assignMarks:  { background:'rgba(255,255,255,0.2)', color:'#fff', fontSize:13, fontWeight:700, padding:'4px 12px', borderRadius:20 },
  assignBody:   { padding:'18px 20px' },
  assignTitle:  { fontSize:16, fontWeight:800, color:'#0D1B3E', marginBottom:8 },
  assignDesc:   { fontSize:13, color:'#4A5568', lineHeight:1.6, marginBottom:14 },
  assignFooter: { display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' },
  assignTeacher:{ fontSize:12, color:'#8896AB' },
  dueBadge:     { fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 },
  assignDue:    { fontSize:12, color:'#8896AB' },

  empty:     { textAlign:'center', padding:'80px 20px' },
  emptyIcon: { fontSize:52, marginBottom:12 },
  emptyTitle:{ fontSize:18, fontWeight:700, color:'#0D1B3E', marginBottom:8 },
  emptySub:  { color:'#8896AB', fontSize:14 },

  overlay:     { position:'fixed', inset:0, background:'rgba(13,27,62,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, backdropFilter:'blur(4px)' },
  modal:       { background:'#fff', borderRadius:20, width:'100%', maxWidth:560, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 40px 80px rgba(0,0,0,0.3)' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'24px 32px', borderBottom:'1px solid #E8ECF4' },
  modalTitle:  { fontSize:20, fontWeight:900, color:'#0D1B3E', margin:0 },
  modalClose:  { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#8896AB', padding:4 },
  modalBody:   { overflowY:'auto', padding:'24px 32px', flex:1 },
  formGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  formGroup:   { marginBottom:18 },
  label:       { display:'block', fontSize:11, fontWeight:700, color:'#8896AB', letterSpacing:1.5, marginBottom:8 },
  input:       { width:'100%', height:46, padding:'0 14px', border:'1.5px solid #E8ECF4', borderRadius:10, fontSize:14, color:'#0D1B3E', background:'#F8F9FD', transition:'all 0.2s', boxSizing:'border-box', fontFamily:'inherit' },
  textarea:    { width:'100%', padding:'12px 14px', border:'1.5px solid #E8ECF4', borderRadius:10, fontSize:14, color:'#0D1B3E', background:'#F8F9FD', transition:'all 0.2s', boxSizing:'border-box', fontFamily:'inherit', resize:'vertical' },
  chipGrid:    { display:'flex', flexWrap:'wrap', gap:8 },
  chip:        { padding:'7px 14px', borderRadius:20, border:'1.5px solid #E8ECF4', background:'#F8F9FD', fontSize:12, fontWeight:600, color:'#8896AB', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },
  chipActive:  { borderColor:'#4361EE', background:'#EEF2FF', color:'#4361EE' },
  modalFooter: { display:'flex', justifyContent:'flex-end', gap:12, marginTop:24 },
  cancelBtn:   { padding:'12px 24px', border:'1.5px solid #E8ECF4', borderRadius:10, background:'#fff', fontSize:14, fontWeight:600, color:'#8896AB', cursor:'pointer', fontFamily:'inherit' },
  submitBtn:   { padding:'12px 28px', background:'linear-gradient(135deg,#4361EE,#2541C4)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
};