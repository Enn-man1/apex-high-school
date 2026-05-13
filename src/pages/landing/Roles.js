import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ROLES = [
  {
    role: 'Admin', icon: '⚙️', color: '#E63946',
    gradient: 'linear-gradient(135deg, #E63946, #C0392B)',
    features: ['Manage students & teachers', 'Financial reports', 'Class management', 'School announcements'],
  },
  {
    role: 'Teacher', icon: '📚', color: '#2A9D8F',
    gradient: 'linear-gradient(135deg, #2A9D8F, #1A6B64)',
    features: ['Mark attendance', 'Upload grades', 'Post assignments', 'Message parents'],
  },
  {
    role: 'Student', icon: '🎓', color: '#4361EE',
    gradient: 'linear-gradient(135deg, #4361EE, #2541C4)',
    features: ['View results', 'Check timetable', 'Track attendance', 'Pay fees online'],
  },
  {
    role: 'Parent', icon: '👨‍👩‍👧', color: '#7B2D8B',
    gradient: 'linear-gradient(135deg, #7B2D8B, #5A1F66)',
    features: ["Monitor child's grades", 'Fee payment status', 'School announcements', 'Message teachers'],
  },
];

export default function Roles() {
  const navigate = useNavigate();

  return (
    <section style={s.section}>
      <div style={s.header}>
        <div style={s.badge}>Who Uses It</div>
        <h2 style={s.title}>
          Built for Every<br />
          <span style={s.accent}>Stakeholder</span>
        </h2>
      </div>

      <div style={s.grid}>
        {ROLES.map((r, i) => (
          <motion.div
            key={i}
            // AUTO-ANIMATE ON SCROLL
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            
            // SMOOTH HOVER EFFECTS
            whileHover={{ 
              y: -12, 
              scale: 1.02, 
              background: r.gradient,
              transition: { duration: 0.3 }
            }}
            style={s.card}
          >
            <div style={s.icon}>{r.icon}</div>
            <h3 style={s.cardTitle}>{r.role}</h3>
            <ul style={s.list}>
              {r.features.map((f, j) => (
                <li key={j} style={s.listItem}>
                  <span style={{ color: '#F5A623', marginRight: 8 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            
            <motion.button
              onClick={() => navigate('/login')}
              whileHover={{ backgroundColor: r.color, color: '#fff' }}
              style={{ ...s.btn, borderColor: r.color, color: r.color }}
            >
              Login as {r.role}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const s = {
  section: {
    padding: '100px 5%',
    background: 'linear-gradient(135deg, #0D1B3E, #1A3066)',
    overflow: 'hidden',
  },
  header: { textAlign: 'center', marginBottom: 60 },
  badge: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.12)', color: '#fff',
    padding: '6px 18px', borderRadius: 100,
    fontSize: 13, fontWeight: 600, marginBottom: 16,
  },
  title:  { fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 0 },
  accent: { color: '#F5A623' },
  grid: {
    display: 'grid', 
    // Responsive grid: 4 columns on desktop, fewer on smaller screens
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 24, maxWidth: 1200, margin: '0 auto',
  },
  card: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 24, padding: 32,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  icon:      { fontSize: 48, marginBottom: 16 },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 20 },
  list:      { listStyle: 'none', marginBottom: 28, padding: 0 },
  listItem:  { color: 'rgba(255,255,255,0.8)', fontSize: 14, padding: '7px 0', display: 'flex', alignItems: 'center' },
  btn: {
    width: '100%', padding: '12px',
    borderRadius: 10, border: '1.5px solid',
    background: 'transparent', fontSize: 14,
    fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.2s',
  },
};