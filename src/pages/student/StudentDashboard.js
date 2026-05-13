// src/pages/student/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, getDocs, query,
  orderBy, limit, where,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const SUBJECT_COLORS = {
  'Mathematics': '#4361EE',
  'English Language': '#2A9D8F',
  'Biology': '#27AE60',
  'Chemistry': '#E63946',
  'Physics': '#F5A623',
  'History': '#6F42C1',
  'Geography': '#E84393',
  'Economics': '#20C997',
  'Further Maths': '#3498DB',
  'Computer Science': '#0D1B3E',
  'Free Period': '#8896AB',
  'Assembly': '#F5A623',
  'Closing': '#8896AB',
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [grades, setGrades] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [fees, setFees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const [timetableLoad, setTimetableLoad] = useState(false);

  const todayIdx = Math.min(Math.max(new Date().getDay() - 1, 0), 4);
  const [selDay, setSelDay] = useState(todayIdx);
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  // ── Load all data ─────────────────────────────────────
  useEffect(() => {
    if (!profile) return;

    const load = async () => {
      try {
        // Load ALL grades then filter client-side
        // avoids case sensitivity and composite index issues
        const [gradeSnap, annSnap, feeSnap, assignSnap] = await Promise.all([
          getDocs(collection(db, 'grades')),
          getDocs(query(
            collection(db, 'announcements'),
            orderBy('createdAt', 'desc'),
            limit(4)
          )),
          getDocs(collection(db, 'fees')),
          getDocs(query(
            collection(db, 'assignments'),
            orderBy('createdAt', 'desc'),
            limit(5)
          )),
        ]);

        // Filter grades — match by name OR uid (both ways)
        const allGrades = gradeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const myGrades = allGrades.filter(g =>
          g.studentName?.trim().toLowerCase() === profile.name?.trim().toLowerCase() ||
          g.studentId === profile.uid
        );
        setGrades(myGrades);

        setAnnouncements(annSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Filter fees
        const allFees = feeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const myFees = allFees.filter(f =>
          f.studentName?.trim().toLowerCase() === profile.name?.trim().toLowerCase()
        );
        setFees(myFees);

        setAssignments(assignSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Load timetable for student's class
        if (profile.className) {
          setTimetableLoad(true);
          const result = {};
          for (const day of DAYS) {
            const snap = await getDocs(
              collection(db, 'timetable', profile.className, 'days', day, 'periods')
            );
            result[day] = snap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
          }
          setTimetable(result);
          setTimetableLoad(false);
        }
      } catch (e) {
        console.warn('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [profile]);

  // ── Computed values ───────────────────────────────────
  const avgScore = grades.length
    ? Math.round(grades.reduce((s, g) => s + Number(g.score || 0), 0) / grades.length)
    : 0;

  const gradeLabel = avgScore >= 80 ? 'Distinction'
    : avgScore >= 70 ? 'Credit'
      : avgScore >= 60 ? 'Merit'
        : avgScore >= 50 ? 'Pass'
          : 'Below Average';

  const gradeColor = avgScore >= 80 ? '#27AE60'
    : avgScore >= 70 ? '#4361EE'
      : avgScore >= 60 ? '#20C997'
        : avgScore >= 50 ? '#F5A623'
          : '#E63946';

  const pendingFees = fees.filter(f => f.status === 'pending');
  const totalPending = pendingFees.reduce((s, f) => s + Number(f.amount || 0), 0);

  const todayClasses = timetable[DAYS[selDay]] || [];

  const parseTime = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const getDueDays = (dueDate) => {
    if (!dueDate) return null;
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: 'Overdue', color: '#E63946' };
    if (diff === 0) return { label: 'Due Today', color: '#F5A623' };
    if (diff === 1) return { label: 'Due Tomorrow', color: '#F5A623' };
    return { label: `${diff} days left`, color: '#27AE60' };
  };

  const QUICK = [
    { icon: '📊', label: 'My Results', color: '#4361EE', bg: '#EEF2FF', path: '/student/grades' },
    { icon: '✅', label: 'Attendance', color: '#27AE60', bg: '#F0FAF4', path: '/student/attendance' },
    { icon: '📝', label: 'Assignments', color: '#F5A623', bg: '#FFFAF0', path: '/student/assignments' },
    { icon: '📅', label: 'Timetable', color: '#2A9D8F', bg: '#F0FAFA', path: '/student/timetable' },
    { icon: '💰', label: 'Fees', color: '#6F42C1', bg: '#F5F0FF', path: '/student/fees' },
    { icon: '💬', label: 'Messages', color: '#E63946', bg: '#FFF0F0', path: '/student/messages' },
  ];

  return (
    <Layout
      title="Student Dashboard"
      subtitle={`${profile?.className || 'Grade —'} · Adm: ${profile?.admissionNo || '—'}`}
    >

      {/* Fee Alert */}
      {totalPending > 0 && (
        <div style={s.feeAlert} onClick={() => navigate('/student/fees')}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={s.feeAlertTitle}>Outstanding School Fees</div>
            <div style={s.feeAlertSub}>
              ₦{totalPending.toLocaleString()} pending — {pendingFees.length} record(s)
            </div>
          </div>
          <span style={s.feeAlertArrow}>Pay Now →</span>
        </div>
      )}

      {/* Stats Row */}
      <div style={s.statsRow}>
        {[
          { icon: '📊', label: 'Overall Average', value: `${avgScore}%`, sub: gradeLabel, color: gradeColor, bg: gradeColor + '12', path: '/student/grades' },
          { icon: '📚', label: 'Subjects', value: new Set(grades.map(g => g.subject)).size, sub: 'Tracked', color: '#4361EE', bg: '#EEF2FF', path: '/student/grades' },
          { icon: '📝', label: 'Assignments', value: assignments.length, sub: 'Posted', color: '#F5A623', bg: '#FFFAF0', path: '/student/assignments' },
          { icon: '💰', label: 'Fee Balance', value: `₦${totalPending.toLocaleString()}`, sub: 'Pending', color: totalPending > 0 ? '#E63946' : '#27AE60', bg: totalPending > 0 ? '#FFF0F0' : '#F0FAF4', path: '/student/fees' },
        ].map((stat, i) => (
          <div
            key={i}
            style={s.statCard}
            onClick={() => navigate(stat.path)}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 12px 30px ${stat.color}20`;
              e.currentTarget.style.borderColor = stat.color;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(13,27,62,0.08)';
              e.currentTarget.style.borderColor = '#E8ECF4';
            }}
          >
            <div style={{ ...s.statIcon, background: stat.bg }}>
              <span style={{ fontSize: 22 }}>{stat.icon}</span>
            </div>
            <div style={{ ...s.statValue, color: stat.color }}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
            <div style={s.statSub}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h3 style={s.cardTitle}>Quick Access</h3>
        </div>
        <div style={s.quickGrid}>
          {QUICK.map((q, i) => (
            <button
              key={i}
              onClick={() => navigate(q.path)}
              style={s.quickBtn}
              onMouseEnter={e => {
                e.currentTarget.style.background = q.bg;
                e.currentTarget.style.borderColor = q.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#E8ECF4';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ ...s.quickIcon, background: q.bg }}>
                <span style={{ fontSize: 24 }}>{q.icon}</span>
              </div>
              <span style={{ ...s.quickLabel, color: q.color }}>{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Middle row */}
      <div style={s.midRow}>

        {/* Performance */}
        <div style={{ ...s.card, background: 'linear-gradient(135deg,#4361EE,#2541C4)', border: 'none' }}>
          <div style={s.cardHeader}>
            <h3 style={{ ...s.cardTitle, color: '#fff' }}>Academic Performance</h3>
            <button
              style={{ ...s.viewBtn, color: 'rgba(255,255,255,0.8)' }}
              onClick={() => navigate('/student/grades')}
            >
              View All →
            </button>
          </div>
          <div style={s.perfContent}>
            <div style={s.perfLeft}>
              <div style={s.perfAvg}>{avgScore}%</div>
              <div style={s.perfLabel}>Overall Average</div>
              <div style={{ ...s.perfBadge, background: gradeColor }}>{gradeLabel}</div>
            </div>
            <div style={s.perfRight}>
              {grades.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', paddingTop: 20 }}>
                  No grades yet
                </div>
              ) : (
                grades.slice(0, 4).map((g, i) => (
                  <div key={i} style={s.perfRow}>
                    <span style={s.perfSubject} title={g.subject}>
                      {g.subject?.split(' ')[0] || '—'}
                    </span>
                    <div style={s.perfBarBg}>
                      <div style={{
                        ...s.perfBarFill,
                        width: `${g.score}%`,
                        background: g.score >= 80 ? '#7FFF00' : g.score >= 60 ? '#FFC85A' : '#FF6B6B',
                      }} />
                    </div>
                    <span style={s.perfScore}>{g.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Timetable — Real Firestore data */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Class Schedule</h3>
            <button style={s.viewBtn} onClick={() => navigate('/student/timetable')}>
              Full Timetable →
            </button>
          </div>

          {/* Day pills */}
          <div style={s.dayPills}>
            {SHORT.map((d, i) => (
              <button
                key={i}
                onClick={() => setSelDay(i)}
                style={{
                  ...s.dayPill,
                  background: selDay === i ? '#4361EE' : '#F8F9FD',
                  color: selDay === i ? '#fff' : '#8896AB',
                  fontWeight: selDay === i ? 700 : 500,
                  border: selDay === i ? 'none' : '1px solid #E8ECF4',
                }}
              >
                {d}
                {i === todayIdx && (
                  <div style={{
                    ...s.dayDot,
                    background: selDay === i ? '#7FFF00' : '#4361EE',
                  }} />
                )}
              </button>
            ))}
          </div>

          {/* Classes list */}
          {timetableLoad ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#8896AB', fontSize: 14 }}>
              Loading schedule...
            </div>
          ) : todayClasses.length === 0 ? (
            <div style={s.emptyTimetable}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0D1B3E' }}>
                No classes on {DAYS[selDay]}
              </div>
              <div style={{ fontSize: 12, color: '#C0C8D8', marginTop: 4 }}>
                {profile?.className
                  ? 'Schedule not set yet by admin'
                  : 'No class assigned to your profile'}
              </div>
            </div>
          ) : (
            <div style={s.classList}>
              {todayClasses.map((cls, i) => {
                const color = SUBJECT_COLORS[cls.subject] || '#8896AB';
                const start = parseTime(cls.time);
                const end = parseTime(cls.endTime);
                const active = selDay === todayIdx && currentMins >= start && currentMins < end;
                const past = selDay === todayIdx && currentMins >= end;
                return (
                  <div
                    key={cls.id || i}
                    style={{
                      ...s.classRow,
                      background: active ? '#F0F3FF' : '#fff',
                      border: active ? '1.5px solid #4361EE' : '1px solid #E8ECF4',
                      opacity: past ? 0.55 : 1,
                    }}
                  >
                    <div style={{ ...s.classAccent, background: color }} />
                    <div style={s.classTime}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1B3E' }}>{cls.time}</div>
                      <div style={{ fontSize: 10, color: '#C0C8D8' }}>{cls.endTime}</div>
                    </div>
                    <div style={s.classInfo}>
                      <div style={{ ...s.classSubject, color }}>{cls.subject}</div>
                      <div style={s.classMeta}>
                        {cls.teacher && `${cls.teacher}`}
                        {cls.teacher && cls.room && ' · '}
                        {cls.room && `${cls.room}`}
                      </div>
                    </div>
                    {active && (
                      <div style={s.nowBadge}>NOW</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={s.midRow}>

        {/* Assignments */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Assignments</h3>
            <button style={s.viewBtn} onClick={() => navigate('/student/assignments')}>
              View All →
            </button>
          </div>
          {assignments.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>📝</div>
              <div style={s.emptyText}>No assignments posted yet</div>
            </div>
          ) : (
            <div style={s.assignList}>
              {assignments.map((a, i) => {
                const due = getDueDays(a.dueDate);
                const icons = {
                  'Mathematics': '🔢', 'English Language': '📖',
                  'Biology': '🧬', 'Chemistry': '⚗️', 'Physics': '⚡',
                  'History': '📜', 'Geography': '🌍', 'Economics': '📈',
                };
                return (
                  <div key={i} style={s.assignCard}>
                    <div style={s.assignLeft}>
                      <span style={{ fontSize: 24 }}>{icons[a.subject] || '📚'}</span>
                    </div>
                    <div style={s.assignInfo}>
                      <div style={s.assignTitle}>{a.title}</div>
                      <div style={s.assignMeta}>{a.subject} · {a.className}</div>
                    </div>
                    {due && (
                      <div style={{
                        ...s.dueBadge,
                        background: due.color + '18',
                        color: due.color,
                      }}>
                        {due.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Announcements</h3>
          </div>
          {announcements.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>📢</div>
              <div style={s.emptyText}>No announcements</div>
            </div>
          ) : (
            <div style={s.annList}>
              {announcements.map((ann, i) => {
                const pc = {
                  high: '#E63946', medium: '#F5A623', low: '#27AE60',
                }[ann.priority] || '#4361EE';
                return (
                  <div key={i} style={s.annCard}>
                    <div style={{ ...s.annStrip, background: pc }} />
                    <div style={s.annBody}>
                      <div style={s.annTop}>
                        <div style={s.annTitle}>{ann.title}</div>
                        <div style={{ ...s.annBadge, background: pc + '18', color: pc }}>
                          {ann.priority || 'info'}
                        </div>
                      </div>
                      <div style={s.annText}>{ann.body}</div>
                      <div style={s.annMeta}>
                        {ann.author} · {ann.dateLabel || 'Recent'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}

const s = {
  feeAlert: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: '#FFF0F0', border: '1.5px solid #FECDD3',
    borderRadius: 12, padding: '14px 20px',
    marginBottom: 24, cursor: 'pointer', transition: 'all 0.2s',
  },
  feeAlertTitle: { fontSize: 14, fontWeight: 700, color: '#E63946' },
  feeAlertSub: { fontSize: 13, color: '#E63946', opacity: 0.8, marginTop: 2 },
  feeAlertArrow: { color: '#E63946', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 },
  statCard: {
    background: '#fff', borderRadius: 16, padding: 20,
    border: '1.5px solid #E8ECF4',
    boxShadow: '0 2px 12px rgba(13,27,62,0.08)',
    cursor: 'pointer', transition: 'all 0.3s',
  },
  statIcon: { width: 46, height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: 900, lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: 700, color: '#0D1B3E', marginBottom: 2 },
  statSub: { fontSize: 11, color: '#8896AB' },

  card: {
    background: '#fff', borderRadius: 16, padding: 24,
    border: '1px solid #E8ECF4',
    boxShadow: '0 2px 12px rgba(13,27,62,0.06)',
    marginBottom: 24,
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: 800, color: '#0D1B3E', margin: 0 },
  viewBtn: { background: 'none', border: 'none', color: '#4361EE', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 },

  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 },
  quickBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '16px 8px', borderRadius: 12,
    border: '1.5px solid #E8ECF4', background: '#fff',
    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
  },
  quickIcon: { width: 46, height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: 700, textAlign: 'center' },

  midRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 0 },

  perfContent: { display: 'flex', gap: 24, alignItems: 'center' },
  perfLeft: { textAlign: 'center', paddingRight: 24, borderRight: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 },
  perfAvg: { fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1 },
  perfLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, marginBottom: 8 },
  perfBadge: { display: 'inline-block', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  perfRight: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10 },
  perfRow: { display: 'flex', alignItems: 'center', gap: 8 },
  perfSubject: { color: 'rgba(255,255,255,0.8)', fontSize: 12, width: 70, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  perfBarBg: { flex: 1, height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
  perfBarFill: { height: 6, borderRadius: 3, transition: 'width 0.8s ease' },
  perfScore: { color: '#fff', fontSize: 12, fontWeight: 700, width: 24, textAlign: 'right' },

  dayPills: { display: 'flex', gap: 8, marginBottom: 16 },
  dayPill: {
    flex: 1, padding: '8px 4px', borderRadius: 8,
    cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
    transition: 'all 0.2s', textAlign: 'center',
  },
  dayDot: { width: 4, height: 4, borderRadius: '50%', margin: '3px auto 0' },

  emptyTimetable: {
    textAlign: 'center', padding: '28px 16px',
    background: '#F8F9FD', borderRadius: 10,
    border: '1px dashed #E8ECF4',
  },

  classList: { display: 'flex', flexDirection: 'column', gap: 8 },
  classRow: { display: 'flex', alignItems: 'center', borderRadius: 10, overflow: 'hidden', transition: 'all 0.2s' },
  classAccent: { width: 4, alignSelf: 'stretch', flexShrink: 0 },
  classTime: { width: 56, padding: '10px 8px', flexShrink: 0, textAlign: 'center', borderRight: '1px solid #F0F3FA' },
  classInfo: { flex: 1, padding: '10px 12px' },
  classSubject: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
  classMeta: { fontSize: 11, color: '#8896AB' },
  nowBadge: { background: '#27AE60', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, marginRight: 8, letterSpacing: 0.5 },

  assignList: { display: 'flex', flexDirection: 'column', gap: 10 },
  assignCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F0F3FA' },
  assignLeft: { width: 40, height: 40, borderRadius: 12, background: '#F8F9FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  assignInfo: { flex: 1 },
  assignTitle: { fontSize: 13, fontWeight: 700, color: '#0D1B3E' },
  assignMeta: { fontSize: 12, color: '#8896AB', marginTop: 2 },
  dueBadge: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0 },

  annList: { display: 'flex', flexDirection: 'column', gap: 10 },
  annCard: { display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid #E8ECF4' },
  annStrip: { width: 4, flexShrink: 0 },
  annBody: { flex: 1, padding: '12px 14px' },
  annTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  annTitle: { fontSize: 13, fontWeight: 700, color: '#0D1B3E' },
  annBadge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' },
  annText: { fontSize: 12, color: '#4A5568', lineHeight: 1.5, marginBottom: 4 },
  annMeta: { fontSize: 11, color: '#8896AB' },

  empty: { textAlign: 'center', padding: '32px 20px' },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { color: '#8896AB', fontSize: 14 },
};