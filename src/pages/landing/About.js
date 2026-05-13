import React, { useEffect, useRef, useState } from 'react';

export default function About() {
  const ref = useRef();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" ref={ref} style={s.section}>
      <div style={s.container}>

        {/* Text Section */}
        <div style={{
          ...s.text,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(-40px)', // Slide in from left
        }}>
          {/* Heading with Brand Color */}
          <h2 style={s.title}>
            Discover <span style={s.titleAccent}>Our School</span>
          </h2>

          <p style={s.desc}>
            Apex High School has been a center of academic excellence since 1998,
            combining modern technology with proven teaching methods to deliver
            outstanding educational experiences.
          </p>

          <p style={s.desc}>
            Our management system simplifies communication between administrators,
            teachers, students, and parents — making education smarter, faster,
            and more efficient.
          </p>

          <div style={s.highlights}>
            <Highlight text="Smart Digital Learning" />
            <Highlight text="Real-time Communication" />
            <Highlight text="Secure Student Data" />
          </div>
        </div>

        {/* Image Section */}
        <div style={{
          ...s.imageWrap,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(40px)', // Slide in from right
        }}>
          <div style={s.imageDecoration} /> {/* Decorative element behind image */}
          <img
            src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=800"
            alt="School Classroom"
            style={s.image}
          />
        </div>

      </div>
    </section>
  );
}

function Highlight({ text }) {
  return (
    <div style={s.highlightRow}>
      <span style={s.check}>✓</span>
      <span style={s.highlightText}>{text}</span>
    </div>
  );
}

const s = {
  section: {
    padding: '120px 20px',
    background: '#ffffff', // Clean white background to match the Hero fade
    color: '#1A2B4B', // Dark blue text for readability on white
    overflow: 'hidden',
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: 80,
    flexWrap: 'wrap',
  },
  text: {
    flex: '1 1 450px',
    transition: 'all 1s cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  title: {
    fontSize: 'clamp(32px, 4vw, 48px)',
    fontWeight: 800,
    marginBottom: 25,
    color: '#0D1B3E', // Deep enterprise blue
    letterSpacing: '-1px',
  },
  titleAccent: {
    color: '#F5A623', // Your signature Gold/Orange
    display: 'inline-block',
  },
  desc: {
    color: '#4A5568', // Soft gray-blue for descriptions
    fontSize: 18,
    lineHeight: 1.8,
    marginBottom: 20,
  },
  highlights: {
    marginTop: 30,
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 15,
  },
  highlightRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  check: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'rgba(245,166,35,0.15)',
    color: '#F5A623',
    fontSize: 14,
    fontWeight: 'bold',
  },
  highlightText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#2D3748',
  },
  imageWrap: {
    flex: '1 1 450px',
    position: 'relative',
    transition: 'all 1s cubic-bezier(0.2, 0.8, 0.2, 1)',
    transitionDelay: '0.2s',
  },
  image: {
    width: '100%',
    borderRadius: 24,
    boxShadow: '0 30px 60px rgba(13, 27, 62, 0.15)', // Softer shadow for light background
    position: 'relative',
    zIndex: 2,
  },
  imageDecoration: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: '100%',
    height: '100%',
    border: '2px solid #F5A623',
    borderRadius: 24,
    zIndex: 1,
    opacity: 0.3,
  },
};