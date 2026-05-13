// src/pages/landing/index.js
import React, { useEffect, useState } from 'react';
import Navbar        from './Navbar';
import Hero          from './Hero';
import Stats         from './Stats';
import About         from './About';
import Features      from './Features';
import Roles         from './Roles';
import Payment       from './Payment';
import Testimonials  from './Testimonials';
import CTA           from './CTA';
import Contact       from './Contact';
import Footer        from './Footer';

export default function LandingPage() {
  const [scrollY,    setScrollY]   = useState(0);
  const [isVisible,  setIsVisible] = useState({});

  // Parallax scroll tracker
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer — triggers animations on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.15 }
    );

    // Small delay to let DOM render
    setTimeout(() => {
      document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
      });
    }, 100);

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{globalStyles}</style>

      <Navbar scrollY={scrollY} />
      <Hero   scrollY={scrollY} />
      <Stats  />
      <About      isVisible={isVisible} />
      <Features   isVisible={isVisible} />
      <Roles      isVisible={isVisible} />
      <Payment    isVisible={isVisible} />
      <Testimonials isVisible={isVisible} />
      <CTA        scrollY={scrollY} />
      <Contact    />
      <Footer     />

      {/* Scroll to top button */}
      {scrollY > 400 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={scrollTopBtn}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          ↑
        </button>
      )}
    </div>
  );
}

const scrollTopBtn = {
  position: 'fixed', bottom: 32, right: 32,
  width: 48, height: 48, borderRadius: '50%',
  background: 'linear-gradient(135deg, #F5A623, #FFC85A)',
  color: '#0D1B3E', border: 'none', fontSize: 20,
  fontWeight: 900, cursor: 'pointer', zIndex: 999,
  boxShadow: '0 8px 20px rgba(245,166,35,0.4)',
  transition: 'all 0.2s',
};

const globalStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
      Roboto, Oxygen, Ubuntu, sans-serif;
    color: #0D1B3E;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #F0F3FA; }
  ::-webkit-scrollbar-thumb { background: #C0C8D8; border-radius: 3px; }

  a { text-decoration: none; color: inherit; }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-20px); }
  }
  @keyframes floatSlow {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-10px); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.7; transform: scale(1.05); }
  }
  @keyframes shimmer {
    0%   { transform: translateX(-100%) rotate(30deg); }
    100% { transform: translateX(200%) rotate(30deg); }
  }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;