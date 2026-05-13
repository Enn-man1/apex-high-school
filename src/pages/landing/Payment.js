import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const METHODS = [
  { icon: '💳', label: 'Debit Card',    desc: 'Visa, Mastercard, Verve' },
  { icon: '🏦', label: 'Bank Transfer', desc: 'Direct bank payment' },
  { icon: '📱', label: 'USSD',          desc: '*737# and more' },
  { icon: '📲', label: 'Mobile Money',  desc: 'MTN, Airtel, Glo' },
];

export default function Payment() {
  const navigate = useNavigate();

  return (
    <section style={s.section}>
      <div style={s.grid}>

        {/* LEFT CONTENT — Info & Methods */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={s.left}
        >
          <div style={s.badge}>Online Payments</div>
          <h2 style={s.title}>
            Pay School Fees<br />
            <span style={s.accent}>Securely Online</span>
          </h2>
          <p style={s.text}>
            No more queuing at the school office. Pay tuition, exam fees and levies
            securely from anywhere using Flutterwave's trusted payment gateway.
          </p>

          <div style={s.methods}>
            {METHODS.map((m, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 8, borderColor: '#6F42C1', backgroundColor: '#F5F0FF' }}
                style={s.method}
              >
                <div style={s.methodIcon}>{m.icon}</div>
                <div>
                  <div style={s.methodLabel}>{m.label}</div>
                  <div style={s.methodDesc}>{m.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div style={s.security}>
            <span>🔒</span>
            <span>Secured by Flutterwave · SSL Encrypted · PCI DSS Compliant</span>
          </div>
        </motion.div>

        {/* RIGHT CONTENT — Interactive Mock Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={s.right}
        >
          {/* Main Payment Card */}
          <motion.div 
            whileHover={{ y: -5, rotateX: 2, rotateY: -2 }}
            style={s.card}
          >
            <div style={s.cardHeader}>
              <div>
                <div style={s.cardSchool}>Heritage Modern Schools</div>
                <div style={s.cardTitle2}>Fee Payment Portal</div>
              </div>
              <span style={{ fontSize: 40 }}>🏫</span>
            </div>

            <div style={s.cardBody}>
              {[
                { label: 'Student',  value: 'Chidera Okafor' },
                { label: 'Fee Type', value: 'Third Term Tuition' },
                { label: 'Class',    value: 'Grade 10A' },
                { label: 'Session',  value: '2024/2025' },
              ].map((r, i) => (
                <div key={i} style={s.row}>
                  <span style={s.rowLabel}>{r.label}</span>
                  <span style={s.rowValue}>{r.value}</span>
                </div>
              ))}
              <div style={s.divider} />
              <div style={s.totalRow}>
                <span style={s.totalLabel}>Total Amount</span>
                <span style={s.totalAmount}>₦150,000</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 12px 30px rgba(111,66,193,0.4)' }}
              whileTap={{ scale: 0.98 }}
              style={s.payBtn}
              onClick={() => navigate('/login')}
            >
              💳 Pay Now with Flutterwave
            </motion.button>
            <div style={s.secure}>🔒 256-bit SSL secured transaction</div>
          </motion.div>

          {/* Floating Success Badge */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={s.successBadge}
          >
            <span>✅</span>
            <span>Payment Successful!</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

const s = {
  section: { padding: '100px 5%', background: '#F8F9FD', overflow: 'hidden' },
  grid: {
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '60px', maxWidth: 1200, margin: '0 auto', alignItems: 'center',
  },
  left:  {},
  badge: {
    display: 'inline-block',
    background: 'rgba(111,66,193,0.1)', color: '#6F42C1',
    padding: '6px 18px', borderRadius: 100,
    fontSize: 13, fontWeight: 600, marginBottom: 16,
  },
  title:  { fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 900, color: '#0D1B3E', lineHeight: 1.2, marginBottom: 16 },
  accent: { color: '#6F42C1' },
  text:   { color: '#4A5568', lineHeight: 1.8, fontSize: 16, marginBottom: 28 },
  methods:{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 },
  method: {
    display: 'flex', alignItems: 'center', gap: 16,
    background: '#fff', borderRadius: 12,
    padding: '14px 20px',
    border: '1.5px solid #E8ECF4',
    cursor: 'pointer',
    transition: 'border-color 0.2s', 
  },
  methodIcon:  { fontSize: 28, width: 44, textAlign: 'center', flexShrink: 0 },
  methodLabel: { fontWeight: 700, color: '#0D1B3E', fontSize: 15 },
  methodDesc:  { color: '#8896AB', fontSize: 13 },
  security: {
    display: 'flex', alignItems: 'center', gap: 8,
    color: '#8896AB', fontSize: 13,
    background: '#EEF2FF', padding: '10px 16px', borderRadius: 8,
    width: 'fit-content'
  },

  right:    { position: 'relative', perspective: '1000px' },
  card: {
    background: '#fff', borderRadius: 24, padding: 32,
    boxShadow: '0 20px 60px rgba(13,27,62,0.12)',
    border: '1.5px solid #E8ECF4',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
    paddingBottom: 20,
    borderBottom: '2px solid #F0F3FA',
  },
  cardSchool: { color: '#8896AB', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' },
  cardTitle2: { color: '#0D1B3E', fontSize: 18, fontWeight: 800, marginTop: 4 },
  cardBody:   { marginBottom: 24 },
  row:        { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F0F3FA' },
  rowLabel:   { color: '#8896AB', fontSize: 14 },
  rowValue:   { color: '#0D1B3E', fontSize: 14, fontWeight: 600 },
  divider:    { height: 2, background: '#F0F3FA', margin: '12px 0' },
  totalRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' },
  totalLabel: { color: '#0D1B3E', fontWeight: 600, fontSize: 16 },
  totalAmount:{ fontSize: 30, fontWeight: 900, color: '#6F42C1' },
  payBtn: {
    width: '100%', padding: 16,
    background: 'linear-gradient(135deg, #6F42C1, #5A1F9E)',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.3s', marginBottom: 12,
  },
  secure: { textAlign: 'center', color: '#8896AB', fontSize: 12 },
  successBadge: {
    position: 'absolute', top: -16, right: -16,
    background: 'linear-gradient(135deg, #27AE60, #1E8449)',
    color: '#fff', borderRadius: 12,
    padding: '10px 16px',
    display: 'flex', alignItems: 'center', gap: 8,
    fontWeight: 700, fontSize: 14,
    boxShadow: '0 8px 20px rgba(39,174,96,0.3)',
    zIndex: 10,
  },
};