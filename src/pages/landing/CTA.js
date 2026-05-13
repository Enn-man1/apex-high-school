import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function CTA() {
  const navigate = useNavigate();
  
  // Advanced Parallax: No props needed, handles its own scroll logic
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);

  return (
    <section style={s.section}>
      {/* High-Performance Parallax Background */}
      <motion.div 
        style={{ ...s.bg, y: yBg }} 
      />
      <div style={s.overlay} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={s.content}
      >
        <h2 style={s.title}>Ready to Transform Your children?</h2>
        <p style={s.subtitle}>
          Join hundreds of schools using Apex HMS to streamline their operations.
        </p>
        
        <div style={s.buttons}>
          <motion.button
            onClick={() => navigate('/login')}
            whileHover={{ y: -5, scale: 1.05, boxShadow: '0 20px 40px rgba(245,166,35,0.5)' }}
            whileTap={{ scale: 0.98 }}
            style={s.primaryBtn}
          >
            🚀 Get Started Now
          </motion.button>
          
          <motion.a
            href="#contact"
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            style={s.secondaryBtn}
          >
            Contact Us
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}

const s = {
  section: {
    position: 'relative',
    padding: '140px 5%',
    textAlign: 'center',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px'
  },
  bg: {
    position: 'absolute',
    top: '-20%', left: 0, right: 0, bottom: '-20%',
    background: 'linear-gradient(135deg, #0D1B3E 0%, #1A3066 100%)',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(circle at center, rgba(245,166,35,0.12) 0%, transparent 70%)',
    zIndex: 1,
  },
  content: { position: 'relative', zIndex: 2, maxWidth: '800px' },
  title:    { fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, color: '#fff', marginBottom: 20, lineHeight: 1.1 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(16px, 2vw, 20px)', marginBottom: 48, fontWeight: 400 },
  buttons:  { display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' },
  primaryBtn: {
    background: 'linear-gradient(135deg, #F5A623, #FFC85A)',
    color: '#0D1B3E', border: 'none',
    padding: '20px 48px', borderRadius: 16,
    fontSize: 18, fontWeight: 800, cursor: 'pointer',
    transition: 'box-shadow 0.3s ease',
  },
  secondaryBtn: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', padding: '20px 48px', borderRadius: 16,
    fontSize: 18, fontWeight: 600, cursor: 'pointer',
    textDecoration: 'none', display: 'inline-block',
  },
};