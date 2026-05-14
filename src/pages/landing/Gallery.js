// src/pages/landing/Gallery.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ['All', 'Academics', 'Sports', 'Events', 'Science', 'Arts', 'Graduation'];

const GALLERY_ITEMS = [
  // Academics
  { id: 1, category: 'Academics', title: 'Mathematics Class', subtitle: 'Grade 11A in session', emoji: '🔢', color: '#4361EE', bg: 'linear-gradient(135deg,#4361EE,#2541C4)', size: 'large' },
  { id: 2, category: 'Academics', title: 'Library Study Hour', subtitle: 'Students reading and researching', emoji: '📚', color: '#2A9D8F', bg: 'linear-gradient(135deg,#2A9D8F,#1A6B64)', size: 'small' },
  { id: 3, category: 'Science', title: 'Biology Lab Experiment', subtitle: 'Grade 12A conducting experiments', emoji: '🧬', color: '#27AE60', bg: 'linear-gradient(135deg,#27AE60,#1E8449)', size: 'small' },
  { id: 4, category: 'Science', title: 'Chemistry Lab', subtitle: 'Titration experiments', emoji: '⚗️', color: '#E63946', bg: 'linear-gradient(135deg,#E63946,#C0392B)', size: 'large' },
  { id: 5, category: 'Academics', title: 'English Literature', subtitle: 'Poetry recitation day', emoji: '📖', color: '#6F42C1', bg: 'linear-gradient(135deg,#6F42C1,#5A1F9E)', size: 'small' },
  { id: 6, category: 'Science', title: 'Physics Demonstration', subtitle: 'Wave and sound experiments', emoji: '⚡', color: '#F5A623', bg: 'linear-gradient(135deg,#F5A623,#E8920A)', size: 'small' },

  // Sports
  { id: 7, category: 'Sports', title: 'Inter-House Football', subtitle: 'Annual Sports Competition 2024', emoji: '⚽', color: '#27AE60', bg: 'linear-gradient(135deg,#27AE60,#1E8449)', size: 'large' },
  { id: 8, category: 'Sports', title: 'Athletics Day', subtitle: '100m sprint finals', emoji: '🏃', color: '#E63946', bg: 'linear-gradient(135deg,#E63946,#C0392B)', size: 'small' },
  { id: 9, category: 'Sports', title: 'Basketball Team', subtitle: 'Champions 2024', emoji: '🏀', color: '#F5A623', bg: 'linear-gradient(135deg,#F5A623,#E8920A)', size: 'small' },
  { id: 10, category: 'Sports', title: 'Swimming Gala', subtitle: 'Annual swimming competition', emoji: '🏊', color: '#4361EE', bg: 'linear-gradient(135deg,#4361EE,#2541C4)', size: 'small' },
  { id: 11, category: 'Sports', title: 'Volleyball Match', subtitle: 'Girls team in action', emoji: '🏐', color: '#2A9D8F', bg: 'linear-gradient(135deg,#2A9D8F,#1A6B64)', size: 'small' },

  // Events
  { id: 12, category: 'Events', title: 'Independence Day Parade', subtitle: 'October 1st celebration', emoji: '🇳🇬', color: '#27AE60', bg: 'linear-gradient(135deg,#27AE60,#1E8449)', size: 'large' },
  { id: 13, category: 'Events', title: 'Cultural Day', subtitle: 'Traditional attire showcase', emoji: '🎭', color: '#7B2D8B', bg: 'linear-gradient(135deg,#7B2D8B,#5A1F66)', size: 'small' },
  { id: 14, category: 'Events', title: 'Prize Giving Day', subtitle: 'Best students recognised', emoji: '🏆', color: '#F5A623', bg: 'linear-gradient(135deg,#F5A623,#E8920A)', size: 'small' },
  { id: 15, category: 'Events', title: 'School Open Day', subtitle: 'Parents visit school', emoji: '🏫', color: '#4361EE', bg: 'linear-gradient(135deg,#4361EE,#2541C4)', size: 'small' },
  { id: 16, category: 'Events', title: 'Christmas Carol Concert', subtitle: 'Annual carol service', emoji: '🎄', color: '#E63946', bg: 'linear-gradient(135deg,#E63946,#C0392B)', size: 'small' },

  // Arts
  { id: 17, category: 'Arts', title: 'Art Exhibition', subtitle: 'Student artwork display', emoji: '🎨', color: '#E84393', bg: 'linear-gradient(135deg,#E84393,#C0136E)', size: 'large' },
  { id: 18, category: 'Arts', title: 'Drama Club Performance', subtitle: 'End of year school play', emoji: '🎭', color: '#6F42C1', bg: 'linear-gradient(135deg,#6F42C1,#5A1F9E)', size: 'small' },
  { id: 19, category: 'Arts', title: 'Music Ensemble', subtitle: 'School choir performance', emoji: '🎵', color: '#2A9D8F', bg: 'linear-gradient(135deg,#2A9D8F,#1A6B64)', size: 'small' },
  { id: 20, category: 'Arts', title: 'Photography Club', subtitle: 'Best shots exhibition', emoji: '📷', color: '#0D1B3E', bg: 'linear-gradient(135deg,#0D1B3E,#1A3066)', size: 'small' },

  // Graduation
  { id: 21, category: 'Graduation', title: 'Graduation Ceremony 2024', subtitle: 'Class of 2024 graduates', emoji: '🎓', color: '#F5A623', bg: 'linear-gradient(135deg,#F5A623,#E8920A)', size: 'large' },
  { id: 22, category: 'Graduation', title: 'Valedictory Speech', subtitle: 'Best graduating student', emoji: '🏅', color: '#4361EE', bg: 'linear-gradient(135deg,#4361EE,#2541C4)', size: 'small' },
  { id: 23, category: 'Graduation', title: 'Class of 2024 Photo', subtitle: 'Official class photograph', emoji: '📸', color: '#27AE60', bg: 'linear-gradient(135deg,#27AE60,#1E8449)', size: 'small' },
  { id: 24, category: 'Graduation', title: 'Certificate Presentation', subtitle: 'Principal presenting awards', emoji: '📜', color: '#E63946', bg: 'linear-gradient(135deg,#E63946,#C0392B)', size: 'small' },
];

function LogoImage({ size = 40, radius = 12 }) {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    return (
      <img
        src={`${process.env.PUBLIC_URL}/logo.jpg`}
        alt="Apex High School"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: 'cover',
          flexShrink: 0,
          border: '2px solid rgba(255,255,255,0.15)',
        }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: radius,
      background: 'linear-gradient(135deg,#F5A623,#FFC85A)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: 900,
      color: '#0D1B3E',
      flexShrink: 0,
    }}>
      AH
    </div>
  );
}

export default function Gallery() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setTimeout(() => setAnimate(true), 100);
  }, []);

  const filtered = GALLERY_ITEMS.filter(item => {
    const catOk = category === 'All' || item.category === category;
    const searchOk = !search || item.title.toLowerCase().includes(search.toLowerCase());
    return catOk && searchOk;
  });

  const large = filtered.filter(i => i.size === 'large');
  const small = filtered.filter(i => i.size === 'small');

  const handleCategory = (cat) => {
    setAnimate(false);
    setCategory(cat);
    setTimeout(() => setAnimate(true), 150);
  };

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* ── Navbar ── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navLogo} onClick={() => navigate('/')}>
            <LogoImage size={40} radius={10} />
            <div>
              <div style={s.navLogoText}>Apex High School</div>
              <div style={s.navLogoSub}>School Gallery</div>
            </div>
          </div>
          <button style={s.backBtn} onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={s.hero}>
        <div style={s.heroBg} />
        <div style={s.heroOverlay} />
        <div style={s.heroContent}>
          <div style={s.heroBadge}>📸 School Gallery</div>
          <h1 style={s.heroTitle}>Moments That Matter</h1>
          <p style={s.heroSubtitle}>
            Capturing the spirit of Apex High School — academics, sports,
            events, arts and everything in between.
          </p>
          <div style={s.heroStats}>
            {[
              { value: `${GALLERY_ITEMS.length}+`, label: 'Photos' },
              { value: '7', label: 'Categories' },
              { value: '2024', label: 'Latest Year' },
            ].map((stat, i) => (
              <div key={i} style={s.heroStat}>
                <div style={s.heroStatValue}>{stat.value}</div>
                <div style={s.heroStatLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={s.main}>

        {/* Toolbar */}
        <div style={s.toolbar}>
          {/* Search */}
          <div style={s.searchWrap}>
            <span style={{ fontSize: 16, color: '#8896AB' }}>🔍</span>
            <input
              type="text"
              placeholder="Search gallery..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={s.searchInput}
            />
            {search && (
              <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {/* Category filter */}
          <div style={s.categories}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                style={{
                  ...s.catBtn,
                  background: category === cat ? 'linear-gradient(135deg,#0D1B3E,#1A3066)' : '#fff',
                  color: category === cat ? '#fff' : '#4A5568',
                  borderColor: category === cat ? '#0D1B3E' : '#E8ECF4',
                  transform: category === cat ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: category === cat ? '0 8px 20px rgba(13,27,62,0.2)' : 'none',
                }}
                onMouseEnter={e => {
                  if (category !== cat) {
                    e.currentTarget.style.borderColor = '#0D1B3E';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={e => {
                  if (category !== cat) {
                    e.currentTarget.style.borderColor = '#E8ECF4';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div style={s.resultsRow}>
          <span style={s.resultsCount}>
            Showing <strong>{filtered.length}</strong> photos
            {category !== 'All' ? ` in ${category}` : ''}
          </span>
          {search && (
            <span style={s.resultsSearch}>for "{search}"</span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>📷</div>
            <div style={s.emptyTitle}>No photos found</div>
            <div style={s.emptySub}>Try a different category or search term</div>
          </div>
        ) : (
          <>
            {/* ── Featured (large) grid ── */}
            {large.length > 0 && (
              <div style={s.featuredGrid}>
                {large.map((item, i) => (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    animate={animate}
                    delay={i * 0.1}
                    onClick={() => setSelected(item)}
                    featured
                  />
                ))}
              </div>
            )}

            {/* ── Small grid ── */}
            {small.length > 0 && (
              <div style={s.smallGrid}>
                {small.map((item, i) => (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    animate={animate}
                    delay={(large.length + i) * 0.07}
                    onClick={() => setSelected(item)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CTA ── */}
        <div style={s.cta}>
          <div style={s.ctaContent}>
            <h3 style={s.ctaTitle}>Want to see more?</h3>
            <p style={s.ctaSub}>
              Visit Apex High School to experience the full school life.
            </p>
            <div style={s.ctaBtns}>
              <button
                onClick={() => navigate('/login')}
                style={s.ctaPrimary}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                🚀 Access Student Portal
              </button>
              <button
                onClick={() => navigate('/')}
                style={s.ctaSecondary}
              >
                Contact School
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {selected && (
        <div
          style={s.lightboxOverlay}
          onClick={() => setSelected(null)}
        >
          <div
            style={s.lightbox}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              style={s.lightboxClose}
              onClick={() => setSelected(null)}
            >
              ✕
            </button>

            {/* Image */}
            <div style={{
              ...s.lightboxImage,
              background: selected.bg,
            }}>
              {/* Decorative circles */}
              <div style={s.lbCircle1} />
              <div style={s.lbCircle2} />
              <span style={s.lightboxEmoji}>{selected.emoji}</span>
            </div>

            {/* Info */}
            <div style={s.lightboxInfo}>
              <div style={{
                ...s.lightboxCatBadge,
                background: selected.color + '15',
                color: selected.color,
              }}>
                {selected.category}
              </div>
              <h2 style={s.lightboxTitle}>{selected.title}</h2>
              <p style={s.lightboxSubtitle}>{selected.subtitle}</p>

              {/* Nav arrows */}
              <div style={s.lightboxNav}>
                <button
                  style={s.lbNavBtn}
                  onClick={() => {
                    const idx = filtered.indexOf(selected);
                    const prev = filtered[(idx - 1 + filtered.length) % filtered.length];
                    setSelected(prev);
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0D1B3E'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F8F9FD'}
                >
                  ← Prev
                </button>
                <span style={s.lbNavCount}>
                  {filtered.indexOf(selected) + 1} / {filtered.length}
                </span>
                <button
                  style={s.lbNavBtn}
                  onClick={() => {
                    const idx = filtered.indexOf(selected);
                    const next = filtered[(idx + 1) % filtered.length];
                    setSelected(next);
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0D1B3E'}
                  onMouseLeave={e => e.currentTarget.style.background = '#F8F9FD'}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Gallery Card Component ─────────────────────────────────
function GalleryCard({ item, animate, delay, onClick, featured }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...gc.card,
        opacity: animate ? 1 : 0,
        transform: animate
          ? 'translateY(0) scale(1)'
          : 'translateY(30px) scale(0.95)',
        transition: `all 0.5s ease ${delay}s`,
        cursor: 'pointer',
        height: featured ? 320 : 220,
      }}
    >
      {/* Background */}
      <div style={{ ...gc.bg, background: item.bg }} />

      {/* Decorative circles */}
      <div style={{
        ...gc.circle1,
        background: 'rgba(255,255,255,0.08)',
        transform: hovered ? 'scale(1.2)' : 'scale(1)',
      }} />
      <div style={{
        ...gc.circle2,
        background: 'rgba(255,255,255,0.05)',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
      }} />

      {/* Shimmer on hover */}
      {hovered && <div style={gc.shimmer} />}

      {/* Category badge */}
      <div style={gc.catBadge}>{item.category}</div>

      {/* Main emoji */}
      <div style={{
        ...gc.emoji,
        fontSize: featured ? 72 : 52,
        transform: hovered ? 'scale(1.15) translateY(-8px)' : 'scale(1) translateY(0)',
      }}>
        {item.emoji}
      </div>

      {/* Overlay info on hover */}
      <div style={{
        ...gc.overlay,
        opacity: hovered ? 1 : 0,
      }}>
        <div style={gc.overlayTitle}>{item.title}</div>
        <div style={gc.overlaySub}>{item.subtitle}</div>
        <div style={gc.overlayBtn}>🔍 View</div>
      </div>

      {/* Bottom info (always visible) */}
      <div style={{
        ...gc.info,
        transform: hovered ? 'translateY(0)' : 'translateY(4px)',
      }}>
        <div style={gc.infoTitle}>{item.title}</div>
        <div style={gc.infoSub}>{item.subtitle}</div>
      </div>
    </div>
  );
}

// ── Gallery Card Styles ───────────────────────────────────
const gc = {
  card: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(13,27,62,0.12)',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    transition: 'transform 0.5s ease',
  },
  circle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: '50%',
    top: -40,
    right: -40,
    transition: 'transform 0.5s ease',
  },
  circle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: '50%',
    bottom: -30,
    left: -30,
    transition: 'transform 0.5s ease',
  },
  shimmer: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
    animation: 'shimmerSlide 0.8s ease forwards',
  },
  catBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: 20,
    letterSpacing: 0.5,
    zIndex: 2,
  },
  emoji: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-60%)',
    transition: 'all 0.4s ease',
    zIndex: 2,
    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.3s ease',
    zIndex: 3,
    padding: 20,
    textAlign: 'center',
  },
  overlayTitle: { color: '#fff', fontSize: 18, fontWeight: 900, marginBottom: 6 },
  overlaySub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 16 },
  overlayBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.4)',
    color: '#fff',
    padding: '8px 20px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '20px 18px 16px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
    transition: 'transform 0.3s ease',
    zIndex: 2,
  },
  infoTitle: { color: '#fff', fontSize: 15, fontWeight: 800, marginBottom: 2 },
  infoSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
};

// ── Page Styles ───────────────────────────────────────────
const s = {
  page: { minHeight: '100vh', background: '#F8F9FD', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },

  nav: { position: 'sticky', top: 0, background: 'rgba(13,27,62,0.97)', backdropFilter: 'blur(20px)', zIndex: 100, padding: '0 5%', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
  navInner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70, maxWidth: 1200, margin: '0 auto' },
  navLogo: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
  navLogoIcon: { width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#F5A623,#FFC85A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  navLogoText: { color: '#fff', fontWeight: 800, fontSize: 15 },
  navLogoSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  backBtn: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },

  hero: { position: 'relative', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 0 },
  heroBg: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0D1B3E 0%,#1A3066 50%,#0D2B29 100%)', zIndex: 0 },
  heroOverlay: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 50%,rgba(245,166,35,0.1) 0%,transparent 60%)', zIndex: 0 },
  heroContent: { position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 700, padding: '0 24px' },
  heroBadge: { display: 'inline-block', background: 'rgba(245,166,35,0.2)', border: '1px solid rgba(245,166,35,0.4)', color: '#FFC85A', padding: '6px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 16 },
  heroTitle: { fontSize: 'clamp(32px,5vw,56px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 12 },
  heroSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 28 },
  heroStats: { display: 'flex', justifyContent: 'center', gap: 40 },
  heroStat: { textAlign: 'center' },
  heroStatValue: { fontSize: 28, fontWeight: 900, color: '#F5A623' },
  heroStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  main: { maxWidth: 1280, margin: '0 auto', padding: '40px 5% 80px' },

  toolbar: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid #E8ECF4', borderRadius: 12, padding: '0 16px', height: 50, maxWidth: 420, boxShadow: '0 2px 8px rgba(13,27,62,0.06)' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#0D1B3E', background: 'transparent', fontFamily: 'inherit' },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#8896AB', fontSize: 14 },
  categories: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  catBtn: {
    padding: '9px 20px',
    borderRadius: 10,
    border: '1.5px solid',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    fontFamily: 'inherit',
  },

  resultsRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 },
  resultsCount: { fontSize: 14, color: '#4A5568' },
  resultsSearch: { fontSize: 14, color: '#4361EE', fontStyle: 'italic' },

  featuredGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20, marginBottom: 20 },
  smallGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 48 },

  empty: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: '#0D1B3E', marginBottom: 8 },
  emptySub: { color: '#8896AB', fontSize: 15 },

  cta: { background: 'linear-gradient(135deg,#0D1B3E,#1A3066)', borderRadius: 24, padding: '48px', textAlign: 'center' },
  ctaContent: {},
  ctaTitle: { fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 10 },
  ctaSub: { color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 28 },
  ctaBtns: { display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' },
  ctaPrimary: { background: 'linear-gradient(135deg,#F5A623,#FFC85A)', color: '#0D1B3E', border: 'none', padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'inherit' },
  ctaSecondary: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },

  // Lightbox
  lightboxOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  lightbox: { background: '#fff', borderRadius: 24, overflow: 'hidden', maxWidth: 680, width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', position: 'relative' },
  lightboxClose: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },
  lightboxImage: { height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  lbCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -60, right: -60 },
  lbCircle2: { position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -40, left: -40 },
  lightboxEmoji: { fontSize: 100, position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.3))' },
  lightboxInfo: { padding: '28px 32px' },
  lightboxCatBadge: { display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  lightboxTitle: { fontSize: 24, fontWeight: 900, color: '#0D1B3E', marginBottom: 8 },
  lightboxSubtitle: { fontSize: 15, color: '#8896AB', lineHeight: 1.6, marginBottom: 24 },
  lightboxNav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  lbNavBtn: {
    padding: '9px 20px',
    border: '1.5px solid #E8ECF4',
    borderRadius: 10,
    background: '#F8F9FD',
    color: '#0D1B3E',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  lbNavCount: { fontSize: 14, color: '#8896AB', fontWeight: 600 },
};

const css = `
  @keyframes shimmerSlide {
    from { transform: translateX(-100%); }
    to   { transform: translateX(200%); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;