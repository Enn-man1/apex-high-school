// src/pages/landing/Contact.js
import React from 'react';
import toast from 'react-hot-toast';

const CONTACT_ITEMS = [
  { icon: '📍', label: 'Address',      value: '123 Education Lane, Abuja, Nigeria' },
  { icon: '📞', label: 'Phone',        value: '+234 800 123 4567' },
  { icon: '✉️', label: 'Email',        value: 'info@apexhighschool.edu.ng' },
  { icon: '🕐', label: 'Office Hours', value: 'Mon – Fri: 8:00am – 4:00pm' },
];

export default function Contact() {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Message sent! We will get back to you soon.');
    e.target.reset();
  };

  return (
    <section id="contact" style={s.section}>
      <div style={s.header}>
        <div style={s.badge}>Contact Us</div>
        <h2 style={s.title}>
          Get In <span style={s.accent}>Touch</span>
        </h2>
      </div>

      <div style={s.grid}>
        {/* Contact Info */}
        <div style={s.info}>
          {CONTACT_ITEMS.map((c, i) => (
            <div
              key={i}
              style={s.item}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateX(8px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={s.itemIcon}>{c.icon}</div>
              <div>
                <div style={s.itemLabel}>{c.label}</div>
                <div style={s.itemValue}>{c.value}</div>
              </div>
            </div>
          ))}

          {/* Map placeholder */}
          <div style={s.mapPlaceholder}>
            <span style={{ fontSize: 40 }}>🗺️</span>
            <div style={{ color: '#8896AB', marginTop: 8 }}>
              123 Education Lane, Abuja
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form style={s.form} onSubmit={handleSubmit}>
          <div style={s.formRow}>
            <div style={s.formGroup}>
              <label style={s.label}>Full Name</label>
              <input
                type="text"
                required
                placeholder="Your full name"
                style={s.input}
                onFocus={e => {
                  e.target.style.borderColor = '#4361EE';
                  e.target.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#E8ECF4';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Email Address</label>
              <input
                type="email"
                required
                placeholder="your@email.com"
                style={s.input}
                onFocus={e => {
                  e.target.style.borderColor = '#4361EE';
                  e.target.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#E8ECF4';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div style={s.formGroup}>
            <label style={s.label}>Subject</label>
            <input
              type="text"
              required
              placeholder="How can we help?"
              style={s.input}
              onFocus={e => {
                e.target.style.borderColor = '#4361EE';
                e.target.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.12)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#E8ECF4';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={s.formGroup}>
            <label style={s.label}>Message</label>
            <textarea
              required
              rows={5}
              placeholder="Write your message..."
              style={s.textarea}
              onFocus={e => {
                e.target.style.borderColor = '#4361EE';
                e.target.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.12)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#E8ECF4';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            style={s.submitBtn}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(67,97,238,0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Send Message →
          </button>
        </form>
      </div>
    </section>
  );
}

const s = {
  section: { padding: '100px 5%', background: '#F8F9FD' },
  header:  { textAlign: 'center', marginBottom: 60 },
  badge: {
    display: 'inline-block',
    background: 'rgba(67,97,238,0.1)', color: '#4361EE',
    padding: '6px 18px', borderRadius: 100,
    fontSize: 13, fontWeight: 600, marginBottom: 16,
  },
  title:  { fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900, color: '#0D1B3E', lineHeight: 1.2 },
  accent: { color: '#4361EE' },
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1.5fr',
    gap: 60, maxWidth: 1100, margin: '0 auto',
  },
  info:  { display: 'flex', flexDirection: 'column', gap: 16 },
  item: {
    display: 'flex', alignItems: 'flex-start', gap: 16,
    background: '#fff', borderRadius: 16, padding: 20,
    boxShadow: '0 2px 12px rgba(13,27,62,0.06)',
    transition: 'all 0.2s', cursor: 'default',
  },
  itemIcon:  { fontSize: 28, width: 44, textAlign: 'center', flexShrink: 0 },
  itemLabel: { color: '#8896AB', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  itemValue: { color: '#0D1B3E', fontWeight: 600, fontSize: 15 },
  mapPlaceholder: {
    background: '#fff', borderRadius: 16, padding: 32,
    textAlign: 'center', border: '2px dashed #E8ECF4',
    flexGrow: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  form: { background: '#fff', borderRadius: 24, padding: 40, boxShadow: '0 8px 30px rgba(13,27,62,0.08)' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  formGroup: { marginBottom: 20 },
  label: { display: 'block', color: '#0D1B3E', fontWeight: 600, fontSize: 14, marginBottom: 8 },
  input: {
    width: '100%', padding: '12px 16px',
    border: '1.5px solid #E8ECF4', borderRadius: 10,
    fontSize: 15, color: '#0D1B3E', background: '#F8F9FD',
    transition: 'all 0.2s', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  textarea: {
    width: '100%', padding: '12px 16px',
    border: '1.5px solid #E8ECF4', borderRadius: 10,
    fontSize: 15, color: '#0D1B3E', background: '#F8F9FD',
    transition: 'all 0.2s', boxSizing: 'border-box',
    resize: 'vertical', fontFamily: 'inherit',
  },
  submitBtn: {
    width: '100%', padding: 15,
    background: 'linear-gradient(135deg, #4361EE, #2541C4)',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.3s',
  },
};