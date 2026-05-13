// src/pages/teacher/TeacherDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, getDocs, query,
  orderBy, limit, where,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';

const TODAY_SCHEDULE = [
  { time: '08:00', subject: 'Mathematics',   class: 'Grade 10A', room: 'Room 12' },
  { time: '09:40', subject: 'Mathematics',   class: 'Grade 11B', room: 'Room 12' },
  { time: '11:40', subject: 'Further Maths', class: 'Grade 12C', room: 'Lab 2'  },
  { time: '14:00', subject: 'Mathematics',   class: 'Grade 10B', room: 'Room 12' },
];

const SUBJECT_ICONS = {
  'Mathematics':'🔢','English Language':'📖','Biology':'🧬',
  'Chemistry':'⚗️','Physics':'⚡','History':'📜',
  'Geography':'🌍','Economics':'📈','Further Maths':'📐',
};

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [students,      setStudents]      = useState([]);
  const [grades,        setGrades]        = useState([]);
  const [assignments,   setAssignments]   = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendance,    setAttendance]    = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [studSnap, gradeSnap, assignSnap, annSnap, attSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(query(collection(db,'grades'), where('teacherId','==', profile?.uid || ''), orderBy('createdAt','desc'), limit(10))),
          getDocs(query(collection(db,'assignments'), where('teacherId','==', profile?.uid || ''), orderBy('createdAt','desc'), limit(5))),
          getDocs(query(collection(db,'announcements'), orderBy('createdAt','desc'), limit(3))),
          getDocs(query(collection(db,'attendance'), where('teacherId','==', profile?.uid || ''), orderBy('createdAt','desc'), limit(5))),
        ]);
        setStudents(studSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setGrades(gradeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setAssignments(assignSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setAnnouncements(annSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setAttendance(attSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    };
    if (profile?.uid) load();
  }, [profile]);

  const now         = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const activeClass = TODAY_SCHEDULE.find(s => {
    const [h, m] = s.time.split(':').map(Number);
    const start  = h * 60 + m;
    return currentMins >= start && currentMins < start + 100;
  });

  const avgGrade = grades.length
    ? Math.round(grades.reduce((s, g) => s + Number(g.score || 0), 0) / grades.length)
    : 0;

  const QUICK = [
    { icon: '✅', label: 'Mark Attendance', color: '#27AE60', bg: '#F0FAF4', path: '/teacher/attendance' },
    { icon: '📊', label: 'Enter Grades',    color: '#4361EE', bg: '#EEF2FF', path: '/teacher/grades' },
    { icon: '📝', label: 'Assignments',     color: '#F5A623', bg: '#FFFAF0', path: '/teacher/assignments' },
    { icon: '📅', label: 'Timetable',       color: '#2A9D8F', bg: '#F0FAFA', path: '/teacher/timetable' },
    { icon: '📢', label: 'Announce',        color: '#E63946', bg: '#FFF0F0', path: '/teacher/announcements' },
    { icon: '💬', label: 'Messages',        color: '#6F42C1', bg: '#F5F0FF', path: '/teacher/messages' },
  ];

  return (
    <Layout
      title="Teacher Dashboard"
      subtitle={profile?.subject ? `${profile.subject} Teacher` : 'Subject Teacher'}
    >

      {/* Active class banner */}
      {activeClass && (
        <div style={s.activeBanner}>
          <div style={s.activeDot} />
          <div style={{ flex: 1 }}>
            <div style={s.activeTitle}>Current Class</div>
            <div style={s.activeSub}>
              {activeClass.subject} — {activeClass.class} · {activeClass.room}
            </div>
          </div>
          <div style={s.activeBadge}>LIVE NOW</div>
        </div>
      )}

      {/* Stats */}
      <div style={s.statsRow}>
        {[
          { icon: '🎓', label: 'My Students',    value: students.length,    sub: 'Across all classes', color: '#4361EE', bg: '#EEF2FF', path: '/teacher/grades' },
          { icon: '📊', label: 'Grades Entered', value: grades.length,      sub: 'This term',          color: '#2A9D8F', bg: '#F0FAFA', path: '/teacher/grades' },
          { icon: '📝', label: 'Assignments',    value: assignments.length, sub: 'Posted',             color: '#F5A623', bg: '#FFFAF0', path: '/teacher/assignments' },
          { icon: '✅', label: 'Avg Grade',      value: `${avgGrade}%`,     sub: 'Class average',      color: '#27AE60', bg: '#F0FAF4', path: '/teacher/grades' },
        ].map((stat, i) => (
          <div
            key={i}
            style={s.statCard}
            onClick={() => navigate(stat.path)}
            onMouseEnter={e => {
              e.currentTarget.style.transform   = 'translateY(-4px)';
              e.currentTarget.style.boxShadow   = `0 12px 30px ${stat.color}20`;
              e.currentTarget.style.borderColor = stat.color;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform   = 'translateY(0)';
              e.currentTarget.style.boxShadow   = '0 2px 12px rgba(13,27,62,0.08)';
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
          <h3 style={s.cardTitle}>Quick Actions</h3>
        </div>
        <div style={s.quickGrid}>
          {QUICK.map((q, i) => (
            <button
              key={i}
              onClick={() => navigate(q.path)}
              style={s.quickBtn}
              onMouseEnter={e => {
                e.currentTarget.style.background  = q.bg;
                e.currentTarget.style.borderColor = q.color;
                e.currentTarget.style.transform   = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = '#fff';
                e.currentTarget.style.borderColor = '#E8ECF4';
                e.currentTarget.style.transform   = 'translateY(0)';
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

        {/* Today's Schedule */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Today's Schedule</h3>
            <button style={s.viewBtn} onClick={() => navigate('/teacher/timetable')}>
              Full Timetable →
            </button>
          </div>
          <div style={s.scheduleList}>
            {TODAY_SCHEDULE.map((cls, i) => {
              const [h, m]  = cls.time.split(':').map(Number);
              const start   = h * 60 + m;
              const isNow   = currentMins >= start && currentMins < start + 100;
              const isPast  = currentMins >= start + 100;
              return (
                <div key={i} style={{
                  ...s.scheduleRow,
                  background: isNow  ? '#F0F3FF' : '#fff',
                  opacity:    isPast ? 0.5 : 1,
                  border:     isNow  ? '1.5px solid #4361EE' : '1px solid #E8ECF4',
                }}>
                  <div style={s.scheduleTime}>{cls.time}</div>
                  <div style={{ ...s.scheduleAccent, background: isNow ? '#4361EE' : '#E8ECF4' }} />
                  <div style={s.scheduleInfo}>
                    <div style={s.scheduleSubject}>{cls.subject}</div>
                    <div style={s.scheduleMeta}>{cls.class} · {cls.room}</div>
                  </div>
                  {isNow && <div style={s.liveBadge}>LIVE</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Grades */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Recent Grades Entered</h3>
            <button style={s.viewBtn} onClick={() => navigate('/teacher/grades')}>
              Manage →
            </button>
          </div>
          {grades.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>📊</div>
              <div style={s.emptyText}>No grades entered yet</div>
              <button
                style={s.emptyAction}
                onClick={() => navigate('/teacher/grades')}
              >
                Enter Grades
              </button>
            </div>
          ) : (
            <div style={s.gradeList}>
              {grades.slice(0, 6).map((g, i) => {
                const color = g.score >= 80 ? '#27AE60' : g.score >= 70 ? '#4361EE' : g.score >= 60 ? '#20C997' : g.score >= 50 ? '#F5A623' : '#E63946';
                const letter = g.score >= 80 ? 'A' : g.score >= 70 ? 'B' : g.score >= 60 ? 'C' : g.score >= 50 ? 'D' : 'F';
                return (
                  <div key={i} style={s.gradeRow}>
                    <div style={{ ...s.gradeIcon, background: color + '15' }}>
                      <span style={{ fontSize: 16 }}>{SUBJECT_ICONS[g.subject] || '📚'}</span>
                    </div>
                    <div style={s.gradeInfo}>
                      <div style={s.gradeStudent}>{g.studentName || '—'}</div>
                      <div style={s.gradeMeta}>{g.subject} · {g.examType} · {g.className}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ ...s.gradeScore, color }}>{g.score}%</div>
                      <div style={{ ...s.gradeLetter, background: color + '18', color }}>{letter}</div>
                    </div>
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
            <h3 style={s.cardTitle}>My Assignments</h3>
            <button style={s.viewBtn} onClick={() => navigate('/teacher/assignments')}>
              Manage →
            </button>
          </div>
          {assignments.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>📝</div>
              <div style={s.emptyText}>No assignments posted yet</div>
              <button
                style={s.emptyAction}
                onClick={() => navigate('/teacher/assignments')}
              >
                Post Assignment
              </button>
            </div>
          ) : (
            <div style={s.assignList}>
              {assignments.map((a, i) => (
                <div key={i} style={s.assignRow}>
                  <span style={{ fontSize: 22 }}>{SUBJECT_ICONS[a.subject] || '📚'}</span>
                  <div style={s.assignInfo}>
                    <div style={s.assignTitle}>{a.title}</div>
                    <div style={s.assignMeta}>{a.subject} · {a.className} · Due: {a.dueDate || 'N/A'}</div>
                  </div>
                  <div style={s.assignMarks}>{a.totalMarks || 100} marks</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Announcements</h3>
            <button style={s.viewBtn} onClick={() => navigate('/teacher/announcements')}>
              View All →
            </button>
          </div>
          {announcements.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>📢</div>
              <div style={s.emptyText}>No announcements</div>
            </div>
          ) : (
            <div style={s.annList}>
              {announcements.map((ann, i) => {
                const pc = { high:'#E63946', medium:'#F5A623', low:'#27AE60' }[ann.priority] || '#4361EE';
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
                      <div style={s.annMeta}>{ann.author} · {ann.dateLabel || 'Recent'}</div>
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
  activeBanner: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'linear-gradient(135deg, #4361EE, #2541C4)',
    borderRadius: 12, padding: '14px 20px',
    marginBottom: 24,
  },
  activeDot:   { width: 10, height: 10, borderRadius: '50%', background: '#7FFF00', boxShadow: '0 0 8px #7FFF00', flexShrink: 0 },
  activeTitle: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase' },
  activeSub:   { fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 2 },
  activeBadge: { background: '#7FFF00', color: '#0D1B3E', fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: 1 },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 },
  statCard: {
    background: '#fff', borderRadius: 16, padding: 20,
    border: '1.5px solid #E8ECF4',
    boxShadow: '0 2px 12px rgba(13,27,62,0.08)',
    cursor: 'pointer', transition: 'all 0.3s',
  },
  statIcon:  { width: 46, height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: 900, lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: 700, color: '#0D1B3E', marginBottom: 2 },
  statSub:   { fontSize: 11, color: '#8896AB' },

  card: {
    background: '#fff', borderRadius: 16, padding: 24,
    border: '1px solid #E8ECF4',
    boxShadow: '0 2px 12px rgba(13,27,62,0.06)',
    marginBottom: 24,
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle:  { fontSize: 16, fontWeight: 800, color: '#0D1B3E', margin: 0 },
  viewBtn:    { background: 'none', border: 'none', color: '#2A9D8F', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 },

  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 },
  quickBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '16px 8px', borderRadius: 12,
    border: '1.5px solid #E8ECF4', background: '#fff',
    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
  },
  quickIcon:  { width: 46, height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: 700, textAlign: 'center' },

  midRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 0 },

  scheduleList: { display: 'flex', flexDirection: 'column', gap: 8 },
  scheduleRow:  { display: 'flex', alignItems: 'center', borderRadius: 10, overflow: 'hidden', transition: 'all 0.2s' },
  scheduleTime: { width: 52, padding: '12px 8px', fontSize: 12, color: '#8896AB', fontWeight: 600, flexShrink: 0, textAlign: 'center' },
  scheduleAccent: { width: 3, alignSelf: 'stretch', flexShrink: 0 },
  scheduleInfo: { flex: 1, padding: '12px 12px' },
  scheduleSubject: { fontSize: 14, fontWeight: 700, color: '#0D1B3E' },
  scheduleMeta: { fontSize: 12, color: '#8896AB', marginTop: 2 },
  liveBadge:    { background: '#27AE60', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, marginRight: 8, letterSpacing: 0.5 },

  gradeList: { display: 'flex', flexDirection: 'column', gap: 10 },
  gradeRow:  { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #F0F3FA' },
  gradeIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  gradeInfo: { flex: 1, minWidth: 0 },
  gradeStudent: { fontSize: 13, fontWeight: 700, color: '#0D1B3E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  gradeMeta:    { fontSize: 11, color: '#8896AB', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  gradeScore:   { fontSize: 16, fontWeight: 900, lineHeight: 1 },
  gradeLetter:  { fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6, marginTop: 2, display: 'inline-block' },

  assignList: { display: 'flex', flexDirection: 'column', gap: 10 },
  assignRow:  { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #F0F3FA' },
  assignInfo: { flex: 1 },
  assignTitle:{ fontSize: 13, fontWeight: 700, color: '#0D1B3E' },
  assignMeta: { fontSize: 12, color: '#8896AB', marginTop: 2 },
  assignMarks:{ fontSize: 12, fontWeight: 700, color: '#4361EE', flexShrink: 0 },

  annList: { display: 'flex', flexDirection: 'column', gap: 10 },
  annCard: { display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid #E8ECF4' },
  annStrip:{ width: 4, flexShrink: 0 },
  annBody: { flex: 1, padding: '12px 14px' },
  annTop:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  annTitle:{ fontSize: 13, fontWeight: 700, color: '#0D1B3E' },
  annBadge:{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' },
  annText: { fontSize: 12, color: '#4A5568', lineHeight: 1.5, marginBottom: 4 },
  annMeta: { fontSize: 11, color: '#8896AB' },

  empty:       { textAlign: 'center', padding: '32px 20px' },
  emptyIcon:   { fontSize: 36, marginBottom: 8 },
  emptyText:   { color: '#8896AB', fontSize: 14, marginBottom: 12 },
  emptyAction: {
    background: '#2A9D8F', color: '#fff',
    border: 'none', padding: '8px 20px',
    borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit',
  },
};