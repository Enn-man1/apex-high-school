// src/pages/landing/Navbar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  {
    label: 'About',
    href: '#about',
    dropdown: [
      { icon: '🏫', label: 'Our School', desc: '27 years of excellence', href: '#about' },
      { icon: '🏆', label: 'Achievements', desc: 'Awards and recognition', href: '#about' },
      { icon: '👨‍🏫', label: 'Our Staff', desc: 'Meet our educators', href: '#about' },
    ],
  },
  {
    label: 'Academics',
    href: '#features',
    dropdown: [
      { icon: '📊', label: 'Grade Management', desc: 'Track student performance', href: '#features' },
      { icon: '✅', label: 'Attendance', desc: 'Daily attendance tracking', href: '#features' },
      { icon: '📝', label: 'Assignments', desc: 'Manage classwork and tasks', href: '#features' },
      { icon: '📅', label: 'Timetable', desc: 'Class schedule management', href: '#features' },
    ],
  },
  {
    label: 'Portals',
    href: '/login',
    external: true,
    dropdown: [
      { icon: '⚙️', label: 'Admin Portal', desc: 'Full school management', href: '/login', external: true },
      { icon: '📚', label: 'Teacher Portal', desc: 'Grades and attendance', href: '/login', external: true },
      { icon: '🎓', label: 'Student Portal', desc: 'Results and timetable', href: '/login', external: true },
      { icon: '👨‍👩‍👧', label: 'Parent Portal', desc: 'Monitor your child', href: '/login', external: true },
    ],
  },
  {
    label: 'Gallery',
    href: '/gallery',
    external: true,
    dropdown: [
      { icon: '📸', label: 'School Photos', desc: 'Events and activities', href: '/gallery', external: true },
      { icon: '🎭', label: 'Cultural Events', desc: 'Annual celebrations', href: '#features' },
      { icon: '⚽', label: 'Sports', desc: 'Inter-house competitions', href: '#features' },
    ],
  },
  {
    label: 'Contact',
    href: '#contact',
    dropdown: [
      { icon: '📞', label: 'Call Us', desc: '+234 800 123 4567', href: '#contact' },
      { icon: '✉️', label: 'Email', desc: 'info@apexhighschool.edu.ng', href: '#contact' },
      { icon: '📍', label: 'Visit Us', desc: '123 Education Lane, Abuja', href: '#contact' },
    ],
  },
];

// ── Reusable logo component with fallback ─────────────────
function LogoImage({ size = 42, radius = 12 }) {
  const [failed, setFailed] = useState(false);

  // Try to load logo from public folder
  // Place your logo at: public/logo.png
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
          border:       '2px solid rgba(255,255,255,0.15)',
        }}
        onError={() => setFailed(true)}
      />
    );
  }

  // Fallback — gradient box with school initials
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
      letterSpacing:  -1,
    }}>
      AH
    </div>
  );
}

export default function Navbar({ scrollY }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const scrolled = scrollY > 50;

  const handleNav = (item) => {
    if (item.external) {
      navigate(item.href);
    } else {
      const el = document.querySelector(item.href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav style={{
        ...s.nav,
        background: scrolled ? 'rgba(6,18,41,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}>
        <div style={s.inner}>

          {/* Logo */}
          <div style={s.logo} onClick={() => navigate('/')}>
            <LogoImage size={42} radius={12} />
            <div>
              <div style={s.logoText}>Apex High School</div>
              <div style={s.logoSub}>Management System</div>
            </div>
          </div>

          {/* Desktop nav links */}
          <div style={s.links}>
            {NAV_ITEMS.map((item, i) => (
              <div
                key={i}
                style={s.navItemWrap}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Nav link */}
                <button
                  style={{
                    ...s.navLink,
                    color: hovered === i ? '#F5A623' : 'rgba(255,255,255,0.85)',
                  }}
                  onClick={() => handleNav(item)}
                >
                  {item.label}
                  <span style={{
                    ...s.navArrow,
                    transform: hovered === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: hovered === i ? '#F5A623' : 'rgba(255,255,255,0.5)',
                  }}>
                    ▾
                  </span>
                </button>

                {/* Dropdown */}
                <div style={{
                  ...s.dropdown,
                  opacity: hovered === i ? 1 : 0,
                  visibility: hovered === i ? 'visible' : 'hidden',
                  transform: hovered === i ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
                  pointerEvents: hovered === i ? 'all' : 'none',
                }}>
                  {/* Dropdown arrow */}
                  <div style={s.dropdownArrow} />

                  {item.dropdown.map((d, j) => (
                    <button
                      key={j}
                      style={s.dropdownItem}
                      onClick={() => { handleNav(d); setHovered(null); }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,166,35,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={s.dropdownIcon}>{d.icon}</div>
                      <div style={s.dropdownText}>
                        <div style={s.dropdownLabel}>{d.label}</div>
                        <div style={s.dropdownDesc}>{d.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={s.cta}>
            <button
              style={s.loginBtn}
              onClick={() => navigate('/login')}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              Login
            </button>
            <button
              style={s.portalBtn}
              onClick={() => navigate('/login')}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Student Portal →
            </button>
          </div>

          {/* Hamburger */}
          <button
            style={s.hamburger}
            onClick={() => setOpen(!open)}
          >
            <div style={{ ...s.hamLine, transform: open ? 'rotate(45deg) translateY(6px)' : 'none' }} />
            <div style={{ ...s.hamLine, opacity: open ? 0 : 1, transform: open ? 'scaleX(0)' : 'scaleX(1)' }} />
            <div style={{ ...s.hamLine, transform: open ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div style={s.mobileMenu}>
            {NAV_ITEMS.map((item, i) => (
              <div key={i}>
                <div style={s.mobileSection}>{item.label}</div>
                {item.dropdown.map((d, j) => (
                  <button
                    key={j}
                    style={s.mobileItem}
                    onClick={() => { handleNav(d); setOpen(false); }}
                  >
                    <span style={{ fontSize: 18 }}>{d.icon}</span>
                    <div>
                      <div style={s.mobileItemLabel}>{d.label}</div>
                      <div style={s.mobileItemDesc}>{d.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
            <button
              style={s.mobilePortalBtn}
              onClick={() => navigate('/login')}
            >
              Login to Portal →
            </button>
          </div>
        )}
      </nav>

      <style>{css}</style>
    </>
  );
}

const s = {
  nav: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 1000,
    transition: 'all 0.4s ease',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 72,
    maxWidth: 1300,
    margin: '0 auto',
    padding: '0 32px',
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    flexShrink: 0,
  },
  logoIcon: {
    width: 42, height: 42,
    borderRadius: 12,
    background: 'linear-gradient(135deg,#F5A623,#FFC85A)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  logoText: { color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: '1.2' },
  logoSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },

  links: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },

  navItemWrap: {
    position: 'relative',
  },

  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: 500,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 14px',
    borderRadius: 8,
    transition: 'color 0.2s',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  navArrow: {
    fontSize: 10,
    transition: 'all 0.3s ease',
  },

  dropdown: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: 12,
    background: 'rgba(8,20,50,0.97)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: '8px',
    minWidth: 240,
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
    transition: 'all 0.25s ease',
    zIndex: 100,
  },
  dropdownArrow: {
    position: 'absolute',
    top: -7,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 14, height: 14,
    background: 'rgba(8,20,50,0.97)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRight: 'none',
    borderBottom: 'none',
    rotate: '45deg',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s',
    fontFamily: 'inherit',
  },
  dropdownIcon: {
    width: 36, height: 36,
    borderRadius: 10,
    background: 'rgba(245,166,35,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
  },
  dropdownText: {},
  dropdownLabel: { color: '#fff', fontSize: 14, fontWeight: 600 },
  dropdownDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },

  cta: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexShrink: 0,
  },
  loginBtn: {
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '8px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.2s',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  portalBtn: {
    background: 'linear-gradient(135deg,#F5A623,#FFC85A)',
    color: '#0D1B3E',
    border: 'none',
    padding: '8px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 800,
    transition: 'all 0.2s',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(245,166,35,0.3)',
  },

  hamburger: {
    display: 'none',
    flexDirection: 'column',
    gap: 5,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  hamLine: {
    width: 24, height: 2,
    background: '#fff',
    borderRadius: 2,
    transition: 'all 0.3s',
    display: 'block',
  },

  mobileMenu: {
    background: 'rgba(6,18,41,0.99)',
    padding: '16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  mobileSection: {
    fontSize: 11,
    fontWeight: 700,
    color: '#F5A623',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    padding: '12px 0 6px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 6,
  },
  mobileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  mobileItemLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600 },
  mobileItemDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  mobilePortalBtn: {
    width: '100%',
    marginTop: 16,
    padding: '14px',
    background: 'linear-gradient(135deg,#F5A623,#FFC85A)',
    color: '#0D1B3E',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

const css = `
  @keyframes float {
    0%, 100% { transform: translateY(0px);   }
    50%       { transform: translateY(-20px); }
  }
  @media (max-width: 900px) {
    .nav-links { display: none !important; }
    .nav-cta   { display: none !important; }
  }
`;