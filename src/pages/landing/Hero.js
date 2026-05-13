// src/pages/landing/Hero.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    bg:       'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80',
    badge:    '🏆 Excellence in Education Since 1998',
    title:    'Shaping the',
    titleAccent: 'Leaders of Tomorrow',
    subtitle: 'A comprehensive digital platform connecting administrators, teachers, students and parents — streamlining every aspect of school management.',
    tag:      'Best School 2024',
  },
  {
    bg:       'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1600&q=80',
    badge:    '🎓 Over 1,200 Students Enrolled',
    title:    'Academic',
    titleAccent: 'Excellence Redefined',
    subtitle: 'Track grades, attendance and performance in real time. Teachers, students and parents stay connected on one powerful platform.',
    tag:      '98% Pass Rate',
  },
  {
    bg:       'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&q=80',
    badge:    '📚 27 Years of Quality Education',
    title:    'Smart School',
    titleAccent: 'Management System',
    subtitle: 'From fee payments to timetables, report cards to announcements — everything your school needs in one place.',
    tag:      'Award Winning',
  },
  {
    bg:       'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&q=80',
    badge:    '💳 Secure Online Fee Payments',
    title:    'Empowering',
    titleAccent: 'Every Stakeholder',
    subtitle: 'Admins, teachers, students and parents each have their own portal — with real-time data, notifications and full transparency.',
    tag:      'Multi-Platform',
  },
];

export default function Hero({ scrollY }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [prev,    setPrev]    = useState(null);
  const [fading,  setFading]  = useState(false);

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPrev(current);
      setFading(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % SLIDES.length);
        setFading(false);
        setPrev(null);
      }, 800);
    }, 5000);
    return () => clearInterval(timer);
  }, [current]);

  const goTo = (idx) => {
    if (idx === current) return;
    setPrev(current);
    setFading(true);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
      setPrev(null);
    }, 800);
  };

  const slide = SLIDES[current];

  return (
    <section style={s.hero}>

      {/* Previous slide (fading out) */}
      {prev !== null && (
        <div style={{
          ...s.bg,
          backgroundImage: `url('${SLIDES[prev].bg}')`,
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.8s ease',
          zIndex: 1,
        }} />
      )}

      {/* Current slide bg */}
      <div style={{
        ...s.bg,
        backgroundImage: `url('${slide.bg}')`,
        transform:  `translateY(${scrollY * 0.3}px) scale(1.05)`,
        opacity:    fading ? 0 : 1,
        transition: 'opacity 0.8s ease',
        zIndex:     2,
      }} />

      {/* Dark overlay */}
      <div style={s.overlay} />

      {/* Gradient fade — left side brighter */}
      <div style={s.gradientSide} />

      {/* Particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          ...s.particle,
          width:  p.size, height: p.size,
          top: p.top, left: p.left,
          animationDelay:    p.delay,
          animationDuration: p.duration,
        }} />
      ))}

      {/* Content — LEFT ALIGNED */}
      <div style={s.content}>

        {/* Badge */}
        <div
          style={{
            ...s.badge,
            opacity:   fading ? 0 : 1,
            transform: fading ? 'translateY(10px)' : 'translateY(0)',
            transition:'all 0.6s ease 0.1s',
          }}
        >
          {slide.badge}
        </div>

        {/* Title */}
        <h1
          style={{
            ...s.title,
            opacity:   fading ? 0 : 1,
            transform: fading ? 'translateY(20px)' : 'translateY(0)',
            transition:'all 0.6s ease 0.2s',
          }}
        >
          <span style={s.titleNormal}>{slide.title}</span>
          <br />
          <span style={s.titleAccent}>{slide.titleAccent}</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            ...s.subtitle,
            opacity:   fading ? 0 : 1,
            transform: fading ? 'translateY(20px)' : 'translateY(0)',
            transition:'all 0.6s ease 0.3s',
          }}
        >
          style={slide.subtitle}
        </p>

        {/* Buttons */}
        <div
          style={{
            ...s.buttons,
            opacity:   fading ? 0 : 1,
            transform: fading ? 'translateY(20px)' : 'translateY(0)',
            transition:'all 0.6s ease 0.4s',
          }}
        >
          <button
            onClick={() => navigate('/login')}
            style={s.primaryBtn}
            onMouseEnter={e => {
              e.currentTarget.style.transform  = 'translateY(-3px)';
              e.currentTarget.style.boxShadow  = '0 20px 40px rgba(245,166,35,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform  = 'translateY(0)';
              e.currentTarget.style.boxShadow  = '0 10px 30px rgba(245,166,35,0.3)';
            }}
          >
            🚀 Access Portal
          </button>
          
          <a
            href="#about"
            style={s.secondaryBtn}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform  = 'translateY(-3px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.transform  = 'translateY(0)';
            }}
          >
            Learn More ↓
          </a>
        </div>

        {/* Slide indicators */}
        <div style={s.indicators}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                ...s.indicator,
                width:      i === current ? 32 : 10,
                background: i === current ? '#F5A623' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating tag card */}
      <div style={{
        ...s.tagCard,
        opacity:   fading ? 0 : 1,
        transform: `translateY(${scrollY * -0.06}px)`,
        transition:'opacity 0.6s ease',
      }}>
        <div style={s.tagDot} />
        <div>
          <div style={s.tagValue}>{slide.tag}</div>
          <div style={s.tagLabel}>Apex High School</div>
        </div>
      </div>

    </section>
  );
}

const particles = [
  { size:60,  top:'15%', left:'55%', delay:'0s',   duration:'6s' },
  { size:40,  top:'65%', left:'75%', delay:'1s',   duration:'7s' },
  { size:80,  top:'25%', left:'85%', delay:'2s',   duration:'8s' },
  { size:50,  top:'70%', left:'60%', delay:'0.5s', duration:'5s' },
];

const s = {
  hero: {
    position:   'relative',
    height:     '100vh',
    minHeight:  720,
    display:    'flex',
    alignItems: 'center',
    overflow:   'hidden',
  },
  bg: {
    position:           'absolute',
    inset:              0,
    backgroundSize:     'cover',
    backgroundPosition: 'center',
    willChange:         'transform',
  },
  overlay: {
    position:   'absolute',
    inset:      0,
    background: 'linear-gradient(to right, rgba(6,18,41,0.92) 0%, rgba(13,27,62,0.85) 40%, rgba(13,27,62,0.4) 70%, rgba(6,18,41,0.2) 100%)',
    zIndex:     3,
  },
  gradientSide: {
    position:   'absolute',
    inset:      0,
    background: 'linear-gradient(to bottom, rgba(6,18,41,0.3) 0%, transparent 30%, transparent 70%, rgba(6,18,41,0.8) 100%)',
    zIndex:     3,
  },
  particle: {
    position:     'absolute',
    borderRadius: '50%',
    background:   'rgba(245,166,35,0.06)',
    border:       '1px solid rgba(245,166,35,0.1)',
    animation:    'float 6s ease-in-out infinite',
    zIndex:       4,
    pointerEvents:'none',
  },

  content: {
    position:    'relative',
    zIndex:      5,
    maxWidth:    680,
    padding:     '0 5%',
    paddingLeft: '6%',
    paddingTop:  80,
  },

  badge: {
    display:      'inline-flex',
    alignItems:   'center',
    background:   'rgba(245,166,35,0.18)',
    border:       '1px solid rgba(245,166,35,0.4)',
    color:        '#FFC85A',
    padding:      '8px 18px',
    borderRadius: 100,
    fontSize:     13,
    fontWeight:   600,
    marginBottom: 24,
    letterSpacing:0.5,
    backdropFilter:'blur(10px)',
  },

  title: {
    lineHeight:   1.05,
    marginBottom: 20,
  },
  titleNormal: {
    display:      'block',
    fontSize:     'clamp(40px, 6vw, 76px)',
    fontWeight:   900,
    color:        '#fff',
    letterSpacing:-1,
  },
  titleAccent: {
    display:      'block',
    fontSize:     'clamp(36px, 5.5vw, 68px)',
    fontWeight:   900,
    color:        '#F5A623',
    letterSpacing:-1,
  },

  subtitle: {
    color:        'rgba(255,255,255,0.75)',
    fontSize:     'clamp(15px, 1.6vw, 17px)',
    lineHeight:   1.75,
    marginBottom: 36,
    maxWidth:     540,
  },

  buttons: {
    display:  'flex',
    gap:      14,
    flexWrap: 'wrap',
    marginBottom: 36,
  },
  primaryBtn: {
    background:   'linear-gradient(135deg, #F5A623, #FFC85A)',
    color:        '#0D1B3E',
    border:       'none',
    padding:      '15px 32px',
    borderRadius: 12,
    fontSize:     15,
    fontWeight:   800,
    cursor:       'pointer',
    boxShadow:    '0 10px 30px rgba(245,166,35,0.3)',
    transition:   'all 0.3s ease',
    fontFamily:   'inherit',
  },
  secondaryBtn: {
    background:     'rgba(255,255,255,0.08)',
    border:         '1px solid rgba(255,255,255,0.25)',
    color:          '#fff',
    padding:        '15px 32px',
    borderRadius:   12,
    fontSize:       15,
    fontWeight:     600,
    cursor:         'pointer',
    transition:     'all 0.3s ease',
    display:        'inline-block',
    textDecoration: 'none',
    backdropFilter: 'blur(10px)',
  },

  indicators: { display:'flex', gap:8, alignItems:'center' },
  indicator: {
    height:       10,
    borderRadius: 5,
    border:       'none',
    cursor:       'pointer',
    transition:   'all 0.4s ease',
    padding:      0,
  },

  tagCard: {
    position:       'absolute',
    right:          '5%',
    top:            '38%',
    background:     'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    border:         '1px solid rgba(255,255,255,0.2)',
    borderRadius:   16,
    padding:        '16px 22px',
    display:        'flex',
    alignItems:     'center',
    gap:            12,
    zIndex:         5,
  },
  tagDot:   { width:10, height:10, borderRadius:'50%', background:'#27AE60', boxShadow:'0 0 8px #27AE60', flexShrink:0 },
  tagValue: { color:'#fff', fontWeight:900, fontSize:18 },
  tagLabel: { color:'rgba(255,255,255,0.6)', fontSize:12, marginTop:2 },

  statsStrip: {
    position:       'absolute',
    bottom:         0,
    left:           0,
    right:          0,
    background:     'rgba(6,18,41,0.85)',
    backdropFilter: 'blur(20px)',
    borderTop:      '1px solid rgba(255,255,255,0.08)',
    display:        'flex',
    justifyContent: 'center',
    gap:            0,
    zIndex:         5,
  },
  statItem: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            4,
    padding:        '16px 40px',
    borderRight:    '1px solid rgba(255,255,255,0.08)',
    cursor:         'default',
  },
  statValue:{ color:'#F5A623', fontWeight:900, fontSize:20, lineHeight:1 },
  statLabel:{ color:'rgba(255,255,255,0.5)', fontSize:11, letterSpacing:0.5 },
};