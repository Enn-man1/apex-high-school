// src/pages/parent/ParentDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, getDocs, query,
  orderBy, limit,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import { where } from 'firebase/firestore';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [childProfile, setChildProfile] = useState(null);
  const [grades, setGrades] = useState([]);
  const [fees, setFees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Child info comes from parent's profile ────────────────
  const child = {
    uid: profile?.childUid || '',
    name: profile?.childName || 'Child Name',
    className: profile?.childClass || '—',
    admissionNo: profile?.childAdmissionNo || '—',
    email: profile?.childEmail || '—',
  };

useEffect(() => {
  const load = async () => {
    if (!profile) { setLoading(false); return; }

    // Child info from parent profile
    const childName = profile.childName || '';
    const childUid  = profile.childUid  || '';

    if (!childName && !childUid) {
      setLoading(false);
      return;
    }

    try {
      const [gradeSnap, feeSnap, annSnap, attSnap] = await Promise.all([
        getDocs(collection(db, 'grades')),
        getDocs(collection(db, 'fees')),
        getDocs(query(
          collection(db, 'announcements'),
          orderBy('createdAt', 'desc'),
          limit(5)
        )),
        getDocs(query(
          collection(db, 'attendance'),
          orderBy('createdAt', 'desc'),
          limit(50)
        )),
      ]);

      // Match grades by child name OR uid
      const allGrades = gradeSnap.docs.map(d => ({ id:d.id, ...d.data() }));
      const myGrades  = allGrades.filter(g =>
        (childName && g.studentName?.trim().toLowerCase() === childName.trim().toLowerCase()) ||
        (childUid  && g.studentId === childUid)
      );
      setGrades(myGrades);

      // Match fees by child name
      const allFees = feeSnap.docs.map(d => ({ id:d.id, ...d.data() }));
      const myFees  = allFees.filter(f =>
        childName && f.studentName?.trim().toLowerCase() === childName.trim().toLowerCase()
      );
      setFees(myFees);

      setAnnouncements(annSnap.docs.map(d => ({ id:d.id, ...d.data() })));

      // Match attendance by child uid
      const myAtt = [];
      attSnap.docs.forEach(d => {
        const rec = d.data();
        // Try by uid first, then by name in records
        const sr = childUid
          ? rec.records?.[childUid]
          : Object.values(rec.records || {}).find(r =>
              r.studentName?.trim().toLowerCase() === childName.trim().toLowerCase()
            );
        if (sr) {
          myAtt.push({
            id:        d.id,
            date:      rec.date,
            dateLabel: rec.dateLabel || rec.date,
            className: rec.className,
            status:    sr.status || 'present',
            teacher:   rec.teacherName,
          });
        }
      });
      setAttendance(myAtt);
    } catch (e) {
      console.warn('Parent load error:', e);
    } finally {
      setLoading(false);
    }
  };

  load();
}, [profile]);

  // Computed from real data
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const totalAtt = attendance.length;
  const attRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0;

  const paidFees = fees.filter(f => f.status === 'paid');
  const pendingFees = fees.filter(f => f.status === 'pending');
  const totalPaid = paidFees.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalOwed = pendingFees.reduce((s, f) => s + Number(f.amount || 0), 0);


  const avgScore = grades.length
    ? Math.round(grades.reduce((s, g) => s + Number(g.score || 0), 0) / grades.length)
    : 0;

  const getGradeColor = (score) => score >= 80 ? '#27AE60' : score >= 70 ? '#4361EE' : score >= 60 ? '#20C997' : score >= 50 ? '#F5A623' : '#E63946';
  const getGradeLetter = (score) => score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';

  const QUICK = [
    { icon: '📊', label: "Child's Grades", color: '#7B2D8B', bg: '#F5F0FF', path: '/parent/grades' },
    { icon: '💰', label: 'Pay Fees', color: '#6F42C1', bg: '#EEF2FF', path: '/parent/fees' },
    { icon: '📅', label: 'Timetable', color: '#2A9D8F', bg: '#F0FAFA', path: '/parent/timetable' },
    { icon: '📢', label: 'Notices', color: '#E63946', bg: '#FFF0F0', path: '/parent/announcements' },
    { icon: '💬', label: 'Message School', color: '#F5A623', bg: '#FFFAF0', path: '/parent/messages' },
    { icon: '👤', label: 'My Profile', color: '#4361EE', bg: '#EEF2FF', path: '/parent/profile' },
  ];

  {/* No child linked warning */ }
  {
    !profile?.childUid && (
      <div style={{
        background: '#FFFAF0', border: '1.5px solid #F5A62340',
        borderRadius: 12, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        marginBottom: 24,
      }}>
        <span style={{ fontSize: 24 }}>⚠️</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F5A623' }}>
            No Student Linked
          </div>
          <div style={{ fontSize: 13, color: '#8896AB', marginTop: 2 }}>
            Your account is not linked to a student yet. Please contact the school administrator.
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout
      title="Parent Dashboard"
      subtitle={`Guardian of ${child.name}`}
    >

      {/* Fee alert */}
      {totalOwed > 0 && (
        <div
          style={s.feeAlert}
          onClick={() => navigate('/parent/fees')}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={s.feeAlertTitle}>Outstanding School Fees</div>
            <div style={s.feeAlertSub}>
              ₦{totalOwed.toLocaleString()} pending for {child.name}
            </div>
          </div>
          <span style={s.feeAlertBtn}>Pay Now →</span>
        </div>
      )}

      {/* Child Card */}
      <div style={s.childCard}>
        <div style={s.childAvatar}>
          {child.name.charAt(0)}
        </div>
        <div style={s.childInfo}>
          <div style={s.childName}>{child.name}</div>
          <div style={s.childMeta}>{child.className} · Adm: {child.admissionNo}</div>
          <div style={s.childBadges}>
            <div style={s.childBadge}>🏫 {child.className}</div>
            <div style={{
              ...s.childBadge,
              background: attRate >= 90 ? 'rgba(127,255,0,0.15)' : attRate >= 75 ? 'rgba(255,200,0,0.15)' : 'rgba(255,100,100,0.15)',
              color: attRate >= 90 ? '#7FFF00' : attRate >= 75 ? '#FFC85A' : '#FF6B6B',
            }}>
              ✅ {attRate}% Attendance ({totalAtt} sessions)
            </div>
            <div style={{ ...s.childBadge, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              📊 Avg: {avgScore}%
            </div>
            <div style={{ ...s.childBadge, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              🎫 {child.admissionNo}
            </div>
          </div>
        </div>
        <div style={s.childActions}>
          <button style={s.childActionBtn} onClick={() => navigate('/parent/grades')}>
            View Results
          </button>
          <button style={{ ...s.childActionBtn, ...s.childActionBtnOutline }} onClick={() => navigate('/parent/messages')}>
            Contact Teacher
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        {[
          {
            icon: '📊', label: 'Average Score',
            value: `${avgScore}%`,
            sub: avgScore > 0 ? `${grades.length} assessments` : 'No grades yet',
            color: getGradeColor(avgScore),
            bg: getGradeColor(avgScore) + '12',
          },
          {
            icon: '✅', label: 'Attendance Rate',
            value: `${attRate}%`,
            sub: `${presentCount} of ${totalAtt} sessions`,
            color: attRate >= 75 ? '#27AE60' : '#E63946',
            bg: attRate >= 75 ? '#F0FAF4' : '#FFF0F0',
          },
          {
            icon: '💰', label: 'Fees Paid',
            value: `₦${totalPaid.toLocaleString()}`,
            sub: `${paidFees.length} records`,
            color: '#27AE60', bg: '#F0FAF4',
          },
          {
            icon: '⏳', label: 'Outstanding',
            value: `₦${totalOwed.toLocaleString()}`,
            sub: `${pendingFees.length} pending`,
            color: totalOwed > 0 ? '#E63946' : '#27AE60',
            bg: totalOwed > 0 ? '#FFF0F0' : '#F0FAF4',
          },
        ].map((stat, i) => (
          <div key={i} style={s.statCard}
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

      {/* Bottom row */}
      <div style={s.midRow}>

        {/* Child's Grades */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>
              {child.name.split(' ')[0]}'s Recent Results
            </h3>
            <button style={s.viewBtn} onClick={() => navigate('/parent/grades')}>
              Full Report →
            </button>
          </div>

          {grades.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIcon}>📊</div>
              <div style={s.emptyText}>No grades available yet</div>
              <div style={{ fontSize: 12, color: '#C0C8D8', marginTop: 4 }}>
                Grades will appear once teachers upload results
              </div>
            </div>
          ) : (
            <div style={s.gradesTable}>
              <div style={s.gradesHeader}>
                <span style={{ flex: 2 }}>Subject</span>
                <span>Teacher</span>
                <span>Type</span>
                <span style={{ textAlign: 'right' }}>Score</span>
                <span style={{ textAlign: 'center' }}>Grade</span>
              </div>
              {grades.slice(0, 8).map((g, i) => {
                const color = getGradeColor(g.score);
                const letter = getGradeLetter(g.score);
                return (
                  <div
                    key={i}
                    style={{
                      ...s.gradesRow,
                      background: i % 2 === 0 ? '#fff' : '#F8F9FD',
                    }}
                  >
                    <span style={{ ...s.gradesSubject, flex: 2 }}>{g.subject}</span>
                    <span style={s.gradesMeta}>{g.teacherName || '—'}</span>
                    <span style={s.gradesMeta}>{g.examType || '—'}</span>
                    <span style={{ ...s.gradesScore, color, textAlign: 'right' }}>
                      {g.score}%
                    </span>
                    <span style={{ textAlign: 'center' }}>
                      <span style={{ ...s.gradesBadge, background: color + '18', color }}>
                        {letter}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fees + Announcements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Fee Summary */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h3 style={s.cardTitle}>Fee Summary</h3>
              <button style={s.viewBtn} onClick={() => navigate('/parent/fees')}>
                Manage →
              </button>
            </div>
            {fees.length === 0 ? (
              <div style={s.empty}>
                <div style={s.emptyIcon}>💰</div>
                <div style={s.emptyText}>No fee records found</div>
              </div>
            ) : (
              <div style={s.feeList}>
                {fees.slice(0, 3).map((f, i) => (
                  <div key={i} style={s.feeRow}>
                    <div style={s.feeLeft}>
                      <div style={s.feeType}>{f.feeType}</div>
                      <div style={s.feeTerm}>{f.term}</div>
                    </div>
                    <div style={s.feeRight}>
                      <div style={s.feeAmount}>₦{Number(f.amount).toLocaleString()}</div>
                      <div style={{
                        ...s.feeStatus,
                        background: f.status === 'paid' ? '#F0FAF4' : '#FFF0F0',
                        color: f.status === 'paid' ? '#27AE60' : '#E63946',
                      }}>
                        {f.status === 'paid' ? '✓ Paid' : '⏳ Due'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Announcements */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h3 style={s.cardTitle}>School Notices</h3>
              <button style={s.viewBtn} onClick={() => navigate('/parent/announcements')}>
                View All →
              </button>
            </div>
            {announcements.length === 0 ? (
              <div style={s.empty}>
                <div style={s.emptyIcon}>📢</div>
                <div style={s.emptyText}>No notices</div>
              </div>
            ) : (
              <div style={s.annList}>
                {announcements.slice(0, 2).map((ann, i) => {
                  const pc = { high: '#E63946', medium: '#F5A623', low: '#27AE60' }[ann.priority] || '#4361EE';
                  return (
                    <div key={i} style={s.annCard}>
                      <div style={{ ...s.annStrip, background: pc }} />
                      <div style={s.annBody}>
                        <div style={s.annTitle}>{ann.title}</div>
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
  feeAlertBtn: { color: '#E63946', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },

  childCard: {
    background: 'linear-gradient(135deg, #7B2D8B, #5A1F66)',
    borderRadius: 20, padding: '24px 28px',
    display: 'flex', alignItems: 'center', gap: 24,
    marginBottom: 24,
    boxShadow: '0 8px 30px rgba(123,45,139,0.3)',
  },
  childAvatar: {
    width: 72, height: 72, borderRadius: 20, flexShrink: 0,
    background: 'rgba(255,255,255,0.2)',
    border: '2px solid rgba(255,255,255,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 900, fontSize: 32,
  },
  childInfo: { flex: 1 },
  childName: { fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 },
  childMeta: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  childBadges: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  childBadge: { background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 },
  childActions: { display: 'flex', flexDirection: 'column', gap: 8 },
  childActionBtn: {
    background: '#fff', color: '#7B2D8B',
    border: 'none', padding: '10px 20px',
    borderRadius: 8, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },
  childActionBtnOutline: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
  },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 },
  statCard: {
    background: '#fff', borderRadius: 16, padding: 20,
    border: '1.5px solid #E8ECF4',
    boxShadow: '0 2px 12px rgba(13,27,62,0.08)',
    cursor: 'default', transition: 'all 0.3s',
  },
  statIcon: { width: 46, height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: 900, lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: 700, color: '#0D1B3E', marginBottom: 2 },
  statSub: { fontSize: 11, color: '#8896AB' },

  card: {
    background: '#fff', borderRadius: 16, padding: 24,
    border: '1px solid #E8ECF4',
    boxShadow: '0 2px 12px rgba(13,27,62,0.06)',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: 800, color: '#0D1B3E', margin: 0 },
  viewBtn: { background: 'none', border: 'none', color: '#7B2D8B', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 },

  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 },
  quickBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: '16px 8px', borderRadius: 12,
    border: '1.5px solid #E8ECF4', background: '#fff',
    cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
  },
  quickIcon: { width: 46, height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: 700, textAlign: 'center' },

  midRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 },

  gradesTable: { borderRadius: 10, overflow: 'hidden', border: '1px solid #E8ECF4' },
  gradesHeader: {
    display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr',
    padding: '10px 16px', background: '#0D1B3E',
    color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  gradesRow: {
    display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 0.8fr',
    padding: '12px 16px', alignItems: 'center',
    borderBottom: '1px solid #F0F3FA',
  },
  gradesSubject: { fontSize: 13, fontWeight: 700, color: '#0D1B3E' },
  gradesMeta: { fontSize: 12, color: '#8896AB' },
  gradesScore: { fontSize: 14, fontWeight: 900 },
  gradesBadge: { fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 6, display: 'inline-block' },

  feeList: { display: 'flex', flexDirection: 'column', gap: 0 },
  feeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F0F3FA' },
  feeLeft: {},
  feeRight: { alignItems: 'flex-end', display: 'flex', flexDirection: 'column', gap: 4 },
  feeType: { fontSize: 13, fontWeight: 700, color: '#0D1B3E' },
  feeTerm: { fontSize: 12, color: '#8896AB', marginTop: 2 },
  feeAmount: { fontSize: 15, fontWeight: 900, color: '#0D1B3E' },
  feeStatus: { fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20 },

  annList: { display: 'flex', flexDirection: 'column', gap: 10 },
  annCard: { display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid #E8ECF4' },
  annStrip: { width: 4, flexShrink: 0 },
  annBody: { flex: 1, padding: '12px 14px' },
  annTitle: { fontSize: 13, fontWeight: 700, color: '#0D1B3E', marginBottom: 4 },
  annText: { fontSize: 12, color: '#4A5568', lineHeight: 1.5, marginBottom: 4 },
  annMeta: { fontSize: 11, color: '#8896AB' },

  empty: { textAlign: 'center', padding: '24px 20px' },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { color: '#8896AB', fontSize: 13 },
};