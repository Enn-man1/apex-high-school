// src/pages/admin/AdminDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, getDocs, query,
  orderBy, limit, onSnapshot,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import { color } from 'framer-motion';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const [stats,          setStats]          = useState({ students: 0, teachers: 0, classes: 0, pending: 0 });
  const [announcements,  setAnnouncements]  = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);

  // ── Load all data ─────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [studSnap, teachSnap, classSnap, feeSnap, attSnap, annSnap,
             gradeSnap, assignSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'teachers')),
        getDocs(collection(db, 'classes')),
        getDocs(collection(db, 'fees')),
        getDocs(query(collection(db, 'attendance'),    orderBy('createdAt', 'desc'), limit(4))),
        getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3))),
        getDocs(query(collection(db, 'grades'),        orderBy('createdAt', 'desc'), limit(5))),
        getDocs(query(collection(db, 'assignments'),   orderBy('createdAt', 'desc'), limit(3))),
      ]);

      const fees    = feeSnap.docs.map(d => d.data());
      const pending = fees.filter(f => f.status === 'pending').length;

      setStats({
        students: studSnap.size,
        teachers: teachSnap.size,
        classes:  classSnap.size,
        pending,
      });

      setAttendanceData(attSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAnnouncements(annSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Build activity feed
      const activities = [];

      studSnap.docs.slice(0, 3).forEach(d => {
        const data = d.data();
        activities.push({
          id:    d.id + '_s',
          icon:  '👤', type: 'Student',
          text:  `New student enrolled: ${data.name || '—'}`,
          sub:   data.className || '',
          color: '#4361EE',
          time:  data.createdAt,
        });
      });

      gradeSnap.docs.forEach(d => {
        const data = d.data();
        activities.push({
          id:    d.id + '_g',
          icon:  '📊', type: 'Grade',
          text:  `${data.examType || 'Grade'} uploaded — ${data.subject || ''}`,
          sub:   `${data.className || ''} · by ${data.teacherName || ''}`,
          color: '#2A9D8F',
          time:  data.createdAt,
        });
      });

      attSnap.docs.forEach(d => {
        const data = d.data();
        activities.push({
          id:    d.id + '_a',
          icon:  '✅', type: 'Attendance',
          text:  `Attendance marked — ${data.className || ''}`,
          sub:   `P:${data.totalPresent || 0} · A:${data.totalAbsent || 0} · L:${data.totalLate || 0}`,
          color: '#27AE60',
          time:  data.createdAt,
        });
      });

      annSnap.docs.forEach(d => {
        const data = d.data();
        activities.push({
          id:    d.id + '_ann',
          icon:  '📢', type: 'Announcement',
          text:  `Announcement: ${data.title || ''}`,
          sub:   `By ${data.author || 'Admin'} · To: ${data.audience || 'all'}`,
          color: '#E63946',
          time:  data.createdAt,
        });
      });

      assignSnap.docs.forEach(d => {
        const data = d.data();
        activities.push({
          id:    d.id + '_as',
          icon:  '📝', type: 'Assignment',
          text:  `Assignment posted: ${data.title || ''}`,
          sub:   `${data.subject || ''} · ${data.className || ''}`,
          color: '#F5A623',
          time:  data.createdAt,
        });
      });

      activities.sort((a, b) => (b.time?.seconds || 0) - (a.time?.seconds || 0));
      setRecentActivity(activities.slice(0, 10));
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleRefresh = () => { setRefreshing(true); loadAll(); };

  const formatTime = (ts) => {
    if (!ts?.seconds) return 'Just now';
    const diff = Date.now() / 1000 - ts.seconds;
    if (diff < 60)      return 'Just now';
    if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const QUICK_ACTIONS = [
    { icon: '👤', label: 'Add Student',   color: '#4361EE', bg: '#EEF2FF', path: '/admin/students' },
    { icon: '📚', label: 'Add Teacher',   color: '#2A9D8F', bg: '#F0FAFA', path: '/admin/teachers' },
    { icon: '📢', label: 'Announce',      color: '#E63946', bg: '#FFF0F0', path: '/admin/announcements' },
    { icon: '🏫', label: 'Classes',       color: '#20C997', bg: '#F0FAF6', path: '/admin/classes' },
    { icon: '💰', label: 'Fees',          color: '#6F42C1', bg: '#F5F0FF', path: '/admin/fees' },
    { icon: '📊', label: 'Reports',       color: '#F5A623', bg: '#FFFAF0', path: '/admin/reports' },
    { icon: '📅', label: 'Timetable',     color: '#DE5B99', bg: '#F1F0F6', path: '/admin/timetable' },
  ];

  const NAV_ITEMS = [
    { icon: '🏠', label: 'Dashboard',     path: '/admin' },
    { icon: '🎓', label: 'Students',      path: '/admin/students' },
    { icon: '📚', label: 'Teachers',      path: '/admin/teachers' },
    { icon: '🏫', label: 'Classes',       path: '/admin/classes' },
    { icon: '📊', label: 'Reports',       path: '/admin/reports' },
    { icon: '📢', label: 'Announcements', path: '/admin/announcements' },
    { icon: '💰', label: 'Fees',          path: '/admin/fees' },
    { icon: '💬', label: 'Messages',      path: '/admin/messages' },
    { icon: '👤', label: 'Profile',       path: '/admin/profile' },
    { icon: '📅', label: 'Timetable',     path: '/admin/timetable' },
  ];

  return (
    <div style={s.app}>

      {/* ── Sidebar ── */}
      <aside style={{ ...s.sidebar, width: sidebarOpen ? 260 : 72, transition: 'width 0.3s ease' }}>
        {/* Logo */}
        <div style={s.sidebarLogo}>
          <div style={s.sidebarLogoIcon}>🏫</div>
          {sidebarOpen && (
            <div style={s.sidebarLogoText}>
              <div style={s.sidebarSchoolName}>Apex High</div>
              <div style={s.sidebarSchoolSub}>Admin Portal</div>
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          style={s.sidebarToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>

        {/* Nav */}
        <nav style={s.sidebarNav}>
          {NAV_ITEMS.map((item, i) => {
            const active = window.location.pathname === item.path;
            return (
              <button
                key={i}
                onClick={() => navigate(item.path)}
                style={{
                  ...s.navItem,
                  background:  active ? 'rgba(245,166,35,0.15)' : 'transparent',
                  borderLeft:  active ? '3px solid #F5A623' : '3px solid transparent',
                  color:       active ? '#F5A623' : 'rgba(255,255,255,0.7)',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }
                }}
              >
                <span style={s.navIcon}>{item.icon}</span>
                {sidebarOpen && <span style={s.navLabel}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div style={s.sidebarFooter}>
          <button
            onClick={signOut}
            style={s.signOutBtn}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>⏻</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={s.main}>

        {/* Top Bar */}
        <header style={s.topBar}>
          <div style={s.topBarLeft}>
            <h1 style={s.pageTitle}>Dashboard</h1>
            <div style={s.breadcrumb}>Home / Dashboard</div>
          </div>
          <div style={s.topBarRight}>
            <button
              style={s.refreshBtn}
              onClick={handleRefresh}
              onMouseEnter={e => e.currentTarget.style.background = '#F0F3FA'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              {refreshing ? '⟳' : '🔄'} Refresh
            </button>
            <div style={s.adminInfo}>
              <div style={s.adminAvatar}>
                {profile?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <div style={s.adminName}>{profile?.name || 'Administrator'}</div>
                <div style={s.adminRole}>System Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div style={s.content}>

          {/* Greeting */}
          <div style={s.greetingSection}>
            <div>
              <h2 style={s.greeting}>{greeting}, {profile?.name?.split(' ')[0] || 'Admin'} 👋</h2>
              <p style={s.greetingSub}>Here's what's happening at Apex High School today.</p>
            </div>
            <div style={s.dateBadge}>
              📅 {new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Stats Cards */}
          {loading ? (
            <div style={s.loadingGrid}>
              {[1,2,3,4].map(i => <div key={i} style={s.skeletonCard} />)}
            </div>
          ) : (
            <div style={s.statsGrid}>
              {[
                { label: 'Total Students',  value: stats.students, icon: '🎓', color: '#4361EE', bg: '#EEF2FF', sub: 'Enrolled learners',     path: '/admin/students' },
                { label: 'Total Teachers',  value: stats.teachers, icon: '📚', color: '#2A9D8F', bg: '#F0FAFA', sub: 'Active educators',       path: '/admin/teachers' },
                { label: 'Active Classes',  value: stats.classes,  icon: '🏫', color: '#20C997', bg: '#F0FAF6', sub: 'Ongoing this term',      path: '/admin/classes'  },
                { label: 'Pending Fees',    value: stats.pending,  icon: '💰', color: '#E63946', bg: '#FFF0F0', sub: 'Awaiting payment',        path: '/admin/fees'     },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={s.statCard}
                  onClick={() => navigate(stat.path)}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 16px 40px ${stat.color}20`;
                    e.currentTarget.style.borderColor = stat.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(13,27,62,0.08)';
                    e.currentTarget.style.borderColor = '#E8ECF4';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ ...s.statIcon, background: stat.bg }}>
                      <span style={{ fontSize: 22 }}>{stat.icon}</span>
                    </div>
                    <span style={{ ...s.statTrend, color: stat.color }}>View →</span>
                  </div>
                  <div style={{ ...s.statValue, color: stat.color }}>{stat.value.toLocaleString()}</div>
                  <div style={s.statLabel}>{stat.label}</div>
                  <div style={s.statSub}>{stat.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Middle row */}
          <div style={s.midRow}>

            {/* Quick Actions */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Quick Actions</h3>
              </div>
              <div style={s.quickGrid}>
                {QUICK_ACTIONS.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(a.path)}
                    style={s.quickBtn}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = a.bg;
                      e.currentTarget.style.borderColor = a.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#E8ECF4';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ ...s.quickIcon, background: a.bg }}>
                      <span style={{ fontSize: 22 }}>{a.icon}</span>
                    </div>
                    <span style={{ ...s.quickLabel, color: a.color }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Attendance Overview */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Today's Attendance</h3>
                <button
                  style={s.viewAllBtn}
                  onClick={() => navigate('/admin/reports')}
                >
                  View Reports →
                </button>
              </div>
              {attendanceData.length === 0 ? (
                <div style={s.empty}>
                  <div style={s.emptyIcon}>✅</div>
                  <div style={s.emptyText}>No attendance records yet</div>
                </div>
              ) : (
                <div style={s.attendanceList}>
                  {attendanceData.map((att, i) => {
                    const total   = att.total || 1;
                    const present = att.totalPresent || 0;
                    const pct     = Math.round((present / total) * 100);
                    const color   = pct >= 90 ? '#27AE60' : pct >= 75 ? '#F5A623' : '#E63946';
                    return (
                      <div key={att.id} style={s.attRow}>
                        <div style={s.attLeft}>
                          <div style={s.attClass}>{att.className}</div>
                          <div style={s.attMeta}>{att.dateLabel || att.date}</div>
                        </div>
                        <div style={s.attBarWrap}>
                          <div style={s.attBarBg}>
                            <div style={{ ...s.attBarFill, width: `${pct}%`, background: color }} />
                          </div>
                          <span style={{ ...s.attPct, color }}>{pct}%</span>
                        </div>
                        <div style={s.attCount}>{present}/{total}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom row */}
          <div style={s.bottomRow}>

            {/* Announcements */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Recent Announcements</h3>
                <button
                  style={s.viewAllBtn}
                  onClick={() => navigate('/admin/announcements')}
                >
                  View All →
                </button>
              </div>
              {announcements.length === 0 ? (
                <div style={s.empty}>
                  <div style={s.emptyIcon}>📢</div>
                  <div style={s.emptyText}>No announcements yet</div>
                  <button
                    style={s.emptyAction}
                    onClick={() => navigate('/admin/announcements')}
                  >
                    Post Announcement
                  </button>
                </div>
              ) : (
                <div style={s.annList}>
                  {announcements.map((ann, i) => {
                    const pc = { high: '#E63946', medium: '#F5A623', low: '#27AE60' }[ann.priority] || '#4361EE';
                    return (
                      <div key={ann.id} style={s.annCard}>
                        <div style={{ ...s.annStrip, background: pc }} />
                        <div style={s.annBody}>
                          <div style={s.annTop}>
                            <div style={s.annTitle}>{ann.title}</div>
                            <div style={{ ...s.annPriority, background: pc + '18', color: pc }}>
                              {ann.priority || 'medium'}
                            </div>
                          </div>
                          <div style={s.annText}>{ann.body}</div>
                          <div style={s.annMeta}>
                            By {ann.author || 'Admin'} · {ann.dateLabel || 'Recent'} · {ann.audience || 'all'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Recent Activity</h3>
                <span style={s.liveBadge}>● LIVE</span>
              </div>
              {recentActivity.length === 0 ? (
                <div style={s.empty}>
                  <div style={s.emptyIcon}>📋</div>
                  <div style={s.emptyText}>No activity yet</div>
                </div>
              ) : (
                <div style={s.activityList}>
                  {recentActivity.map((act, i) => (
                    <div key={act.id || i} style={s.activityItem}>
                      <div style={{ ...s.actIcon, background: act.color + '18' }}>
                        <span style={{ fontSize: 16 }}>{act.icon}</span>
                      </div>
                      <div style={s.actBody}>
                        <div style={s.actText}>{act.text}</div>
                        {act.sub && <div style={s.actSub}>{act.sub}</div>}
                        <div style={s.actTime}>{formatTime(act.time)}</div>
                      </div>
                      <div style={{ ...s.actTypeBadge, background: act.color + '12', color: act.color }}>
                        {act.type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      <style>{css}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  app: {
    display: 'flex', minHeight: '100vh',
    background: '#F8F9FD', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  // Sidebar
  sidebar: {
    background: 'linear-gradient(180deg, #0D1B3E 0%, #1A3066 100%)',
    display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, left: 0, bottom: 0,
    zIndex: 100, overflow: 'hidden',
    boxShadow: '4px 0 24px rgba(13,27,62,0.2)',
  },

  sidebarLogo: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
    minHeight: 80,
  },
  sidebarLogoIcon: {
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    background: 'linear-gradient(135deg, #F5A623, #FFC85A)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20,
  },
  sidebarLogoText:   { overflow: 'hidden', whiteSpace: 'nowrap' },
  sidebarSchoolName: { color: '#fff', fontWeight: 800, fontSize: 14 },
  sidebarSchoolSub:  { color: 'rgba(255,255,255,0.5)', fontSize: 11 },

  sidebarToggle: {
    position: 'absolute', top: 28, right: -12,
    width: 24, height: 24, borderRadius: '50%',
    background: '#F5A623', border: 'none',
    color: '#0D1B3E', fontSize: 10, fontWeight: 900,
    cursor: 'pointer', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  sidebarNav: { flex: 1, padding: '16px 8px', overflowY: 'auto', overflowX: 'hidden' },

  navItem: {
    width: '100%', display: 'flex', alignItems: 'center',
    gap: 12, padding: '11px 16px', borderRadius: 10,
    border: 'none', cursor: 'pointer',
    transition: 'all 0.2s', marginBottom: 2,
    whiteSpace: 'nowrap', overflow: 'hidden',
    fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
  },
  navIcon:  { fontSize: 18, flexShrink: 0 },
  navLabel: { overflow: 'hidden', textOverflow: 'ellipsis' },

  sidebarFooter: {
    padding: '16px 8px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  signOutBtn: {
    width: '100%', display: 'flex', alignItems: 'center',
    gap: 12, padding: '10px 16px', borderRadius: 10,
    border: 'none', cursor: 'pointer',
    color: '#FF6B6B', background: 'transparent',
    fontSize: 14, fontWeight: 600,
    transition: 'all 0.2s', fontFamily: 'inherit',
    justifyContent: 'center',
  },

  // Main
  main: {
    flex: 1,
    marginLeft: 260,
    display: 'flex', flexDirection: 'column',
    minHeight: '100vh',
    transition: 'margin-left 0.3s ease',
  },

  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 32px',
    background: '#fff',
    borderBottom: '1px solid #E8ECF4',
    position: 'sticky', top: 0, zIndex: 50,
    boxShadow: '0 2px 8px rgba(13,27,62,0.06)',
  },
  topBarLeft:  {},
  pageTitle:   { fontSize: 22, fontWeight: 900, color: '#0D1B3E' },
  breadcrumb:  { fontSize: 13, color: '#8896AB', marginTop: 2 },
  topBarRight: { display: 'flex', alignItems: 'center', gap: 16 },

  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 16px', borderRadius: 8,
    border: '1px solid #E8ECF4', background: '#fff',
    color: '#4A5568', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.2s',
  },

  adminInfo:   { display: 'flex', alignItems: 'center', gap: 12 },
  adminAvatar: {
    width: 40, height: 40, borderRadius: 12,
    background: 'linear-gradient(135deg, #E63946, #C0392B)',
    color: '#fff', fontWeight: 800, fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  adminName: { fontSize: 14, fontWeight: 700, color: '#0D1B3E' },
  adminRole: { fontSize: 12, color: '#8896AB' },

  content: { padding: '28px 32px', flex: 1 },

  greetingSection: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 28,
    flexWrap: 'wrap', gap: 12,
  },
  greeting:    { fontSize: 26, fontWeight: 900, color: '#0D1B3E' },
  greetingSub: { color: '#8896AB', fontSize: 15, marginTop: 4 },
  dateBadge: {
    background: '#fff', border: '1px solid #E8ECF4',
    borderRadius: 10, padding: '8px 16px',
    color: '#4A5568', fontSize: 14, fontWeight: 500,
  },

  // Stats
  loadingGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 24 },
  skeletonCard: {
    height: 140, borderRadius: 16,
    background: 'linear-gradient(90deg, #F0F3FA 25%, #E8ECF4 50%, #F0F3FA 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },

  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
    gap: 20, marginBottom: 24,
  },
  statCard: {
    background: '#fff', borderRadius: 16, padding: '20px',
    border: '1.5px solid #E8ECF4',
    boxShadow: '0 2px 12px rgba(13,27,62,0.08)',
    cursor: 'pointer', transition: 'all 0.3s ease',
  },
  statIcon:  { width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statTrend: { fontSize: 13, fontWeight: 600 },
  statValue: { fontSize: 36, fontWeight: 900, lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: 14, fontWeight: 700, color: '#0D1B3E', marginBottom: 4 },
  statSub:   { fontSize: 12, color: '#8896AB' },

  // Cards
  midRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  bottomRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },

  card: {
    background: '#fff', borderRadius: 16, padding: 24,
    border: '1px solid #E8ECF4',
    boxShadow: '0 2px 12px rgba(13,27,62,0.06)',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  cardTitle:  { fontSize: 16, fontWeight: 800, color: '#0D1B3E' },
  viewAllBtn: {
    background: 'none', border: 'none',
    color: '#4361EE', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', padding: 0,
  },

  // Quick actions
  quickGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
    gap: 12,
  },
  quickBtn: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 8,
    padding: '16px 8px', borderRadius: 12,
    border: '1.5px solid #E8ECF4',
    background: '#fff', cursor: 'pointer',
    transition: 'all 0.2s', fontFamily: 'inherit',
  },
  quickIcon:  { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: 700, textAlign: 'center' },

  // Attendance
  attendanceList: { display: 'flex', flexDirection: 'column', gap: 14 },
  attRow:  { display: 'flex', alignItems: 'center', gap: 12 },
  attLeft: { width: 120, flexShrink: 0 },
  attClass:{ fontSize: 13, fontWeight: 700, color: '#0D1B3E' },
  attMeta: { fontSize: 11, color: '#8896AB', marginTop: 2 },
  attBarWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 8 },
  attBarBg:   { flex: 1, height: 8, background: '#F0F3FA', borderRadius: 4, overflow: 'hidden' },
  attBarFill: { height: 8, borderRadius: 4, transition: 'width 0.8s ease' },
  attPct:     { fontSize: 13, fontWeight: 700, width: 36, textAlign: 'right', flexShrink: 0 },
  attCount:   { fontSize: 12, color: '#8896AB', width: 40, textAlign: 'right', flexShrink: 0 },

  // Announcements
  annList: { display: 'flex', flexDirection: 'column', gap: 12 },
  annCard: {
    display: 'flex', borderRadius: 10,
    overflow: 'hidden', border: '1px solid #E8ECF4',
  },
  annStrip: { width: 4, flexShrink: 0 },
  annBody:  { flex: 1, padding: '12px 14px' },
  annTop:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  annTitle: { fontSize: 14, fontWeight: 700, color: '#0D1B3E' },
  annPriority: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' },
  annText:  { fontSize: 13, color: '#4A5568', lineHeight: 1.5, marginBottom: 6 },
  annMeta:  { fontSize: 11, color: '#8896AB' },

  // Activity
  activityList: { display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto' },
  activityItem: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  actIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actBody: { flex: 1, minWidth: 0 },
  actText: { fontSize: 13, fontWeight: 600, color: '#0D1B3E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  actSub:  { fontSize: 12, color: '#8896AB', marginTop: 2 },
  actTime: { fontSize: 11, color: '#C0C8D8', marginTop: 2 },
  actTypeBadge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0, textTransform: 'capitalize' },

  liveBadge: { fontSize: 11, fontWeight: 700, color: '#27AE60', letterSpacing: 1 },

  // Empty
  empty: { textAlign: 'center', padding: '32px 20px' },
  emptyIcon:   { fontSize: 40, marginBottom: 8 },
  emptyText:   { color: '#8896AB', fontSize: 14, marginBottom: 12 },
  emptyAction: {
    background: '#4361EE', color: '#fff',
    border: 'none', padding: '8px 20px',
    borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

const css = `
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @media (max-width: 1024px) {
    .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
    .mid-row    { grid-template-columns: 1fr !important; }
    .bottom-row { grid-template-columns: 1fr !important; }
  }
`;