// src/components/Layout.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';



const ROLE_CONFIG = {
  admin: {
    color:    '#E63946',
    gradient: 'linear-gradient(180deg, #0D1B3E 0%, #1A3066 100%)',
    accent:   '#E63946',
    nav: [
      { icon: '🏠', label: 'Dashboard',     path: '/admin' },
      { icon: '🎓', label: 'Students',      path: '/admin/students' },
      { icon: '📚', label: 'Teachers',      path: '/admin/teachers' },
      { icon: '🏫', label: 'Classes',       path: '/admin/classes' },
      { icon: '📊', label: 'Reports',       path: '/admin/reports' },
      { icon: '📢', label: 'Announcements', path: '/admin/announcements' },
      { icon: '💰', label: 'Fees',          path: '/admin/fees' },
      { icon: '💬', label: 'Messages',      path: '/admin/messages' },
      { icon: '👤', label: 'Profile',       path: '/admin/profile' },
    ],
  },
  teacher: {
    color:    '#2A9D8F',
    gradient: 'linear-gradient(180deg, #0D2B29 0%, #1A4A45 100%)',
    accent:   '#2A9D8F',
    nav: [
      { icon: '🏠', label: 'Dashboard',     path: '/teacher' },
      { icon: '✅', label: 'Attendance',    path: '/teacher/attendance' },
      { icon: '📊', label: 'Grades',        path: '/teacher/grades' },
      { icon: '📝', label: 'Assignments',   path: '/teacher/assignments' },
      { icon: '📅', label: 'Timetable',     path: '/teacher/timetable' },
      { icon: '📢', label: 'Announcements', path: '/teacher/announcements' },
      { icon: '💬', label: 'Messages',      path: '/teacher/messages' },
      { icon: '👤', label: 'Profile',       path: '/teacher/profile' },
    ],
  },
  student: {
    color:    '#4361EE',
    gradient: 'linear-gradient(180deg, #0D1B3E 0%, #1A2E6B 100%)',
    accent:   '#4361EE',
    nav: [
      { icon: '🏠', label: 'Dashboard',   path: '/student' },
      { icon: '📊', label: 'My Results',  path: '/student/grades' },
      { icon: '✅', label: 'Attendance',  path: '/student/attendance' },
      { icon: '📝', label: 'Assignments', path: '/student/assignments' },
      { icon: '📅', label: 'Timetable',   path: '/student/timetable' },
      { icon: '💰', label: 'Fees',        path: '/student/fees' },
      { icon: '💬', label: 'Messages',    path: '/student/messages' },
      { icon: '👤', label: 'Profile',     path: '/student/profile' },
    ],
  },
  parent: {
    color:    '#7B2D8B',
    gradient: 'linear-gradient(180deg, #1A0A1E 0%, #2D1040 100%)',
    accent:   '#7B2D8B',
    nav: [
      { icon: '🏠', label: 'Dashboard',     path: '/parent' },
      { icon: '📊', label: "Child's Grades", path: '/parent/grades' },
      { icon: '💰', label: 'Fees',           path: '/parent/fees' },
      { icon: '📅', label: 'Timetable',      path: '/parent/timetable' },
      { icon: '📢', label: 'Announcements',  path: '/parent/announcements' },
      { icon: '💬', label: 'Messages',       path: '/parent/messages' },
      { icon: '👤', label: 'Profile',        path: '/parent/profile' },
    ],
  },
};

function LogoImage({ size = 36, radius = 10 }) {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    return (
      <img
        src={`${process.env.PUBLIC_URL}/logo.jpg`}
        alt="Apex High School"
        width={size}
        height={size}
        style={{
          width:        size,
          height:       size,
          borderRadius: radius,
          objectFit:    'cover',
          flexShrink:   0,
        }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div style={{
      width:          size,
      height:         size,
      borderRadius:   radius,
      background:     'linear-gradient(135deg,#F5A623,#FFC85A)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontSize:       size * 0.38,
      fontWeight:     900,
      color:          '#0D1B3E',
      flexShrink:     0,
    }}>
      AH
    </div>
  );
}

export default function Layout({ children, title, subtitle }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { profile, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const role   = profile?.role || 'student';
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={s.app}>


      {/* ── Sidebar ── */}
      <aside style={{
        ...s.sidebar,
        background: config.gradient,
        width: sidebarOpen ? 260 : 72,
      }}>

        {/* Logo */}
        <div style={s.logoWrap}>
         <LogoImage size={36} radius={10} />
          {sidebarOpen && (
            <div style={s.logoText}>
              <div style={s.logoSchool}>Apex High</div>
              <div style={{ ...s.logoRole, color: config.accent }}>
                {config.nav[0]?.label === 'Dashboard' ? `${role.charAt(0).toUpperCase() + role.slice(1)} Portal` : 'Portal'}
              </div>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          style={{ ...s.toggleBtn, background: config.accent }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>

        {/* Navigation */}
        <nav style={s.nav}>
          {config.nav.map((item, i) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={i}
                onClick={() => navigate(item.path)}
                style={{
                  ...s.navItem,
                  background:    active ? `${config.accent}22` : 'transparent',
                  borderLeft:    active ? `3px solid ${config.accent}` : '3px solid transparent',
                  color:         active ? config.accent : 'rgba(255,255,255,0.65)',
                  justifyContent:sidebarOpen ? 'flex-start' : 'center',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                  }
                }}
              >
                <span style={s.navIcon}>{item.icon}</span>
                {sidebarOpen && <span style={s.navLabel}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User info */}
        {sidebarOpen && (
          <div style={s.userCard}>
            <div style={{ ...s.userAvatar, background: config.accent }}>
              {profile?.name?.charAt(0) || '?'}
            </div>
            <div style={s.userInfo}>
              <div style={s.userName}>{profile?.name || 'User'}</div>
              <div style={{ ...s.userRole, color: config.accent }}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </div>
            </div>
          </div>
        )}

        {/* Sign out */}
        <div style={s.sidebarBottom}>
          <button
            style={{
              ...s.signOutBtn,
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
            }}
            onClick={handleSignOut}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>⏻</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ ...s.main, marginLeft: sidebarOpen ? 260 : 72 }}>

        {/* Top bar */}
        <header style={s.topBar}>
          <div>
            <h1 style={s.pageTitle}>{title || 'Dashboard'}</h1>
            {subtitle && <p style={s.pageSub}>{subtitle}</p>}
          </div>
          <div style={s.topBarRight}>
            <div style={s.topDate}>
              📅 {new Date().toLocaleDateString('en-NG', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </div>
            <div style={s.topAvatar}>
              <div style={{ ...s.topAvatarImg, background: config.accent }}>
                {profile?.name?.charAt(0) || '?'}
              </div>
              <div>
                <div style={s.topName}>{profile?.name || 'User'}</div>
                <div style={s.topRole}>{role.charAt(0).toUpperCase() + role.slice(1)}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={s.content}>
          {children}
        </div>
      </main>

      <style>{css}</style>
    </div>
  );
}

const s = {
  app: {
    display: 'flex', minHeight: '100vh',
    background: '#F8F9FD',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    position: 'fixed', top: 0, left: 0, bottom: 0,
    display: 'flex', flexDirection: 'column',
    zIndex: 100, overflow: 'hidden',
    transition: 'width 0.3s ease',
    boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '24px 16px', minHeight: 80,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  logoIcon: {
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    background: 'linear-gradient(135deg, #F5A623, #FFC85A)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20,
  },
  logoText:   { overflow: 'hidden', whiteSpace: 'nowrap' },
  logoSchool: { color: '#fff', fontWeight: 800, fontSize: 14 },
  logoRole:   { fontSize: 11, fontWeight: 600, marginTop: 2 },

  toggleBtn: {
    position: 'absolute', top: 28, right: -12,
    width: 24, height: 24, borderRadius: '50%',
    border: 'none', color: '#fff',
    fontSize: 10, fontWeight: 900,
    cursor: 'pointer', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  nav: { flex: 1, padding: '16px 8px', overflowY: 'auto', overflowX: 'hidden' },

  navItem: {
    width: '100%', display: 'flex', alignItems: 'center',
    gap: 12, padding: '11px 16px', borderRadius: 10,
    border: 'none', cursor: 'pointer',
    transition: 'all 0.2s', marginBottom: 2,
    whiteSpace: 'nowrap', overflow: 'hidden',
    fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
    textAlign: 'left',
  },
  navIcon:  { fontSize: 18, flexShrink: 0, width: 22, textAlign: 'center' },
  navLabel: { overflow: 'hidden', textOverflow: 'ellipsis' },

  userCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    margin: '8px', padding: '12px 16px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
  },
  userAvatar: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 16,
  },
  userInfo: { overflow: 'hidden' },
  userName: { color: '#fff', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: 11, fontWeight: 600, marginTop: 2 },

  sidebarBottom: { padding: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' },
  signOutBtn: {
    width: '100%', display: 'flex', alignItems: 'center',
    gap: 12, padding: '10px 16px', borderRadius: 10,
    border: 'none', cursor: 'pointer',
    color: '#FF6B6B', background: 'transparent',
    fontSize: 14, fontWeight: 600,
    transition: 'all 0.2s', fontFamily: 'inherit',
  },

  main: {
    flex: 1, display: 'flex', flexDirection: 'column',
    minHeight: '100vh', transition: 'margin-left 0.3s ease',
  },

  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 32px', background: '#fff',
    borderBottom: '1px solid #E8ECF4',
    position: 'sticky', top: 0, zIndex: 50,
    boxShadow: '0 2px 8px rgba(13,27,62,0.06)',
  },
  pageTitle: { fontSize: 22, fontWeight: 900, color: '#0D1B3E', margin: 0 },
  pageSub:   { fontSize: 13, color: '#8896AB', margin: '4px 0 0' },

  topBarRight: { display: 'flex', alignItems: 'center', gap: 20 },
  topDate: {
    background: '#F8F9FD', border: '1px solid #E8ECF4',
    padding: '7px 14px', borderRadius: 8,
    fontSize: 13, color: '#4A5568', fontWeight: 500,
  },
  topAvatar:    { display: 'flex', alignItems: 'center', gap: 10 },
  topAvatarImg: {
    width: 38, height: 38, borderRadius: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 16,
  },
  topName: { fontSize: 14, fontWeight: 700, color: '#0D1B3E' },
  topRole: { fontSize: 12, color: '#8896AB' },

  content: { padding: '28px 32px', flex: 1 },
};

const css = `
  @media (max-width: 768px) {
    aside { width: 72px !important; }
    main  { margin-left: 72px !important; }
  }
`;