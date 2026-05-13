import React from 'react';
import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    name: 'Mrs. Ngozi Okonkwo', role: 'Class Teacher', avatar: '👩‍🏫',
    text: 'Managing attendance and grades has never been easier. The system saves me hours every week.',
    color: '#2A9D8F',
  },
  {
    name: 'Mr. Chukwuemeka Adeyemi', role: 'Mathematics Teacher', avatar: '👨‍🏫',
    text: 'I can upload grades from anywhere and parents see them instantly. Brilliant system.',
    color: '#4361EE',
  },
  {
    name: 'Mrs. Fatima Aliyu', role: 'Parent', avatar: '👩',
    text: "I can track my child's results, attendance and pay fees online. Very convenient!",
    color: '#7B2D8B',
  },
  {
    name: 'Emeka Nwosu', role: 'Student, Grade 11B', avatar: '👦',
    text: 'Checking my results and timetable is so easy now. I love the mobile app too!',
    color: '#E63946',
  },
];

export default function Testimonials() {
  return (
    <section style={s.section}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={s.header}
      >
        <div style={s.badge}>Testimonials</div>
        <h2 style={s.title}>
          What Our Community<br />
          <span style={s.accent}>Says About Us</span>
        </h2>
      </motion.div>

      <div style={s.grid}>
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={i}
            // AUTO-ANIMATE ON SCROLL (STAGGERED)
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            
            // DYNAMIC HOVER
            whileHover={{ 
              y: -10, 
              borderColor: t.color,
              boxShadow: `0 20px 40px ${t.color}20` 
            }}
            style={s.card}
          >
            <div style={{ ...s.quote, color: t.color + '15' }}>"</div>
            <p style={s.text}>{t.text}</p>
            
            <div style={s.author}>
              <div style={{ ...s.avatar, background: t.color + '15' }}>
                {t.avatar}
              </div>
              <div>
                <div style={s.name}>{t.name}</div>
                <div style={{ ...s.role, color: t.color }}>{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const s = {
  section: { 
    padding: '100px 5%', 
    background: '#fff',
    overflow: 'hidden' 
  },
  header:   { textAlign: 'center', marginBottom: 60 },
  badge: {
    display: 'inline-block',
    background: 'rgba(67,97,238,0.1)', color: '#4361EE',
    padding: '6px 18px', borderRadius: 100,
    fontSize: 13, fontWeight: 600, marginBottom: 16,
  },
  title:   { fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900, color: '#0D1B3E', lineHeight: 1.2 },
  accent: { color: '#4361EE' },
  grid: {
    display: 'grid', 
    // Responsive grid handling
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 30, maxWidth: 1100, margin: '0 auto',
  },
  card: {
    background: '#fff', borderRadius: 24, padding: 32,
    border: '1.5px solid #E8ECF4',
    boxShadow: '0 4px 20px rgba(13,27,62,0.06)',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  quote:   { 
    fontSize: 120, 
    lineHeight: 0, 
    position: 'absolute', 
    top: 40, right: 30,
    fontFamily: 'serif',
    pointerEvents: 'none'
  },
  text:    { 
    color: '#4A5568', 
    lineHeight: 1.8, 
    fontSize: 16, 
    marginBottom: 30,
    zIndex: 1,
    fontStyle: 'italic'
  },
  author: { display: 'flex', alignItems: 'center', gap: 14 },
  avatar: { 
    width: 56, height: 56, borderRadius: 16, 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    fontSize: 28, flexShrink: 0 
  },
  name:   { fontWeight: 700, color: '#0D1B3E', fontSize: 16 },
  role:   { fontSize: 13, fontWeight: 600, marginTop: 2 },
};