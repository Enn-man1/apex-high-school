// src/pages/shared/AnnouncementsPage.js
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const PRIORITIES = ['low','medium','high'];
const AUDIENCES  = [
  { key:'all',     label:'Everyone',  icon:'🌐' },
  { key:'student', label:'Students',  icon:'🎓' },
  { key:'teacher', label:'Teachers',  icon:'📚' },
  { key:'parent',  label:'Parents',   icon:'👨‍👩‍👧' },
];
const EMPTY = { title:'', body:'', priority:'medium', audience:'all' };

export default function AnnouncementsPage() {
  const { profile } = useAuth();
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [filter,   setFilter]   = useState('all');
  const canPost = ['admin','teacher'].includes(profile?.role);

  const load = async () => {
    try {
      const snap = await getDocs(query(collection(db,'announcements'), orderBy('createdAt','desc')));
      setItems(snap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.audience === filter || i.audience === 'all');

  const handlePost = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) { toast.error('Title and message are required.'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db,'announcements'), {
        ...form, author: profile?.name || 'Admin',
        authorRole: profile?.role || 'admin',
        dateLabel: 'Just now', createdAt: serverTimestamp(),
      });
      toast.success('Announcement posted!');
      setShowForm(false);
      setForm(EMPTY);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const PC = { high:'#E63946', medium:'#F5A623', low:'#27AE60' };
  const F  = (k,v) => setForm(f => ({ ...f, [k]:v }));

  return (
    <Layout title="Announcements" subtitle="School-wide notices and updates">

      <div style={s.toolbar}>
        {/* Audience filter */}
        <div style={s.filters}>
          {[{ key:'all',label:'All',icon:'📋' },...AUDIENCES].map(a => (
            <button key={a.key}
              style={{ ...s.filterBtn, ...(filter===a.key ? s.filterBtnActive : {}) }}
              onClick={() => setFilter(a.key)}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>
        {canPost && (
          <button style={s.addBtn} onClick={() => setShowForm(true)}>
            + Post Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div style={s.loadingWrap}><div style={s.spinner} /></div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📢</div>
          <div style={s.emptyTitle}>No announcements yet</div>
          {canPost && <div style={s.emptySub}>Post one using the button above</div>}
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map((item,i) => {
            const pc = PC[item.priority] || '#4361EE';
            const aud = AUDIENCES.find(a => a.key === item.audience);
            return (
              <div key={item.id} style={s.card}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor=pc; e.currentTarget.style.boxShadow=`0 12px 30px ${pc}15`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='#E8ECF4'; e.currentTarget.style.boxShadow='0 2px 12px rgba(13,27,62,0.06)'; }}
              >
                <div style={{ ...s.cardStrip, background:pc }} />
                <div style={s.cardBody}>
                  <div style={s.cardTop}>
                    <h3 style={s.cardTitle}>{item.title}</h3>
                    <div style={s.cardMeta}>
                      <span style={{ ...s.priorityBadge, background:pc+'18', color:pc }}>{item.priority}</span>
                      <span style={s.audienceBadge}>{aud?.icon} {item.audience}</span>
                    </div>
                  </div>
                  <p style={s.cardText}>{item.body}</p>
                  <div style={s.cardFooter}>
                    <span style={s.cardAuthor}>By {item.author || 'Admin'}</span>
                    <span style={s.cardDot}>·</span>
                    <span style={s.cardDate}>{item.dateLabel || 'Recent'}</span>
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
              <h2 style={s.modalTitle}>New Announcement</h2>
              <button style={s.modalClose} onClick={() => { setShowForm(false); setForm(EMPTY); }}>✕</button>
            </div>
            <div style={s.modalBody}>
              <form onSubmit={handlePost}>
                <div style={s.formGroup}>
                  <label style={s.label}>TITLE *</label>
                  <input type="text" placeholder="Announcement title" value={form.title}
                    onChange={e => F('title', e.target.value)} style={s.input}
                    onFocus={e => { e.target.style.borderColor='#E63946'; e.target.style.boxShadow='0 0 0 3px #E6394618'; }}
                    onBlur={e => { e.target.style.borderColor='#E8ECF4'; e.target.style.boxShadow='none'; }}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>MESSAGE *</label>
                  <textarea placeholder="Write your announcement..." value={form.body}
                    onChange={e => F('body', e.target.value)} rows={4}
                    style={s.textarea}
                    onFocus={e => { e.target.style.borderColor='#E63946'; e.target.style.boxShadow='0 0 0 3px #E6394618'; }}
                    onBlur={e => { e.target.style.borderColor='#E8ECF4'; e.target.style.boxShadow='none'; }}
                  />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>PRIORITY</label>
                  <div style={s.optRow}>
                    {PRIORITIES.map(p => (
                      <button key={p} type="button"
                        style={{ ...s.optBtn, ...(form.priority===p ? { borderColor:PC[p], background:PC[p]+'15', color:PC[p] } : {}) }}
                        onClick={() => F('priority',p)}
                      >
                        {p==='high'?'🔴':p==='medium'?'🟡':'🟢'} {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>AUDIENCE</label>
                  <div style={s.audGrid}>
                    {AUDIENCES.map(a => (
                      <button key={a.key} type="button"
                        style={{ ...s.audBtn, ...(form.audience===a.key ? s.audBtnActive : {}) }}
                        onClick={() => F('audience',a.key)}
                      >
                        <span style={{ fontSize:24 }}>{a.icon}</span>
                        <span style={{ fontSize:13, fontWeight:600 }}>{a.label}</span>
                        {form.audience===a.key && <span style={s.audCheck}>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={s.modalFooter}>
                  <button type="button" style={s.cancelBtn} onClick={() => { setShowForm(false); setForm(EMPTY); }}>Cancel</button>
                  <button type="submit" style={s.submitBtn} disabled={saving}>
                    {saving ? 'Posting...' : '📢 Post Announcement'}
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
  toolbar:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, gap:16, flexWrap:'wrap' },
  filters:   { display:'flex', gap:8, flexWrap:'wrap' },
  filterBtn: { padding:'8px 16px', borderRadius:20, border:'1.5px solid #E8ECF4', background:'#fff', fontSize:13, fontWeight:600, color:'#8896AB', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },
  filterBtnActive: { borderColor:'#E63946', background:'#FFF0F0', color:'#E63946' },
  addBtn:    { padding:'10px 22px', background:'linear-gradient(135deg,#E63946,#C0392B)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(230,57,70,0.3)' },

  loadingWrap: { display:'flex', justifyContent:'center', padding:'60px' },
  spinner:     { width:40, height:40, border:'3px solid #E8ECF4', borderTopColor:'#E63946', borderRadius:'50%', animation:'spin 0.8s linear infinite' },

  list: { display:'flex', flexDirection:'column', gap:16 },
  card: { display:'flex', background:'#fff', borderRadius:16, overflow:'hidden', border:'1.5px solid #E8ECF4', boxShadow:'0 2px 12px rgba(13,27,62,0.06)', transition:'all 0.3s', cursor:'default' },
  cardStrip:    { width:5, flexShrink:0 },
  cardBody:     { flex:1, padding:'20px 24px' },
  cardTop:      { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, gap:12, flexWrap:'wrap' },
  cardTitle:    { fontSize:17, fontWeight:800, color:'#0D1B3E', margin:0, flex:1 },
  cardMeta:     { display:'flex', gap:8, flexShrink:0 },
  priorityBadge:{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, textTransform:'capitalize' },
  audienceBadge:{ background:'#F0F3FA', color:'#4A5568', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 },
  cardText:     { fontSize:15, color:'#4A5568', lineHeight:1.7, marginBottom:14 },
  cardFooter:   { display:'flex', alignItems:'center', gap:8 },
  cardAuthor:   { fontSize:13, color:'#8896AB', fontWeight:600 },
  cardDot:      { color:'#C0C8D8' },
  cardDate:     { fontSize:13, color:'#8896AB' },

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
  formGroup:   { marginBottom:20 },
  label:       { display:'block', fontSize:11, fontWeight:700, color:'#8896AB', letterSpacing:1.5, marginBottom:8 },
  input:       { width:'100%', height:46, padding:'0 14px', border:'1.5px solid #E8ECF4', borderRadius:10, fontSize:14, color:'#0D1B3E', background:'#F8F9FD', transition:'all 0.2s', boxSizing:'border-box', fontFamily:'inherit' },
  textarea:    { width:'100%', padding:'12px 14px', border:'1.5px solid #E8ECF4', borderRadius:10, fontSize:14, color:'#0D1B3E', background:'#F8F9FD', transition:'all 0.2s', boxSizing:'border-box', fontFamily:'inherit', resize:'vertical' },
  optRow:      { display:'flex', gap:10 },
  optBtn:      { flex:1, height:44, borderRadius:10, border:'1.5px solid #E8ECF4', background:'#F8F9FD', fontSize:13, fontWeight:600, color:'#8896AB', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit', textTransform:'capitalize' },
  audGrid:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  audBtn:      { display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'16px 12px', border:'1.5px solid #E8ECF4', borderRadius:12, background:'#F8F9FD', cursor:'pointer', transition:'all 0.2s', position:'relative', fontFamily:'inherit' },
  audBtnActive:{ borderColor:'#E63946', background:'#FFF0F0' },
  audCheck:    { position:'absolute', top:8, right:8, color:'#E63946', fontWeight:700, fontSize:12 },
  modalFooter: { display:'flex', justifyContent:'flex-end', gap:12, marginTop:24 },
  cancelBtn:   { padding:'12px 24px', border:'1.5px solid #E8ECF4', borderRadius:10, background:'#fff', fontSize:14, fontWeight:600, color:'#8896AB', cursor:'pointer', fontFamily:'inherit' },
  submitBtn:   { padding:'12px 28px', background:'linear-gradient(135deg,#E63946,#C0392B)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
};