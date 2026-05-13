import React, { useEffect, useState } from 'react';
import Navbar from './landing/Navbar';
import Hero from './landing/Hero';
import Stats from './landing/Stats';
import About from './landing/About';
import Features from './landing/Features';
import Roles from './landing/Roles';
import Payment from './landing/Payment';
import Testimonials from './landing/Testimonials';
import CTA from './landing/CTA';
import Contact from './landing/Contact';
import Footer from './landing/Footer';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: '#0D1B3E' }}>
      <Navbar scrollY={scrollY} />
      <Hero scrollY={scrollY} />
      <Stats />
      <About />
      <Features />
      <Roles />
      <Payment />
      <Testimonials />
      <CTA />
      <Contact />
      <Footer />
      
    </div>
  );
}