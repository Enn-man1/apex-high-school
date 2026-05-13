// src/pages/shared/ProfilePage.js
import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  admin:   { color:'#E63946', gradient:'linear-gradient(135deg,#E63946,#C0392B)', icon:'⚙️',  label:'Administrator' },
  teacher: { color:'#2A9D8F', gradient:'linear-gradient(135deg,#2A9D8F,#1A6B64)', icon:'📚', label:'Teacher' },
  student: { color:'#4361EE', gradient:'linear-gradient(135deg,#4361EE,#2541C4)', icon:'🎓', label:'Student' },
  parent:  { color:'#7B2D8B', gradient:'linear-gradient(135deg,#7B2D8B,#5A1F66)', icon:'👨‍👩‍👧', label:'Parent' },
};

export default function ProfilePage() {
  const { profile } = useAuth();
  const rc = ROLE_CONFIG[profile?.role] || ROLE_CONFIG.student;

  const [editMode,     setEditMode]     = useState(false);
  const [showPassForm, setShowPassForm] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [form, setForm] = useState({
    name:       profile?.name       || '',
    phone:      profile?.phone      || '',
    address:    profile?.address    || '',
    bio:        profile?.bio        || '',
    subject:    profile?.subject    || '',
    className:  profile?.className  || '',
    admissionNo:profile?.admissionNo|| '',
    parentName: profile?.parentName || '',
    childName:  profile?.childName  || '',
  });
  const [passForm, setPassForm] = useState({
    current: '', newPass: '', confirm: '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const uid = profile?.uid || profile?.id;
      await updateDoc(doc(db,'users', uid), {
        name:    form.name,
        phone:   form.phone,
        address: form.address,
        bio:     form.bio,
      });
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPass !== passForm.confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passForm.newPass.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, passForm.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passForm.newPass);
      toast.success('Password updated successfully!');
      setShowPassForm(false);
      setPassForm({ current:'', newPass:'', confirm:'' });
    } catch (e) {
      if (e.code === 'auth/wrong-password') toast.error('Current password is incorrect.');
      else toast.error(e.message);
    }
    finally { setSaving(false); }
  };

  const INFO_ROWS = [
    { icon:'✉️', label:'Email',          value:profile?.email },
    { icon:'👤', label:'Role',           value:rc.label },
    { icon:'📞', label:'Phone',          value:profile?.phone || 'Not set' },
    { icon:'📍', label:'Address',        value:profile?.address || 'Not set' },
    ...(profile?.role === 'student' ? [
      { icon:'🏫', label:'Class',         value:profile?.className || 'Not assigned' },
      { icon:'🆔', label:'Admission No',  value:profile?.admissionNo || 'Not set' },
    ] : []),
    ...(profile?.role === 'teacher' ? [
      { icon:'📚', label:'Subject',       value:profile?.subject || 'Not set' },
    ] : []),
    ...(profile?.role === 'parent' ? [
      { icon:'🎓', label:"Child's Name",  value:profile?.childName || 'Not set' },
    ] : []),
  ];

  return (
    <Layout title="My Profile" subtitle="Manage your account details">
      <div style={s.wrapper}>

        {/* Left — Profile Card */}
        <div style={s.leftCol}>

          {/* Avatar Card */}
          <div style={s.avatarCard}>
            <div style={{ ...s.avatarCardBg, background: rc.gradient }} />
            <div style={s.avatarCardContent}>
              <div style={{ ...s.avatar, background: rc.color + '30', border: `3px solid ${rc.color}` }}>
                <span style={{ fontSize: 52 }}>{rc.icon}</span>
              </div>
              <div style={s.avatarName}>{profile?.name || '—'}</div>
              <div style={{ ...s.avatarRole, background: rc.color + '20', color: rc.color }}>
                {rc.label}
              </div>
              {profile?.bio && (
                <p style={s.avatarBio}>{profile.bio}</p>
              )}
              <button
                style={{ ...s.editBtn, borderColor: rc.color, color: rc.color }}
                onClick={() => setEditMode(!editMode)}
                onMouseEnter={e => { e.currentTarget.style.background = rc.color; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = rc.color; }}
              >
                {editMode ? '✕ Cancel Edit' : '✏️ Edit Profile'}
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div style={s.infoCard}>
            <div style={s.infoTitle}>Account Info</div>
            {INFO_ROWS.map((row, i) => (
              <div key={i} style={{ ...s.infoRow, borderTop: i > 0 ? '1px solid #F0F3FA' : 'none' }}>
                <span style={s.infoIcon}>{row.icon}</span>
                <div style={s.infoContent}>
                  <div style={s.infoLabel}>{row.label}</div>
                  <div style={s.infoValue}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Edit / Details */}
        <div style={s.rightCol}>

          {/* Edit Form */}
          {editMode && (
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Edit Profile</h3>
                <button style={{ ...s.saveBtn, background: rc.gradient }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
              <div style={s.formGrid}>
                {[
                  { label:'Full Name',  key:'name',    placeholder:'Your full name',   type:'text' },
                  { label:'Phone',      key:'phone',   placeholder:'Phone number',     type:'tel' },
                  { label:'Address',    key:'address', placeholder:'Your address',     type:'text' },
                ].map(f => (
                  <div key={f.key} style={s.formGroup}>
                    <label style={s.label}>{f.label.toUpperCase()}</label>
                    <input type={f.type} placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={s.input}
                      onFocus={e => { e.target.style.borderColor = rc.color; e.target.style.boxShadow = `0 0 0 3px ${rc.color}18`; }}
                      onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                ))}
                <div style={{ ...s.formGroup, gridColumn:'1/-1' }}>
                  <label style={s.label}>BIO</label>
                  <textarea placeholder="Tell us about yourself..."
                    value={form.bio} rows={3}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    style={s.textarea}
                    onFocus={e => { e.target.style.borderColor = rc.color; e.target.style.boxShadow = `0 0 0 3px ${rc.color}18`; }}
                    onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Card */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <h3 style={s.cardTitle}>🔐 Security</h3>
              <button
                style={s.changePassBtn}
                onClick={() => setShowPassForm(!showPassForm)}
              >
                {showPassForm ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {!showPassForm ? (
              <div style={s.securityInfo}>
                <div style={s.securityItem}>
                  <div style={s.securityIcon}>🔒</div>
                  <div>
                    <div style={s.securityLabel}>Password</div>
                    <div style={s.securityValue}>••••••••</div>
                  </div>
                </div>
                <div style={s.securityItem}>
                  <div style={s.securityIcon}>✉️</div>
                  <div>
                    <div style={s.securityLabel}>Email</div>
                    <div style={s.securityValue}>{profile?.email || '—'}</div>
                  </div>
                </div>
                <div style={s.securityItem}>
                  <div style={s.securityIcon}>✅</div>
                  <div>
                    <div style={s.securityLabel}>Account Status</div>
                    <div style={{ ...s.securityValue, color: '#27AE60', fontWeight: 700 }}>Active</div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleChangePassword}>
                {[
                  { label:'Current Password', key:'current', placeholder:'Enter current password' },
                  { label:'New Password',      key:'newPass', placeholder:'Enter new password' },
                  { label:'Confirm Password',  key:'confirm', placeholder:'Confirm new password' },
                ].map(f => (
                  <div key={f.key} style={s.formGroup}>
                    <label style={s.label}>{f.label.toUpperCase()}</label>
                    <input type="password" placeholder={f.placeholder}
                      value={passForm[f.key]}
                      onChange={e => setPassForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={s.input}
                      onFocus={e => { e.target.style.borderColor = rc.color; e.target.style.boxShadow = `0 0 0 3px ${rc.color}18`; }}
                      onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                ))}
                <button type="submit" style={{ ...s.saveBtn, background: rc.gradient }} disabled={saving}>
                  {saving ? 'Updating...' : '🔐 Update Password'}
                </button>
              </form>
            )}
          </div>

          {/* Activity Summary */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>Account Summary</h3>
            <div style={s.activityGrid}>
              {[
                { icon: rc.icon, label: 'Role', value: rc.label, color: rc.color },
                { icon: '📅', label: 'Member Since', value: profile?.createdAt?.seconds ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }) : 'Recently', color: '#4361EE' },
                { icon: '🔑', label: 'Login Method', value: 'Email & Password', color: '#27AE60' },
                { icon: '🛡️', label: 'Security', value: 'Protected', color: '#F5A623' },
              ].map((item, i) => (
                <div key={i} style={{ ...s.activityItem, borderColor: item.color + '30' }}>
                  <div style={{ ...s.activityIcon, background: item.color + '15' }}>
                    {item.icon}
                  </div>
                  <div style={s.activityLabel}>{item.label}</div>
                  <div style={{ ...s.activityValue, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </Layout>
  );
}

const s = {
  wrapper:  { display:'grid', gridTemplateColumns:'320px 1fr', gap:24, alignItems:'flex-start' },
  leftCol:  { display:'flex', flexDirection:'column', gap:20 },
  rightCol: { display:'flex', flexDirection:'column', gap:20 },

  avatarCard:        { background:'#fff', borderRadius:20, overflow:'hidden', border:'1px solid #E8ECF4', boxShadow:'0 4px 20px rgba(13,27,62,0.08)' },
  avatarCardBg:      { height:80 },
  avatarCardContent: { padding:'0 24px 28px', textAlign:'center', marginTop:-40 },
  avatar:            { width:80, height:80, borderRadius:22, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', background:'#F0F3FA' },
  avatarName:        { fontSize:20, fontWeight:900, color:'#0D1B3E', marginBottom:8 },
  avatarRole:        { display:'inline-block', fontSize:12, fontWeight:700, padding:'4px 14px', borderRadius:20, marginBottom:12 },
  avatarBio:         { fontSize:13, color:'#8896AB', lineHeight:1.6, marginBottom:16 },
  editBtn:           { border:'1.5px solid', background:'transparent', padding:'9px 24px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },

  infoCard:    { background:'#fff', borderRadius:16, padding:'20px', border:'1px solid #E8ECF4', boxShadow:'0 2px 12px rgba(13,27,62,0.06)' },
  infoTitle:   { fontSize:14, fontWeight:800, color:'#0D1B3E', marginBottom:14, paddingBottom:10, borderBottom:'2px solid #E8ECF4' },
  infoRow:     { display:'flex', alignItems:'center', gap:12, padding:'10px 0' },
  infoIcon:    { fontSize:18, width:28, textAlign:'center', flexShrink:0 },
  infoContent: {},
  infoLabel:   { fontSize:11, color:'#8896AB', fontWeight:600, letterSpacing:0.5, textTransform:'uppercase' },
  infoValue:   { fontSize:14, fontWeight:600, color:'#0D1B3E', marginTop:2 },

  card:       { background:'#fff', borderRadius:16, padding:24, border:'1px solid #E8ECF4', boxShadow:'0 2px 12px rgba(13,27,62,0.06)' },
  cardHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  cardTitle:  { fontSize:16, fontWeight:800, color:'#0D1B3E', margin:0 },
  saveBtn:    { color:'#fff', border:'none', padding:'10px 22px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
  changePassBtn:{ background:'none', border:'1.5px solid #E8ECF4', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:600, color:'#8896AB', cursor:'pointer', fontFamily:'inherit' },

  formGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  formGroup: { marginBottom:16 },
  label:     { display:'block', fontSize:11, fontWeight:700, color:'#8896AB', letterSpacing:1.5, marginBottom:8 },
  input:     { width:'100%', height:46, padding:'0 14px', border:'1.5px solid #E8ECF4', borderRadius:10, fontSize:14, color:'#0D1B3E', background:'#F8F9FD', transition:'all 0.2s', boxSizing:'border-box', fontFamily:'inherit' },
  textarea:  { width:'100%', padding:'12px 14px', border:'1.5px solid #E8ECF4', borderRadius:10, fontSize:14, color:'#0D1B3E', background:'#F8F9FD', transition:'all 0.2s', boxSizing:'border-box', fontFamily:'inherit', resize:'vertical' },

  securityInfo: { display:'flex', flexDirection:'column', gap:0 },
  securityItem: { display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:'1px solid #F0F3FA' },
  securityIcon: { fontSize:22, width:36, textAlign:'center', flexShrink:0 },
  securityLabel:{ fontSize:12, color:'#8896AB', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:2 },
  securityValue:{ fontSize:14, fontWeight:600, color:'#0D1B3E' },

  activityGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:16 },
  activityItem: { border:'1.5px solid', borderRadius:12, padding:'16px', textAlign:'center', transition:'all 0.2s' },
  activityIcon: { fontSize:28, width:52, height:52, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' },
  activityLabel:{ fontSize:11, color:'#8896AB', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 },
  activityValue:{ fontSize:14, fontWeight:800 },
};