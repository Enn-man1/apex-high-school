// src/pages/landing/Features.js
import React, { useEffect, useRef, useState } from 'react';

const FEATURES = [
  {
    icon: '📊',
    title: 'Smart Analytics',
    color: '#4361EE',
    bg: '#EEF2FF',
    desc: 'Real-time dashboards with performance tracking, attendance analytics and financial reports.',
    more: 'Get deep insights into student performance, class trends, and financial summaries with visual charts and exportable reports.',
  },
  {
    icon: '📱',
    title: 'Multi-Platform',
    color: '#2A9D8F',
    bg: '#F0FAFA',
    desc: 'Access from any device — web, Android or iOS.',
    more: 'Seamlessly switch between devices while keeping your data synced in real time across all platforms.',
  },
  {
    icon: '💳',
    title: 'Fee Payments',
    color: '#6F42C1',
    bg: '#F5F0FF',
    desc: 'Secure online fee payments via Flutterwave.',
    more: 'Supports card payments, bank transfer, and USSD with instant confirmation and automated receipts.',
  },
  {
    icon: '📢',
    title: 'Announcements',
    color: '#E63946',
    bg: '#FFF0F0',
    desc: 'Instant school-wide or targeted announcements.',
    more: 'Send messages to specific classes, roles, or the entire school with push notifications.',
  },
  {
    icon: '✅',
    title: 'Attendance',
    color: '#27AE60',
    bg: '#F0FAF4',
    desc: 'Mark and monitor attendance with ease.',
    more: 'Track daily attendance, generate reports, and notify parents automatically for absences.',
  },
  {
    icon: '💬',
    title: 'Messaging',
    color: '#F5A623',
    bg: '#FFFAF0',
    desc: 'Direct communication in real time.',
    more: 'Private chats, announcements, and group discussions between teachers, students, and parents.',
  },
];

export default function Features() {
  const ref = useRef();
  const [visible, setVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="features" ref={ref} style={s.section}>
      <div style={s.header}>
        <div style={s.badge}>Platform Features</div>

        <h2 style={s.title}>
          Everything You Need<br />
          <span style={s.accent}>In One Place</span>
        </h2>

        <p style={s.subtitle}>
          A complete school management ecosystem built for the modern age
        </p>
      </div>

      <div style={s.grid}>
        {FEATURES.map((f, i) => {
          const isOpen = openIndex === i;

          return (
            <div
              key={i}
              style={{
                ...s.card,
                opacity: visible ? 1 : 0,
                transform: visible
                  ? 'translateY(0)'
                  : i % 2 === 0
                  ? 'translateX(-30px)'
                  : 'translateX(30px)',
                transition: `all 0.6s ease ${i * 0.1}s`,
              }}
            >
              <div style={{ ...s.icon, background: f.bg }}>
                <span style={{ fontSize: 30 }}>{f.icon}</span>
              </div>

              <h3 style={{ ...s.cardTitle, color: f.color }}>
                {f.title}
              </h3>

              <p style={s.desc}>{f.desc}</p>

              {/* Learn More Button */}
              <button
                onClick={() => toggle(i)}
                style={{ ...s.learnBtn, color: f.color }}
              >
                {isOpen ? 'Hide details ↑' : 'Learn more →'}
              </button>

              {/* Expandable Content */}
              <div
                style={{
                  ...s.expand,
                  maxHeight: isOpen ? 200 : 0,
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <p style={s.moreText}>{f.more}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const s = {
  section: {
    padding: '100px 5%',
    background: '#fff',
  },

  header: {
    textAlign: 'center',
    marginBottom: 60,
  },

  badge: {
    display: 'inline-block',
    background: 'rgba(67,97,238,0.1)',
    color: '#4361EE',
    padding: '6px 18px',
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 16,
  },

  title: {
    fontSize: 'clamp(28px,3.5vw,44px)',
    fontWeight: 900,
    color: '#0D1B3E',
    lineHeight: 1.2,
    marginBottom: 16,
  },

  accent: { color: '#4361EE' },

  subtitle: {
    color: '#8896AB',
    fontSize: 17,
    maxWidth: 500,
    margin: '0 auto',
    lineHeight: 1.6,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 24,
    maxWidth: 1200,
    margin: '0 auto',
  },

  card: {
    background: '#fff',
    borderRadius: 20,
    padding: 32,
    border: '1.5px solid #E8ECF4',
    boxShadow: '0 4px 20px rgba(13,27,62,0.08)',
    transition: 'all 0.3s ease',
  },

  icon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 12,
  },

  desc: {
    color: '#8896AB',
    lineHeight: 1.7,
    fontSize: 15,
    marginBottom: 10,
  },

  learnBtn: {
    background: 'none',
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
  },

  expand: {
    overflow: 'hidden',
    transition: 'all 0.4s ease',
  },

  moreText: {
    fontSize: 14,
    color: '#555',
    marginTop: 10,
    lineHeight: 1.6,
  },
};