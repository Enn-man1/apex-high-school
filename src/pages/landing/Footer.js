import React from 'react';
import { useNavigate } from 'react-router-dom';
// Importing professional icons
import { 
  FaFacebookF, 
  FaTwitter, 
  FaInstagram, 
  FaYoutube, 
  FaLinkedinIn 
} from 'react-icons/fa';

export default function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const portals = [
    { label: 'Admin Portal', path: '/login' },
    { label: 'Teacher Portal', path: '/login' },
    { label: 'Student Portal', path: '/login' },
    { label: 'Parent Portal', path: '/login' },
  ];

  const quickLinks = ['About', 'Features', 'Contact'];

  // Array of social media objects with icons and links
  const socials = [
    { icon: <FaFacebookF />, url: 'https://facebook.com', label: 'Facebook' },
    { icon: <FaTwitter />, url: 'https://twitter.com', label: 'Twitter' },
    { icon: <FaInstagram />, url: 'https://instagram.com', label: 'Instagram' },
    { icon: <FaYoutube />, url: 'https://youtube.com', label: 'YouTube' },
    { icon: <FaLinkedinIn />, url: 'https://linkedin.com', label: 'LinkedIn' },
  ];

  return (
    <footer style={s.footer}>
      <div style={s.grid}>

        {/* Brand */}
        <div style={s.brand}>
          <div style={s.logo}>
            <div style={s.logoIcon}>🏫</div>
            <div>
              <div style={s.logoText}>Apex High School</div>
              <div style={s.logoSub}>Excellence · Integrity · Innovation</div>
            </div>
          </div>
          <p style={s.desc}>
            Shaping the leaders of tomorrow through quality education 
            and innovative learning experiences since 1998.
          </p>
          
          {/* Real Social Media Links */}
          <div style={s.socials}>
            {socials.map((soc, i) => (
              <a 
                key={i} 
                href={soc.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={s.socialIcon}
                aria-label={soc.label}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#F5A623';
                  e.currentTarget.style.color = '#061229';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {soc.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div style={s.col}>
          <div style={s.colTitle}>Quick Links</div>
          {quickLinks.map(l => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              style={s.link}
              onMouseEnter={e => e.currentTarget.style.color = '#F5A623'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            >
              {l}
            </a>
          ))}
        </div>

        {/* Portals */}
        <div style={s.col}>
          <div style={s.colTitle}>Portals</div>
          {portals.map(p => (
            <button
              key={p.label}
              onClick={() => navigate(p.path)}
              style={s.linkBtn}
              onMouseEnter={e => e.currentTarget.style.color = '#F5A623'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Contact */}
        <div style={s.col}>
          <div style={s.colTitle}>Contact</div>
          <div style={{ ...s.link, cursor: 'default' }}>📍 Abuja, Nigeria</div>
          <div style={{ ...s.link, cursor: 'default' }}>📞 +234 800 123 4567</div>
          <div style={{ ...s.link, cursor: 'default' }}>✉️ info@apexhs.edu.ng</div>
          <div style={{ ...s.link, cursor: 'default' }}>🕐 Mon–Fri 8am–4pm</div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={s.bottom}>
        <div>© {year} Apex High School. All rights reserved.</div>
        <div style={s.bottomLinks}>
          <span style={s.bottomLink}>Privacy Policy</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span style={s.bottomLink}>Terms of Service</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span style={s.bottomLink}>Cookie Policy</span>
        </div>
      </div>
    </footer>
  );
}

const s = {
  footer: { background: '#061229', padding: '80px 5% 0' },
  grid: {
    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: 60, maxWidth: 1200, margin: '0 auto',
    paddingBottom: 60, borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  brand: {},
  logo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  logoIcon: { width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#F5A623,#FFC85A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 },
  logoText: { color: '#fff', fontWeight: 800, fontSize: 16 },
  logoSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  desc: { color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontSize: 14, marginBottom: 20 },
  socials: { display: 'flex', gap: 12 },
  socialIcon: {
    width: 38, height: 38, borderRadius: 10,
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, cursor: 'pointer', transition: 'all 0.3s ease',
    textDecoration: 'none'
  },
  col: { display: 'flex', flexDirection: 'column', gap: 12 },
  colTitle: { color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 8 },
  link: {
    color: 'rgba(255,255,255,0.6)', fontSize: 14,
    transition: 'color 0.2s', display: 'block', textDecoration: 'none'
  },
  linkBtn: {
    color: 'rgba(255,255,255,0.6)', fontSize: 14,
    background: 'none', border: 'none',
    cursor: 'pointer', transition: 'color 0.2s',
    textAlign: 'left', padding: 0, fontFamily: 'inherit',
  },
  bottom: {
    maxWidth: 1200, margin: '0 auto',
    padding: '24px 0', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    color: 'rgba(255,255,255,0.4)', fontSize: 13, flexWrap: 'wrap', gap: 12,
  },
  bottomLinks: { display: 'flex', gap: 16, alignItems: 'center' },
  bottomLink: { cursor: 'pointer', transition: 'color 0.2s' },
};