// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ROLES = [
  { key: 'admin', label: 'Admin', icon: '⚙️', gradient: ['#E63946', '#C0392B'], desc: 'System Administrator', color: '#E63946' },
  { key: 'teacher', label: 'Teacher', icon: '📚', gradient: ['#2A9D8F', '#1A6B64'], desc: 'Educator & Staff', color: '#2A9D8F' },
  { key: 'student', label: 'Student', icon: '🎓', gradient: ['#4361EE', '#2541C4'], desc: 'Enrolled Learner', color: '#4361EE' },
  { key: 'parent', label: 'Parent', icon: '👨‍👩‍👧', gradient: ['#7B2D8B', '#5A1F66'], desc: 'Guardian Access', color: '#7B2D8B' },
];

const ROLE_ROUTES = {
  admin: '/admin',
  teacher: '/teacher',
  student: '/student',
  parent: '/parent',
};

// ── Logo with fallback ────────────────────────────────────
function LogoImage({ size = 72 }) {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    return (
      <img
        src={`${process.env.PUBLIC_URL}/logo.jpg`}
        alt="Apex High School"
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          objectFit: 'cover',
          border: '3px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      background: 'linear-gradient(135deg,#F5A623,#FFC85A)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: 900,
      color: '#0D1B3E',
      boxShadow: '0 8px 32px rgba(245,166,35,0.4)',
      letterSpacing: -1,
    }}>
      AH
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeRole = ROLES.find(r => r.key === role);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!role) return setError('Please select your role first.');
    if (!email) return setError('Email address is required.');
    if (!password) return setError('Password is required.');

    setLoading(true);
    setError('');

    try {
      const profile = await signIn(email.trim(), password);
      if (!profile) {
        setError('Account not found. Please contact the administrator.');
        return;
      }
      if (profile.role !== role) {
        setError(`This account is not registered as a ${role}. Please select the correct role.`);
        return;
      }
      navigate(ROLE_ROUTES[profile.role]);
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Background */}
      <div style={s.bg} />
      <div style={s.overlay} />

      {/* Decorative circles */}
      <div style={s.circle1} />
      <div style={s.circle2} />
      <div style={s.circle3} />

      {/* Back to home */}
      <button
        onClick={() => navigate('/')}
        style={s.backBtn}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
      >
        ← Back to Home
      </button>

      {/* Login Card */}
      <div style={s.wrapper}>
        {/* Left Panel */}
        <div style={s.leftPanel}>
          <div style={s.leftContent}>
            <LogoImage size={80} />
            <h2 style={s.leftTitle}>Apex High School</h2>
            <p style={s.leftSubtitle}>Management System</p>

            <div style={s.divider}>
              <div style={s.dividerLine} />
              <span style={s.dividerText}>◆</span>
              <div style={s.dividerLine} />
            </div>

            <p style={s.leftDesc}>
              Your all-in-one platform for managing students, teachers,
              grades, attendance, fees and more.
            </p>

            {/* Role pills */}
            <div style={s.rolePills}>
              {ROLES.map(r => (
                <div key={r.key} style={{ ...s.rolePill, borderColor: r.color + '60' }}>
                  <span>{r.icon}</span>
                  <span style={{ color: r.color, fontWeight: 600, fontSize: 13 }}>{r.label}</span>
                </div>
              ))}
            </div>

            <div style={s.leftFooter}>
              <span>🔒</span>
              <span>Secured with Firebase Authentication</span>
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div style={s.rightPanel}>
          <div style={s.formWrap}>
            <h1 style={s.formTitle}>Welcome Back</h1>
            <p style={s.formSubtitle}>Sign in to access your portal</p>

            {/* Role Selector */}
            <div style={s.sectionLabel}>SELECT YOUR ROLE</div>
            <div style={s.rolesGrid}>
              {ROLES.map(r => (
                <button
                  key={r.key}
                  onClick={() => { setRole(r.key); setError(''); }}
                  style={{
                    ...s.roleBtn,
                    background: role === r.key
                      ? `linear-gradient(135deg, ${r.gradient[0]}, ${r.gradient[1]})`
                      : '#F8F9FD',
                    borderColor: role === r.key ? r.color : '#E8ECF4',
                    transform: role === r.key ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: role === r.key ? `0 8px 20px ${r.color}30` : 'none',
                  }}
                >
                  {role === r.key && (
                    <div style={s.roleCheck}>✓</div>
                  )}
                  <span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>
                    {r.icon}
                  </span>
                  <span style={{
                    fontWeight: 700, fontSize: 13,
                    color: role === r.key ? '#fff' : '#0D1B3E',
                  }}>
                    {r.label}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: role === r.key ? 'rgba(255,255,255,0.75)' : '#8896AB',
                    marginTop: 2, display: 'block',
                  }}>
                    {r.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleLogin}>
              {/* Role banner */}
              {activeRole ? (
                <div style={{
                  ...s.roleBanner,
                  background: `linear-gradient(135deg, ${activeRole.gradient[0]}, ${activeRole.gradient[1]})`,
                }}>
                  <span style={{ fontSize: 18 }}>{activeRole.icon}</span>
                  <span style={s.roleBannerText}>{activeRole.label} Login</span>
                  <div style={s.roleBannerBadge}>SECURE</div>
                </div>
              ) : (
                <div style={s.roleBannerEmpty}>
                  👆 Select a role above to continue
                </div>
              )}

              {/* Email */}
              <div style={s.inputGroup}>
                <label style={s.label}>EMAIL ADDRESS</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}>✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    style={s.input}
                    onFocus={e => {
                      e.target.style.borderColor = activeRole?.color || '#4361EE';
                      e.target.style.boxShadow = `0 0 0 3px ${activeRole?.color || '#4361EE'}18`;
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#E8ECF4';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={s.inputGroup}>
                <label style={s.label}>PASSWORD</label>
                <div style={s.inputWrap}>
                  <span style={s.inputIcon}>🔒</span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{ ...s.input, paddingRight: 50 }}
                    onFocus={e => {
                      e.target.style.borderColor = activeRole?.color || '#4361EE';
                      e.target.style.boxShadow = `0 0 0 3px ${activeRole?.color || '#4361EE'}18`;
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#E8ECF4';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={s.eyeBtn}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div style={s.forgotRow}>
                <button type="button" style={s.forgotBtn}>
                  Forgot Password?
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div style={s.errorBox}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !role}
                style={{
                  ...s.submitBtn,
                  background: activeRole
                    ? `linear-gradient(135deg, ${activeRole.gradient[0]}, ${activeRole.gradient[1]})`
                    : 'linear-gradient(135deg, #8896AB, #6B7A8D)',
                  opacity: loading ? 0.8 : 1,
                  cursor: loading || !role ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => {
                  if (!loading && role) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 12px 30px ${activeRole?.color || '#333'}40`;
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : role ? (
                  <span>Sign in as {activeRole?.label} →</span>
                ) : (
                  <span>Select a role to continue</span>
                )}
              </button>
            </form>

            <p style={s.footer}>
              © 2025 Apex High School · All rights reserved
            </p>
          </div>
        </div>
      </div>

      <style>{css}</style>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '20px',
    overflow: 'hidden',
  },

  bg: {
    position: 'fixed',
    inset: 0,
    background: `
      linear-gradient(to bottom, rgba(6,18,41,0.92) 0%, rgba(13,27,62,0.88) 100%),
      url(${process.env.PUBLIC_URL}/Background1.jpg)
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    zIndex: 0,
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(6,18,41,0.5), rgba(26,48,102,0.4))',
    zIndex: 0,
  },

  circle1: {
    position: 'fixed',
    width: 400, height: 400,
    borderRadius: '50%',
    background: 'rgba(245,166,35,0.05)',
    border: '1px solid rgba(245,166,35,0.1)',
    top: -100, right: -100,
    zIndex: 0,
  },
  circle2: {
    position: 'fixed',
    width: 300, height: 300,
    borderRadius: '50%',
    background: 'rgba(67,97,238,0.05)',
    border: '1px solid rgba(67,97,238,0.1)',
    bottom: -80, left: -80,
    zIndex: 0,
  },
  circle3: {
    position: 'fixed',
    width: 200, height: 200,
    borderRadius: '50%',
    background: 'rgba(42,157,143,0.05)',
    border: '1px solid rgba(42,157,143,0.08)',
    top: '40%', left: '30%',
    zIndex: 0,
  },

  backBtn: {
    position: 'fixed',
    top: 24, left: 24,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    padding: '8px 18px',
    borderRadius: 8,
    fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
    zIndex: 10,
    transition: 'all 0.2s',
  },

  wrapper: {
    display: 'flex',
    width: '100%',
    maxWidth: 1000,
    minHeight: 620,
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
    position: 'relative',
    zIndex: 2,
  },

  // Left panel
  leftPanel: {
    width: '38%',
    background: 'linear-gradient(160deg, #0D1B3E 0%, #1A3066 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 36px',
    position: 'relative',
    overflow: 'hidden',
  },

  leftContent: { position: 'relative', zIndex: 2, width: '100%' },

  schoolLogo: {
    fontSize: 52,
    width: 80, height: 80,
    background: 'linear-gradient(135deg, #F5A623, #FFC85A)',
    borderRadius: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    boxShadow: '0 8px 24px rgba(245,166,35,0.4)',
  },

  leftTitle: { color: '#fff', fontSize: 22, fontWeight: 900, marginBottom: 4, lineHeight: 1.2 },
  leftSubtitle: { color: '#F5A623', fontSize: 14, fontWeight: 600, marginBottom: 20, letterSpacing: 0.5 },

  divider: { display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' },
  dividerLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' },
  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: 10 },

  leftDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 },

  rolePills: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 },
  rolePill: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid',
    borderRadius: 8, padding: '8px 14px',
    fontSize: 14,
  },

  leftFooter: {
    display: 'flex', alignItems: 'center', gap: 8,
    color: 'rgba(255,255,255,0.4)', fontSize: 12,
  },

  // Right panel
  rightPanel: {
    flex: 1,
    background: '#fff',
    overflowY: 'auto',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  formWrap: {
    width: '100%',
    maxWidth: 480,
    padding: '44px 48px',
  },

  formTitle: { fontSize: 28, fontWeight: 900, color: '#0D1B3E', marginBottom: 6 },
  formSubtitle: { color: '#8896AB', fontSize: 15, marginBottom: 28 },

  sectionLabel: {
    fontSize: 11, fontWeight: 700,
    color: '#8896AB', letterSpacing: 2,
    marginBottom: 12,
  },

  rolesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10, marginBottom: 24,
  },

  roleBtn: {
    position: 'relative',
    border: '1.5px solid',
    borderRadius: 14, padding: '14px 10px',
    textAlign: 'center', cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontFamily: 'inherit',
  },

  roleCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: '50%',
    background: 'rgba(255,255,255,0.9)',
    color: '#0D1B3E', fontSize: 10, fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  roleBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px', borderRadius: '10px 10px 0 0',
    marginBottom: 0,
  },

  roleBannerText: { color: '#fff', fontWeight: 700, fontSize: 15, flex: 1 },
  roleBannerBadge: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff', fontSize: 10, fontWeight: 800,
    padding: '2px 8px', borderRadius: 20, letterSpacing: 1,
  },

  roleBannerEmpty: {
    background: '#F8F9FD',
    border: '1.5px solid #E8ECF4',
    borderRadius: 10, padding: '14px 16px',
    color: '#8896AB', fontSize: 14,
    textAlign: 'center', marginBottom: 16,
  },

  inputGroup: { marginBottom: 18 },
  label: {
    display: 'block', fontSize: 11,
    fontWeight: 700, color: '#8896AB',
    letterSpacing: 1.5, marginBottom: 8,
  },

  inputWrap: {
    position: 'relative',
    display: 'flex', alignItems: 'center',
  },

  inputIcon: {
    position: 'absolute', left: 14,
    fontSize: 16, pointerEvents: 'none',
    zIndex: 1,
  },

  input: {
    width: '100%',
    height: 50,
    padding: '0 16px 0 44px',
    border: '1.5px solid #E8ECF4',
    borderRadius: 10,
    fontSize: 15, color: '#0D1B3E',
    background: '#F8F9FD',
    transition: 'all 0.2s',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },

  eyeBtn: {
    position: 'absolute', right: 14,
    background: 'none', border: 'none',
    fontSize: 16, cursor: 'pointer',
    padding: 4, lineHeight: 1,
  },

  forgotRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: 16, marginTop: -8 },
  forgotBtn: {
    background: 'none', border: 'none',
    color: '#8896AB', fontSize: 13,
    cursor: 'pointer', fontFamily: 'inherit',
    padding: 0,
  },

  errorBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#FFF0F0',
    border: '1px solid #FECDD3',
    borderRadius: 10, padding: '12px 16px',
    color: '#E63946', fontSize: 14,
    marginBottom: 16,
  },

  submitBtn: {
    width: '100%', height: 52,
    border: 'none', borderRadius: 12,
    color: '#fff', fontSize: 16,
    fontWeight: 700, transition: 'all 0.3s',
    fontFamily: 'inherit',
  },

  footer: {
    textAlign: 'center',
    color: '#C0C8D8', fontSize: 12,
    marginTop: 24,
  },
};

const css = `
  @media (max-width: 768px) {
    .login-left { display: none !important; }
    .login-right { width: 100% !important; }
  }
`;