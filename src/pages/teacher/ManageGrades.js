// src/pages/teacher/ManageGrades.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const SUBJECTS   = ['Mathematics','English Language','Biology','Chemistry','Physics','History','Geography','Economics'];
const EXAM_TYPES = ['CA1','CA2','Mid-Term','Exam','Final'];
const CLASSES    = ['Grade 10A','Grade 10B','Grade 11A','Grade 11B','Grade 12A','Grade 12B'];
const TERMS      = ['First Term 2025','Second Term 2025','Third Term 2025'];

const getGradeInfo = (score) => {
  const s = Number(score);
  if (isNaN(s) || score === '') return null;
  if (s >= 80) return { letter:'A', color:'#27AE60', remark:'Excellent' };
  if (s >= 70) return { letter:'B', color:'#4361EE', remark:'Very Good' };
  if (s >= 60) return { letter:'C', color:'#20C997', remark:'Good'      };
  if (s >= 50) return { letter:'D', color:'#F5A623', remark:'Pass'      };
  return             { letter:'F', color:'#E63946', remark:'Fail'       };
};

export default function ManageGrades() {
  const { profile } = useAuth();

  const [selClass,       setSelClass]       = useState(CLASSES[0]);
  const [selTerm,        setSelTerm]        = useState(TERMS[2]);
  const [students,       setStudents]       = useState([]);
  const [existingGrades, setExistingGrades] = useState([]);
  const [scores,         setScores]         = useState({});
  const [loading,        setLoading]        = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [configured,     setConfigured]     = useState(false);
  const [selStudent,     setSelStudent]     = useState(null);

  // ── Load students + existing grades ──────────────────────
  const loadData = useCallback(async (className, term) => {
    setLoading(true);
    try {
      const studSnap = await getDocs(collection(db, 'students'));
      const allStudents = studSnap.docs.map(d => ({ id:d.id, ...d.data() }));
      const classStudents = allStudents.filter(s =>
        s.className?.toLowerCase().trim() === className?.toLowerCase().trim()
      );
      setStudents(classStudents);

      // Load existing grades for this class + term
      const gradeSnap = await getDocs(
        query(
          collection(db, 'grades'),
          where('className', '==', className),
          where('term',      '==', term)
        )
      );
      const existing = gradeSnap.docs.map(d => ({ id:d.id, ...d.data() }));
      setExistingGrades(existing);

      // Pre-fill scores from existing grades
      const init = {};
      classStudents.forEach(s => {
        const uid = s.uid || s.id;
        init[uid] = {};
        SUBJECTS.forEach(sub => {
          init[uid][sub] = {};
          EXAM_TYPES.forEach(et => {
            const found = existing.find(g =>
              g.studentName === s.name &&
              g.subject     === sub &&
              g.examType    === et
            );
            init[uid][sub][et] = found ? String(found.score) : '';
          });
        });
      });
      setScores(init);

      // Default to first student
      if (classStudents.length > 0) {
        setSelStudent(classStudents[0].uid || classStudents[0].id);
      }
    } catch (e) {
      toast.error('Failed to load: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (configured) loadData(selClass, selTerm);
  }, [configured, selClass, selTerm, loadData]);

  const setScore = (uid, subject, examType, value) => {
    const clean = value.replace(/[^0-9]/g, '');
    if (clean !== '' && Number(clean) > 100) return;
    setScores(prev => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        [subject]: { ...prev[uid]?.[subject], [examType]: clean },
      },
    }));
  };

  const handleSave = async () => {
    const toSave = [];
    students.forEach(s => {
      const uid = s.uid || s.id;
      SUBJECTS.forEach(sub => {
        EXAM_TYPES.forEach(et => {
          const score = scores[uid]?.[sub]?.[et];
          if (score !== '' && score !== undefined) {
            toSave.push({ student:s, subject:sub, examType:et, score:Number(score) });
          }
        });
      });
    });

    if (toSave.length === 0) {
      toast.error('Enter at least one score before saving.');
      return;
    }

    setSaving(true);
    try {
      // Remove duplicates before re-saving
      const toDelete = existingGrades.filter(g =>
        toSave.some(s =>
          s.student.name === g.studentName &&
          s.subject      === g.subject &&
          s.examType     === g.examType
        )
      );
      await Promise.all(toDelete.map(g => deleteDoc(doc(db, 'grades', g.id))));

      // Save fresh grades
      await Promise.all(toSave.map(e =>
        addDoc(collection(db, 'grades'), {
          studentId:   e.student.uid || e.student.id,
          studentName: e.student.name,
          admissionNo: e.student.admissionNo || '',
          className:   selClass,
          subject:     e.subject,
          examType:    e.examType,
          score:       e.score,
          term:        selTerm,
          teacherId:   profile?.uid  || '',
          teacherName: profile?.name || '',
          createdAt:   serverTimestamp(),
        })
      ));

      toast.success(`✅ ${toSave.length} grade(s) saved!`);
      await loadData(selClass, selTerm);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Computed: get subject average for a student ──────────
  const getSubjectAvg = (uid, subject) => {
    const subScores = EXAM_TYPES
      .map(et => scores[uid]?.[subject]?.[et])
      .filter(v => v !== '' && v !== undefined)
      .map(Number);
    return subScores.length
      ? Math.round(subScores.reduce((a,b) => a+b,0) / subScores.length)
      : null;
  };

  const getStudentOverall = (uid) => {
    const allScores = SUBJECTS.flatMap(sub =>
      EXAM_TYPES
        .map(et => scores[uid]?.[sub]?.[et])
        .filter(v => v !== '' && v !== undefined)
        .map(Number)
    );
    return allScores.length
      ? Math.round(allScores.reduce((a,b)=>a+b,0)/allScores.length)
      : null;
  };

  // ── Step 1: Config screen ────────────────────────────────
  if (!configured) {
    return (
      <Layout title="Grade Entry" subtitle="Select class and term to begin">
        <div style={s.configWrap}>
          <div style={s.configCard}>

            <div style={s.configSection}>
              <div style={s.configLabel}>SELECT CLASS</div>
              <div style={s.chipGrid}>
                {CLASSES.map(c => (
                  <button
                    key={c}
                    style={{
                      ...s.chip,
                      borderColor: selClass===c ? '#2A9D8F' : '#E8ECF4',
                      background:  selClass===c ? '#F0FAFA' : '#F8F9FD',
                      color:       selClass===c ? '#2A9D8F' : '#8896AB',
                      fontWeight:  selClass===c ? 700 : 500,
                    }}
                    onClick={() => setSelClass(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.configSection}>
              <div style={s.configLabel}>SELECT TERM</div>
              <div style={s.chipGrid}>
                {TERMS.map(t => (
                  <button
                    key={t}
                    style={{
                      ...s.chip,
                      borderColor: selTerm===t ? '#2A9D8F' : '#E8ECF4',
                      background:  selTerm===t ? '#F0FAFA' : '#F8F9FD',
                      color:       selTerm===t ? '#2A9D8F' : '#8896AB',
                      fontWeight:  selTerm===t ? 700 : 500,
                    }}
                    onClick={() => setSelTerm(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.configPreview}>
              <span style={{ fontSize:20 }}>📝</span>
              <div>
                <div style={s.configPreviewTitle}>
                  Grade Entry: {selClass} — {selTerm}
                </div>
                <div style={s.configPreviewSub}>
                  {SUBJECTS.length} subjects × {EXAM_TYPES.length} assessment types
                </div>
              </div>
            </div>

            <button
              style={s.proceedBtn}
              onClick={() => setConfigured(true)}
            >
              Proceed to Grade Entry →
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Step 2: Grade Entry ──────────────────────────────────
  return (
    <Layout title="Grade Entry" subtitle={`${selClass} — ${selTerm}`}>

      {/* Top action bar */}
      <div style={s.actionBar}>
        <button
          style={s.backBtn}
          onClick={() => { setConfigured(false); setStudents([]); setScores({}); }}
        >
          ← Change Class/Term
        </button>
        <div style={s.actionBarInfo}>
          <span style={s.classTag}>🏫 {selClass}</span>
          <span style={s.termTag}>📅 {selTerm}</span>
          {students.length > 0 && (
            <span style={s.countTag}>👥 {students.length} students</span>
          )}
        </div>
        <button
          style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save All Grades'}
        </button>
      </div>

      {loading ? (
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <div style={s.loadingText}>Loading students and existing grades...</div>
        </div>
      ) : students.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🎓</div>
          <div style={s.emptyTitle}>No students in {selClass}</div>
          <div style={s.emptySub}>Ask admin to add students to this class first</div>
          <button style={s.emptyBtn} onClick={() => setConfigured(false)}>
            ← Change Class
          </button>
        </div>
      ) : (
        <div style={s.gradeLayout}>

          {/* Left — student list */}
          <div style={s.studentList}>
            <div style={s.studentListHeader}>Students</div>
            {students.map(s2 => {
              const uid     = s2.uid || s2.id;
              const overall = getStudentOverall(uid);
              const gi      = overall !== null ? getGradeInfo(overall) : null;
              const isActive= selStudent === uid;
              return (
                <div
                  key={uid}
                  style={{
                    ...s.studentItem,
                    background:  isActive ? '#F0FAFA' : '#fff',
                    borderLeft:  isActive ? '3px solid #2A9D8F' : '3px solid transparent',
                  }}
                  onClick={() => setSelStudent(uid)}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='#F8F9FD'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='#fff'; }}
                >
                  <div style={{ ...s.studentItemAvatar, background: gi ? gi.color+'20' : '#F0F3FA', color: gi?.color || '#8896AB' }}>
                    {s2.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={s.studentItemInfo}>
                    <div style={s.studentItemName}>{s2.name}</div>
                    <div style={s.studentItemMeta}>{s2.admissionNo || '—'}</div>
                  </div>
                  {gi && (
                    <div style={{ ...s.studentItemGrade, background:gi.color+'18', color:gi.color }}>
                      {overall}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right — grade table for selected student */}
          <div style={s.tableWrap}>
            {selStudent && (() => {
              const student = students.find(s2 => (s2.uid||s2.id) === selStudent);
              const overall  = getStudentOverall(selStudent);
              const gi       = overall !== null ? getGradeInfo(overall) : null;

              return (
                <>
                  {/* Student banner */}
                  <div style={s.studentBanner}>
                    <div style={s.studentBannerLeft}>
                      <div style={s.studentBannerAvatar}>
                        {student?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={s.studentBannerName}>{student?.name}</div>
                        <div style={s.studentBannerMeta}>
                          {student?.admissionNo || '—'} · {selClass} · {selTerm}
                        </div>
                      </div>
                    </div>
                    {gi && (
                      <div style={s.studentBannerRight}>
                        <div style={{ fontSize:32, fontWeight:900, color:gi.color }}>{overall}%</div>
                        <div style={{ ...s.overallBadge, background:gi.color, color:'#fff' }}>
                          Grade {gi.letter} — {gi.remark}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hint */}
                  <div style={s.hint}>
                    💡 Enter scores from 0–100. Existing grades are pre-filled. Click Save when done.
                  </div>

                  {/* Grade table */}
                  <div style={s.tableScroll}>
                    <table style={s.table}>
                      <thead>
                        <tr>
                          <th style={{ ...s.th, ...s.subjectTh, textAlign:'left' }}>Subject</th>
                          {EXAM_TYPES.map(et => (
                            <th key={et} style={s.th}>{et}</th>
                          ))}
                          <th style={s.th}>Average</th>
                          <th style={s.th}>Grade</th>
                          <th style={s.th}>Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SUBJECTS.map((sub, si) => {
                          const avg = getSubjectAvg(selStudent, sub);
                          const gi2 = avg !== null ? getGradeInfo(avg) : null;
                          return (
                            <tr
                              key={sub}
                              style={{ background: si%2===0 ? '#fff' : '#F8F9FD' }}
                            >
                              <td style={s.subjectTd}>{sub}</td>
                              {EXAM_TYPES.map(et => {
                                const val = scores[selStudent]?.[sub]?.[et] || '';
                                const gi3 = val !== '' ? getGradeInfo(Number(val)) : null;
                                return (
                                  <td key={et} style={s.scoreTd}>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={val}
                                      onChange={e => setScore(selStudent, sub, et, e.target.value)}
                                      placeholder="—"
                                      style={{
                                        ...s.scoreInput,
                                        borderColor: gi3 ? gi3.color : '#E8ECF4',
                                        color:       gi3 ? gi3.color : '#0D1B3E',
                                        fontWeight:  gi3 ? 800 : 400,
                                      }}
                                      onFocus={e => e.target.style.boxShadow='0 0 0 3px #2A9D8F18'}
                                      onBlur={e => e.target.style.boxShadow='none'}
                                    />
                                  </td>
                                );
                              })}
                              <td style={s.avgTd}>
                                {avg !== null ? (
                                  <span style={{ fontWeight:800, color:gi2?.color||'#0D1B3E' }}>
                                    {avg}%
                                  </span>
                                ) : '—'}
                              </td>
                              <td style={s.gradeTd}>
                                {gi2 ? (
                                  <span style={{
                                    ...s.gradePill,
                                    background: gi2.color+'20',
                                    color:      gi2.color,
                                  }}>
                                    {gi2.letter}
                                  </span>
                                ) : '—'}
                              </td>
                              <td style={s.remarkTd}>
                                {gi2 ? (
                                  <span style={{ color:gi2.color, fontWeight:600, fontSize:12 }}>
                                    {gi2.remark}
                                  </span>
                                ) : '—'}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Overall row */}
                        <tr style={s.overallTr}>
                          <td style={{ ...s.subjectTd, fontWeight:800, color:'#0D1B3E', fontSize:12, letterSpacing:0.5 }}>
                            OVERALL AVERAGE
                          </td>
                          {EXAM_TYPES.map(et => <td key={et} />)}
                          <td style={s.avgTd}>
                            {overall !== null ? (
                              <span style={{ fontSize:16, fontWeight:900, color:gi?.color||'#0D1B3E' }}>
                                {overall}%
                              </span>
                            ) : '—'}
                          </td>
                          <td style={s.gradeTd}>
                            {gi && (
                              <span style={{
                                ...s.gradePill,
                                background: gi.color+'20',
                                color:      gi.color,
                                fontSize:   14,
                                padding:    '4px 12px',
                              }}>
                                {gi.letter}
                              </span>
                            )}
                          </td>
                          <td style={s.remarkTd}>
                            {gi && (
                              <span style={{ color:gi.color, fontWeight:700 }}>{gi.remark}</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Nav between students */}
                  <div style={s.studentNav}>
                    <button
                      style={s.navBtn}
                      onClick={() => {
                        const idx  = students.findIndex(s2 => (s2.uid||s2.id)===selStudent);
                        const prev = students[idx-1];
                        if (prev) setSelStudent(prev.uid||prev.id);
                      }}
                      disabled={students.findIndex(s2=>(s2.uid||s2.id)===selStudent) === 0}
                    >
                      ← Previous Student
                    </button>
                    <span style={s.navCount}>
                      {students.findIndex(s2=>(s2.uid||s2.id)===selStudent)+1} of {students.length}
                    </span>
                    <button
                      style={s.navBtn}
                      onClick={() => {
                        const idx  = students.findIndex(s2=>(s2.uid||s2.id)===selStudent);
                        const next = students[idx+1];
                        if (next) setSelStudent(next.uid||next.id);
                      }}
                      disabled={students.findIndex(s2=>(s2.uid||s2.id)===selStudent) === students.length-1}
                    >
                      Next Student →
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <style>{css}</style>
    </Layout>
  );
}

const s = {
  configWrap: { display:'flex', justifyContent:'center', paddingTop:20 },
  configCard: {
    background:'#fff', borderRadius:20, padding:40,
    border:'1px solid #E8ECF4', maxWidth:700, width:'100%',
    boxShadow:'0 4px 20px rgba(13,27,62,0.08)',
  },
  configSection: { marginBottom:28 },
  configLabel:   { fontSize:11, fontWeight:700, color:'#8896AB', letterSpacing:2, marginBottom:12, textTransform:'uppercase' },
  chipGrid:      { display:'flex', flexWrap:'wrap', gap:10 },
  chip: {
    padding:'9px 18px', borderRadius:10, border:'1.5px solid',
    fontSize:13, cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit',
  },
  configPreview: {
    display:'flex', alignItems:'center', gap:14,
    background:'#F0FAFA', border:'1.5px solid #2A9D8F40',
    borderRadius:12, padding:'14px 18px', marginBottom:24,
  },
  configPreviewTitle:{ fontSize:15, fontWeight:700, color:'#2A9D8F' },
  configPreviewSub:  { fontSize:13, color:'#8896AB', marginTop:3 },
  proceedBtn: {
    width:'100%', padding:'14px', background:'linear-gradient(135deg,#2A9D8F,#1A6B64)',
    color:'#fff', border:'none', borderRadius:12,
    fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
  },

  actionBar: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    marginBottom:20, gap:12, flexWrap:'wrap',
  },
  backBtn: {
    padding:'9px 18px', border:'1.5px solid #E8ECF4', borderRadius:9,
    background:'#fff', fontSize:13, fontWeight:600, color:'#4A5568',
    cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
  },
  actionBarInfo: { display:'flex', gap:8, alignItems:'center', flex:1, flexWrap:'wrap' },
  classTag: { background:'#EEF2FF', color:'#4361EE', fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20 },
  termTag:  { background:'#F0FAFA', color:'#2A9D8F', fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20 },
  countTag: { background:'#F8F9FD', color:'#8896AB', fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:20 },
  saveBtn:  {
    padding:'10px 24px', background:'linear-gradient(135deg,#2A9D8F,#1A6B64)',
    color:'#fff', border:'none', borderRadius:10,
    fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
    boxShadow:'0 4px 12px rgba(42,157,143,0.3)',
  },

  loadingWrap:  { display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 20px', gap:16 },
  spinner:      { width:40, height:40, border:'3px solid #E8ECF4', borderTopColor:'#2A9D8F', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
  loadingText:  { color:'#8896AB', fontSize:14 },

  empty:     { textAlign:'center', padding:'80px 20px' },
  emptyIcon: { fontSize:52, marginBottom:12 },
  emptyTitle:{ fontSize:18, fontWeight:700, color:'#0D1B3E', marginBottom:8 },
  emptySub:  { color:'#8896AB', fontSize:14, marginBottom:20 },
  emptyBtn:  { padding:'10px 24px', background:'#F0FAFA', color:'#2A9D8F', border:'1.5px solid #2A9D8F40', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },

  gradeLayout:   { display:'grid', gridTemplateColumns:'240px 1fr', gap:20, alignItems:'start' },

  studentList:       { background:'#fff', borderRadius:16, border:'1px solid #E8ECF4', overflow:'hidden', boxShadow:'0 2px 12px rgba(13,27,62,0.06)' },
  studentListHeader: { padding:'14px 16px', background:'#0D1B3E', color:'#fff', fontSize:12, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase' },
  studentItem:       { display:'flex', alignItems:'center', gap:10, padding:'12px 14px', cursor:'pointer', borderBottom:'1px solid #F0F3FA', transition:'all 0.15s' },
  studentItemAvatar: { width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:16, flexShrink:0 },
  studentItemInfo:   { flex:1, minWidth:0 },
  studentItemName:   { fontSize:13, fontWeight:700, color:'#0D1B3E', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  studentItemMeta:   { fontSize:11, color:'#8896AB', marginTop:2 },
  studentItemGrade:  { fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:20, flexShrink:0 },

  tableWrap: { background:'#fff', borderRadius:16, border:'1px solid #E8ECF4', overflow:'hidden', boxShadow:'0 2px 12px rgba(13,27,62,0.06)' },

  studentBanner:      { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', background:'linear-gradient(135deg,#2A9D8F,#1A6B64)' },
  studentBannerLeft:  { display:'flex', alignItems:'center', gap:14 },
  studentBannerAvatar:{ width:52, height:52, borderRadius:14, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:24, border:'2px solid rgba(255,255,255,0.3)' },
  studentBannerName:  { color:'#fff', fontSize:18, fontWeight:800 },
  studentBannerMeta:  { color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:3 },
  studentBannerRight: { textAlign:'right' },
  overallBadge:       { display:'inline-block', padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700, marginTop:4 },

  hint: {
    background:'#F0FAFA', borderLeft:'4px solid #2A9D8F',
    padding:'10px 16px', margin:'0', fontSize:13, color:'#2A9D8F',
  },

  tableScroll: { overflowX:'auto' },
  table:       { width:'100%', borderCollapse:'collapse', minWidth:700 },

  th: {
    background:'#0D1B3E', color:'#fff', fontSize:11,
    fontWeight:700, padding:'12px 10px', textAlign:'center',
    letterSpacing:0.5, whiteSpace:'nowrap',
  },
  subjectTh: { width:160, textAlign:'left', paddingLeft:16 },

  subjectTd: {
    padding:'12px 16px', fontSize:13, fontWeight:600, color:'#0D1B3E',
    borderBottom:'1px solid #F0F3FA', whiteSpace:'nowrap',
    borderRight:'1px solid #F0F3FA',
  },
  scoreTd: { padding:'8px', textAlign:'center', borderBottom:'1px solid #F0F3FA' },
  avgTd:   { padding:'10px', textAlign:'center', borderBottom:'1px solid #F0F3FA', fontWeight:700, fontSize:14 },
  gradeTd: { padding:'10px', textAlign:'center', borderBottom:'1px solid #F0F3FA' },
  remarkTd:{ padding:'10px', textAlign:'center', borderBottom:'1px solid #F0F3FA' },

  scoreInput: {
    width:56, height:40, borderRadius:8, border:'1.5px solid',
    textAlign:'center', fontSize:15, fontFamily:'inherit',
    outline:'none', background:'#F8F9FD', transition:'all 0.2s',
  },
  gradePill: {
    display:'inline-block', padding:'3px 10px',
    borderRadius:8, fontSize:13, fontWeight:800,
  },
  overallTr: { background:'#F0F3FA', borderTop:'2px solid #2A9D8F30' },

  studentNav: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'16px 24px', borderTop:'1px solid #E8ECF4',
  },
  navBtn: {
    padding:'8px 18px', border:'1.5px solid #E8ECF4',
    borderRadius:9, background:'#fff', fontSize:13,
    fontWeight:600, color:'#4A5568', cursor:'pointer',
    fontFamily:'inherit', transition:'all 0.2s',
  },
  navCount: { fontSize:13, color:'#8896AB', fontWeight:600 },
};

const css = `
  @keyframes spin { to { transform: rotate(360deg); } }
  table tr:hover td { background: #F0FAFA !important; }
`;