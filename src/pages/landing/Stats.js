// src/pages/landing/Stats.js
import React, { useState, useEffect } from 'react';

export default function Stats() {
  const [counts, setCounts] = useState({ students: 0, teachers: 0, classes: 0, years: 0 });

  useEffect(() => {
    const targets = { students: 1200, teachers: 85, classes: 32, years: 27 };
    const steps   = 60;
    let step      = 0;

    const timer = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      setCounts({
        students: Math.floor(ease * targets.students),
        teachers: Math.floor(ease * targets.teachers),
        classes:  Math.floor(ease * targets.classes),
        years:    Math.floor(ease * targets.years),
      });
      if (step >= steps) clearInterval(timer);
    }, 2000 / steps);

    return () => clearInterval(timer);
  }, []);

  const items = [
    { key: 'students', suffix: '+', label: 'Students Enrolled',   icon: '🎓', color: '#4361EE' },
    { key: 'teachers', suffix: '',  label: 'Qualified Teachers',  icon: '📚', color: '#2A9D8F' },
    { key: 'classes',  suffix: '',  label: 'Active Classes',      icon: '🏫', color: '#E63946' },
    { key: 'years',    suffix: '',  label: 'Years of Excellence', icon: '⭐', color: '#F5A623' },
  ];

  return (
    <section style={s.section}>
      <div style={s.grid}>
        {items.map((item, i) => (
          <div
            key={i}
            style={s.card}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = `0 20px 40px ${item.color}25`;
              e.currentTarget.style.borderColor = item.color;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,27,62,0.08)';
              e.currentTarget.style.borderColor = '#E8ECF4';
            }}
          >
            <div style={{ ...s.iconWrap, background: item.color + '15' }}>
              <span style={{ fontSize: 32 }}>{item.icon}</span>
            </div>
            <div style={{ ...s.value, color: item.color }}>
              {counts[item.key].toLocaleString()}{item.suffix}
            </div>
            <div style={s.label}>{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

const s = {
  section: {
    background: '#fff',
    padding: '70px 5%',
    boxShadow: '0 -4px 30px rgba(13,27,62,0.06)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 24, maxWidth: 1100, margin: '0 auto',
  },
  card: {
    textAlign: 'center', padding: '36px 20px',
    background: '#F8F9FD', borderRadius: 20,
    border: '1.5px solid #E8ECF4',
    boxShadow: '0 4px 20px rgba(13,27,62,0.08)',
    transition: 'all 0.3s ease', cursor: 'default',
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 18,
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', margin: '0 auto 16px',
  },
  value: {
    fontSize: 44, fontWeight: 900,
    lineHeight: 1, marginBottom: 8,
  },
  label: { color: '#8896AB', fontSize: 14, fontWeight: 500 },
};