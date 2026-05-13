// src/pages/student/MyGrades.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import { generateResultPDF, generateReportCard } from '../../utils/pdfGenerator';

const SUBJECTS = ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Economics'];
const EXAM_TYPES = ['CA1', 'CA2', 'Mid-Term', 'Exam', 'Final'];
const TERMS = ['All', 'First Term 2025', 'Second Term 2025', 'Third Term 2025'];

const getGradeInfo = (score) => {
  const s = Number(score);
  if (isNaN(s)) return null;
  if (s >= 80) return { letter: 'A', color: '#27AE60', remark: 'Excellent' };
  if (s >= 70) return { letter: 'B', color: '#4361EE', remark: 'Very Good' };
  if (s >= 60) return { letter: 'C', color: '#20C997', remark: 'Good' };
  if (s >= 50) return { letter: 'D', color: '#F5A623', remark: 'Pass' };
  return { letter: 'F', color: '#E63946', remark: 'Fail' };
};

export default function MyGrades() {
  const { profile } = useAuth();
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selTerm, setSelTerm] = useState(TERMS[3]); // default latest term

  useEffect(() => {
    const load = async () => {
      if (!profile) { setLoading(false); return; }
      try {
        const snap = await getDocs(collection(db, 'grades'));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Match by name (case insensitive) OR by uid
        const mine = all.filter(g =>
          g.studentName?.trim().toLowerCase() === profile.name?.trim().toLowerCase() ||
          g.studentId === profile.uid
        );
        setGrades(mine);

        // Attendance
        const attSnap = await getDocs(collection(db, 'attendance'));
        const myAtt = [];
        attSnap.docs.forEach(d => {
          const rec = d.data();
          const sr = rec.records?.[profile.uid];
          if (sr) myAtt.push({ ...sr, date: rec.date, dateLabel: rec.dateLabel });
        });
        setAttendance(myAtt);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile]);

  // Filter by term
  const filtered = selTerm === 'All' ? grades : grades.filter(g => g.term === selTerm);

  // Build subject map: subject → examType → score
  const bySubject = {};
  filtered.forEach(g => {
    if (!bySubject[g.subject]) bySubject[g.subject] = {};
    bySubject[g.subject][g.examType] = Number(g.score || 0);
  });

  const getSubjectAvg = (subject) => {
    const scores = Object.values(bySubject[subject] || {}).filter(v => v > 0);
    return scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  };

  const overallAvg = filtered.length
    ? Math.round(filtered.reduce((s, g) => s + Number(g.score || 0), 0) / filtered.length)
    : 0;
  const overallGi = overallAvg > 0 ? getGradeInfo(overallAvg) : null;

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attRate = attendance.length
    ? Math.round((presentCount / attendance.length) * 100)
    : 0;

  const activeSubjects = SUBJECTS.filter(sub => bySubject[sub]);

  return (
    <Layout
      title="My Results"
      subtitle={`${profile?.className || '—'} · ${profile?.admissionNo || '—'}`}
    >

      {/* Summary banner */}
      <div style={s.banner}>
        <div style={s.bannerLeft}>
          <div style={{ ...s.bannerAvg, color: overallGi?.color || '#fff' }}>
            {overallAvg || '—'}%
          </div>
          <div style={s.bannerLabel}>Overall Average</div>
          {overallGi && (
            <div style={{ ...s.bannerBadge, background: overallGi.color }}>
              Grade {overallGi.letter} — {overallGi.remark}
            </div>
          )}
        </div>
        <div style={s.bannerStats}>
          {[
            { icon: '📚', label: 'Subjects', value: activeSubjects.length },
            { icon: '📝', label: 'Assessments', value: filtered.length },
            { icon: '✅', label: 'Attendance', value: `${attRate}%` },
            { icon: '📅', label: 'Term', value: selTerm === 'All' ? 'All' : selTerm.replace(' 2025', '') },
          ].map((item, i) => (
            <div key={i} style={s.bannerStat}>
              <div style={s.bannerStatIcon}>{item.icon}</div>
              <div style={s.bannerStatValue}>{item.value}</div>
              <div style={s.bannerStatLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Print buttons */}
      <div style={s.printRow}>
        <button
          style={s.printBtn}
          onClick={() => generateResultPDF(profile, filtered)}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          📄 Download Result Slip
        </button>
        <button
          style={{ ...s.printBtn, background: 'linear-gradient(135deg,#27AE60,#1E8449)', boxShadow: '0 4px 12px rgba(39,174,96,0.3)' }}
          onClick={() => generateReportCard(profile, filtered, attendance, selTerm === 'All' ? 'All Terms' : selTerm)}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          📋 Download Report Card
        </button>
      </div>

      {/* Term filter */}
      <div style={s.termFilter}>
        {TERMS.map(t => (
          <button
            key={t}
            style={{
              ...s.termChip,
              borderColor: selTerm === t ? '#4361EE' : '#E8ECF4',
              background: selTerm === t ? '#EEF2FF' : '#fff',
              color: selTerm === t ? '#4361EE' : '#8896AB',
              fontWeight: selTerm === t ? 700 : 500,
            }}
            onClick={() => setSelTerm(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <div style={{ color: '#8896AB' }}>Loading your results...</div>
        </div>
      ) : grades.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📊</div>
          <div style={s.emptyTitle}>No results yet</div>
          <div style={s.emptySub}>
            Your grades will appear here once your teacher uploads them
          </div>
        </div>
      ) : activeSubjects.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📊</div>
          <div style={s.emptyTitle}>No results for this term</div>
          <div style={s.emptySub}>Try selecting a different term above</div>
        </div>
      ) : (

        /* Results table */
        <div style={s.tableCard}>
          <div style={s.tableHeader}>
            <h3 style={s.tableTitle}>
              Academic Results — {selTerm}
            </h3>
            <div style={s.tableSubTitle}>
              {activeSubjects.length} subjects · {filtered.length} assessments
            </div>
          </div>

          <div style={s.tableScroll}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, ...s.subjectTh }}>Subject</th>
                  {EXAM_TYPES.map(et => (
                    <th key={et} style={s.th}>{et}</th>
                  ))}
                  <th style={{ ...s.th, background: '#1A3066' }}>Average</th>
                  <th style={{ ...s.th, background: '#1A3066' }}>Grade</th>
                  <th style={{ ...s.th, background: '#1A3066' }}>Remark</th>
                </tr>
              </thead>
              <tbody>
                {SUBJECTS.map((sub, si) => {
                  if (!bySubject[sub]) return null;
                  const avg = getSubjectAvg(sub);
                  const gi = avg !== null ? getGradeInfo(avg) : null;
                  return (
                    <tr
                      key={sub}
                      style={{ background: si % 2 === 0 ? '#fff' : '#F8F9FD' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F0F3FF'}
                      onMouseLeave={e => e.currentTarget.style.background = si % 2 === 0 ? '#fff' : '#F8F9FD'}
                    >
                      <td style={s.subjectTd}>{sub}</td>
                      {EXAM_TYPES.map(et => {
                        const score = bySubject[sub]?.[et];
                        const gi2 = score ? getGradeInfo(score) : null;
                        return (
                          <td key={et} style={s.scoreTd}>
                            {score ? (
                              <div style={{ ...s.scorePill, background: gi2.color + '18', color: gi2.color }}>
                                {score}
                              </div>
                            ) : (
                              <span style={s.emptyScore}>—</span>
                            )}
                          </td>
                        );
                      })}
                      <td style={s.avgTd}>
                        {avg !== null ? (
                          <span style={{ fontWeight: 800, color: gi?.color || '#0D1B3E' }}>
                            {avg}%
                          </span>
                        ) : '—'}
                      </td>
                      <td style={s.gradeTd}>
                        {gi ? (
                          <span style={{ ...s.gradePill, background: gi.color + '18', color: gi.color }}>
                            {gi.letter}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={s.remarkTd}>
                        {gi ? (
                          <span style={{ color: gi.color, fontWeight: 600, fontSize: 12 }}>
                            {gi.remark}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}

                {/* Overall row */}
                <tr style={s.overallTr}>
                  <td style={{ ...s.subjectTd, fontWeight: 900, color: '#0D1B3E', fontSize: 12, letterSpacing: 0.5 }}>
                    OVERALL AVERAGE
                  </td>
                  {EXAM_TYPES.map(et => <td key={et} style={s.scoreTd} />)}
                  <td style={s.avgTd}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: overallGi?.color || '#0D1B3E' }}>
                      {overallAvg}%
                    </span>
                  </td>
                  <td style={s.gradeTd}>
                    {overallGi && (
                      <span style={{ ...s.gradePill, background: overallGi.color + '20', color: overallGi.color, fontSize: 15, padding: '5px 14px' }}>
                        {overallGi.letter}
                      </span>
                    )}
                  </td>
                  <td style={s.remarkTd}>
                    {overallGi && (
                      <span style={{ color: overallGi.color, fontWeight: 700, fontSize: 13 }}>
                        {overallGi.remark}
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Attendance row */}
          <div style={s.attRow}>
            <span style={s.attLabel}>Attendance Rate:</span>
            <div style={s.attBarWrap}>
              <div style={s.attBarBg}>
                <div style={{
                  ...s.attBarFill,
                  width: `${attRate}%`,
                  background: attRate >= 90 ? '#27AE60' : attRate >= 75 ? '#F5A623' : '#E63946',
                }} />
              </div>
            </div>
            <span style={{
              ...s.attPct,
              color: attRate >= 90 ? '#27AE60' : attRate >= 75 ? '#F5A623' : '#E63946',
            }}>
              {attRate}% ({presentCount}/{attendance.length} sessions)
            </span>
          </div>
        </div>
      )}

      <style>{css}</style>
    </Layout>
  );
}

const s = {
  banner: {
    background: 'linear-gradient(135deg,#4361EE,#2541C4)',
    borderRadius: 20, padding: '28px 32px',
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20, gap: 20, flexWrap: 'wrap',
  },
  bannerLeft: { flex: 1 },
  bannerAvg: { fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 4 },
  bannerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 10 },
  bannerBadge: { display: 'inline-block', color: '#fff', fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20 },
  bannerStats: { display: 'flex', gap: 24 },
  bannerStat: { textAlign: 'center' },
  bannerStatIcon: { fontSize: 20, marginBottom: 4 },
  bannerStatValue: { fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1 },
  bannerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  printRow: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  printBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 20px',
    background: 'linear-gradient(135deg,#4361EE,#2541C4)',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(67,97,238,0.3)',
    transition: 'all 0.2s',
  },

  termFilter: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  termChip: {
    padding: '8px 16px', borderRadius: 20, border: '1.5px solid',
    fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
  },

  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 20px' },
  spinner: { width: 40, height: 40, border: '3px solid #E8ECF4', borderTopColor: '#4361EE', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  empty: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#0D1B3E', marginBottom: 8 },
  emptySub: { color: '#8896AB', fontSize: 14 },

  tableCard: { background: '#fff', borderRadius: 20, border: '1px solid #E8ECF4', overflow: 'hidden', boxShadow: '0 4px 20px rgba(13,27,62,0.08)' },
  tableHeader: { padding: '20px 24px', borderBottom: '1px solid #E8ECF4' },
  tableTitle: { fontSize: 16, fontWeight: 800, color: '#0D1B3E', margin: 0, marginBottom: 4 },
  tableSubTitle: { fontSize: 13, color: '#8896AB' },
  tableScroll: { overflowX: 'auto' },

  table: { width: '100%', borderCollapse: 'collapse', minWidth: 700 },

  th: {
    background: '#0D1B3E', color: '#fff',
    fontSize: 11, fontWeight: 700, padding: '12px 10px',
    textAlign: 'center', letterSpacing: 0.5, whiteSpace: 'nowrap',
  },
  subjectTh: { textAlign: 'left', paddingLeft: 20, width: 160 },

  subjectTd: {
    padding: '13px 20px', fontSize: 13, fontWeight: 700, color: '#0D1B3E',
    borderBottom: '1px solid #F0F3FA', whiteSpace: 'nowrap',
    borderRight: '2px solid #F0F3FA',
  },
  scoreTd: { padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #F0F3FA' },
  avgTd: { padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #F0F3FA', fontSize: 14 },
  gradeTd: { padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #F0F3FA' },
  remarkTd: { padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #F0F3FA' },

  scorePill: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 40, height: 34, borderRadius: 8, fontSize: 13, fontWeight: 800,
  },
  emptyScore: { color: '#C0C8D8', fontSize: 14 },
  gradePill: { display: 'inline-block', padding: '3px 10px', borderRadius: 8, fontSize: 13, fontWeight: 800 },

  overallTr: { background: '#F0F3FA', borderTop: '2px solid #4361EE30' },

  attRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderTop: '2px solid #E8ECF4', flexWrap: 'wrap' },
  attLabel: { fontSize: 14, fontWeight: 700, color: '#0D1B3E', whiteSpace: 'nowrap' },
  attBarWrap: { flex: 1, minWidth: 200 },
  attBarBg: { height: 8, background: '#F0F3FA', borderRadius: 4, overflow: 'hidden' },
  attBarFill: { height: 8, borderRadius: 4, transition: 'width 0.8s ease' },
  attPct: { fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' },
};

const css = `
  @keyframes spin { to { transform:rotate(360deg); } }
`;