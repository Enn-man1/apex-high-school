// src/pages/admin/ManageTeachers.js
import React, { useState, useEffect } from 'react';
import {
    collection, addDoc, getDocs, deleteDoc,
    doc, serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';
import { auth, db, secondaryAuth } from '../../config/firebase';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const SUBJECTS = ['Mathematics', 'English Language', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Economics', 'Further Maths', 'Computer Science'];
const EMPTY = { name: '', email: '', password: '', phone: '', subject: '', qualification: '' };

export default function ManageTeachers() {
    const [teachers, setTeachers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);

    const load = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'teachers'));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTeachers(data);
        } catch (e) { toast.error('Failed to load teachers'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        if (!search) return setFiltered(teachers);
        const q = search.toLowerCase();
        setFiltered(teachers.filter(t =>
            t.name?.toLowerCase().includes(q) ||
            t.subject?.toLowerCase().includes(q) ||
            t.email?.toLowerCase().includes(q)
        ));
    }, [search, teachers]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password || !form.subject) {
            toast.error('Name, email, password and subject are required.');
            return;
        }
        setSaving(true);
        try {
            const cred = await createUserWithEmailAndPassword(
                secondaryAuth,           // ← changed from auth
                form.email.trim(),
                form.password
            );
            await setDoc(doc(db, 'users', cred.user.uid), {
                uid: cred.user.uid, email: form.email, name: form.name,
                role: 'teacher', subject: form.subject,
                createdAt: serverTimestamp(),
            });
            await addDoc(collection(db, 'teachers'), {
                uid: cred.user.uid, name: form.name, email: form.email,
                phone: form.phone, subject: form.subject,
                qualification: form.qualification, status: 'active',
                createdAt: serverTimestamp(),
            });
            toast.success(`${form.name} added as a teacher!`);
            setShowForm(false);
            setForm(EMPTY);
            load();
        } catch (e) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async (teacher) => {
        if (!window.confirm(`Remove ${teacher.name}?`)) return;
        try {
            await deleteDoc(doc(db, 'teachers', teacher.id));
            toast.success('Teacher removed.');
            load();
        } catch (e) { toast.error(e.message); }
    };

    const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const SUBJECT_COLORS = {
        'Mathematics': '#4361EE', 'English Language': '#2A9D8F', 'Biology': '#27AE60',
        'Chemistry': '#E63946', 'Physics': '#F5A623', 'History': '#6F42C1',
        'Geography': '#E84393', 'Economics': '#20C997', 'Further Maths': '#3498DB',
        'Computer Science': '#0D1B3E',
    };

    return (
        <Layout title="Manage Teachers" subtitle={`${teachers.length} teachers on staff`}>

            {/* Toolbar */}
            <div style={s.toolbar}>
                <div style={s.searchWrap}>
                    <span style={{ fontSize: 16, color: '#8896AB' }}>🔍</span>
                    <input
                        type="text" placeholder="Search name, subject or email..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={s.searchInput}
                    />
                </div>
                <button
                    style={s.addBtn}
                    onClick={() => setShowForm(true)}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    + Add Teacher
                </button>
            </div>

            {/* Teacher Cards Grid */}
            {loading ? (
                <div style={s.skeletonGrid}>
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={s.skeletonCard} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div style={s.empty}>
                    <div style={s.emptyIcon}>📚</div>
                    <div style={s.emptyTitle}>{search ? 'No teachers match your search' : 'No teachers yet'}</div>
                    <div style={s.emptySub}>Click "+ Add Teacher" to add your first teacher</div>
                </div>
            ) : (
                <div style={s.teacherGrid}>
                    {filtered.map((teacher, i) => {
                        const color = SUBJECT_COLORS[teacher.subject] || '#4361EE';
                        return (
                            <div
                                key={teacher.id}
                                style={s.teacherCard}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-6px)';
                                    e.currentTarget.style.boxShadow = `0 20px 40px ${color}20`;
                                    e.currentTarget.style.borderColor = color;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(13,27,62,0.06)';
                                    e.currentTarget.style.borderColor = '#E8ECF4';
                                }}
                            >
                                {/* Top accent */}
                                <div style={{ ...s.cardAccent, background: color }} />

                                <div style={s.teacherCardBody}>
                                    {/* Avatar */}
                                    <div style={{ ...s.teacherAvatar, background: color + '20', color }}>
                                        {teacher.name?.charAt(0)?.toUpperCase()}
                                    </div>

                                    <div style={s.teacherName}>{teacher.name}</div>
                                    <div style={{ ...s.subjectBadge, background: color + '18', color }}>
                                        {teacher.subject || 'No subject'}
                                    </div>
                                    <div style={s.teacherEmail}>{teacher.email}</div>
                                    {teacher.qualification && (
                                        <div style={s.teacherQual}>{teacher.qualification}</div>
                                    )}
                                    {teacher.phone && (
                                        <div style={s.teacherPhone}>📞 {teacher.phone}</div>
                                    )}

                                    <div style={s.teacherActions}>
                                        <div style={{ ...s.activeBadge }}>✓ Active</div>
                                        <button
                                            style={s.removeBtn}
                                            onClick={() => handleDelete(teacher)}
                                            onMouseEnter={e => e.currentTarget.style.background = '#FFF0F0'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Teacher Modal */}
            {showForm && (
                <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div style={s.modal}>
                        <div style={s.modalHeader}>
                            <h2 style={s.modalTitle}>Add New Teacher</h2>
                            <button style={s.modalClose} onClick={() => { setShowForm(false); setForm(EMPTY); }}>✕</button>
                        </div>
                        <div style={s.modalBody}>
                            <form onSubmit={handleAdd}>

                                <div style={s.formSection}>Personal Information</div>
                                <div style={s.formGrid}>
                                    {[
                                        { label: 'Full Name *', key: 'name', placeholder: 'Teacher full name', type: 'text' },
                                        { label: 'Phone', key: 'phone', placeholder: 'Phone number', type: 'tel' },
                                        { label: 'Qualification', key: 'qualification', placeholder: 'e.g. B.Sc, PGDE', type: 'text' },
                                    ].map(f => (
                                        <div key={f.key} style={s.formGroup}>
                                            <label style={s.flabel}>{f.label.toUpperCase()}</label>
                                            <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                                                onChange={e => F(f.key, e.target.value)} style={s.input}
                                                onFocus={e => { e.target.style.borderColor = '#2A9D8F'; e.target.style.boxShadow = '0 0 0 3px #2A9D8F18'; }}
                                                onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div style={s.formSection}>Subject</div>
                                <div style={s.subjectGrid}>
                                    {SUBJECTS.map(sub => {
                                        const c = SUBJECT_COLORS[sub] || '#4361EE';
                                        return (
                                            <button key={sub} type="button"
                                                style={{
                                                    ...s.subjectBtn,
                                                    borderColor: form.subject === sub ? c : '#E8ECF4',
                                                    background: form.subject === sub ? c + '15' : '#F8F9FD',
                                                    color: form.subject === sub ? c : '#8896AB',
                                                }}
                                                onClick={() => F('subject', sub)}
                                            >
                                                {sub}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div style={s.formSection}>Login Credentials</div>
                                <div style={s.formGrid}>
                                    {[
                                        { label: 'Email *', key: 'email', placeholder: 'teacher@apexhs.edu', type: 'email' },
                                        { label: 'Password *', key: 'password', placeholder: 'Set a password', type: 'password' },
                                    ].map(f => (
                                        <div key={f.key} style={s.formGroup}>
                                            <label style={s.flabel}>{f.label.toUpperCase()}</label>
                                            <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                                                onChange={e => F(f.key, e.target.value)} style={s.input}
                                                autoComplete="new-password"
                                                onFocus={e => { e.target.style.borderColor = '#2A9D8F'; e.target.style.boxShadow = '0 0 0 3px #2A9D8F18'; }}
                                                onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div style={s.modalFooter}>
                                    <button type="button" style={s.cancelBtn} onClick={() => { setShowForm(false); setForm(EMPTY); }}>
                                        Cancel
                                    </button>
                                    <button type="submit" style={{ ...s.submitBtn, background: 'linear-gradient(135deg,#2A9D8F,#1A6B64)' }} disabled={saving}>
                                        {saving ? 'Adding...' : '✅ Add Teacher'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

const s = {
    toolbar: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
    searchWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid #E8ECF4', borderRadius: 10, padding: '0 14px', height: 44 },
    searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0D1B3E', background: 'transparent', fontFamily: 'inherit' },
    addBtn: { padding: '10px 22px', background: 'linear-gradient(135deg,#2A9D8F,#1A6B64)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(42,157,143,0.3)' },

    skeletonGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 },
    skeletonCard: { height: 220, borderRadius: 16, background: 'linear-gradient(90deg,#F0F3FA 25%,#E8ECF4 50%,#F0F3FA 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' },

    teacherGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 },
    teacherCard: { background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1.5px solid #E8ECF4', boxShadow: '0 2px 12px rgba(13,27,62,0.06)', transition: 'all 0.3s ease', cursor: 'default' },
    cardAccent: { height: 5 },
    teacherCardBody: { padding: 24, textAlign: 'center' },
    teacherAvatar: { width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, margin: '0 auto 14px' },
    teacherName: { fontSize: 16, fontWeight: 800, color: '#0D1B3E', marginBottom: 8 },
    subjectBadge: { display: 'inline-block', fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20, marginBottom: 10 },
    teacherEmail: { fontSize: 13, color: '#8896AB', marginBottom: 6 },
    teacherQual: { fontSize: 12, color: '#8896AB', marginBottom: 4 },
    teacherPhone: { fontSize: 12, color: '#8896AB', marginBottom: 16 },
    teacherActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #E8ECF4' },
    activeBadge: { background: '#F0FAF4', color: '#27AE60', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20 },
    removeBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px', borderRadius: 8, transition: 'all 0.2s' },

    empty: { textAlign: 'center', padding: '80px 20px' },
    emptyIcon: { fontSize: 52, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: 700, color: '#0D1B3E', marginBottom: 8 },
    emptySub: { color: '#8896AB', fontSize: 14 },

    overlay: { position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)' },
    modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid #E8ECF4' },
    modalTitle: { fontSize: 20, fontWeight: 900, color: '#0D1B3E', margin: 0 },
    modalClose: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8896AB', padding: 4 },
    modalBody: { overflowY: 'auto', padding: '24px 32px', flex: 1 },
    formSection: { fontSize: 13, fontWeight: 700, color: '#2A9D8F', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 24, marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #E8ECF4' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    formGroup: { marginBottom: 16 },
    flabel: { display: 'block', fontSize: 11, fontWeight: 700, color: '#8896AB', letterSpacing: 1.5, marginBottom: 6 },
    input: { width: '100%', height: 46, padding: '0 14px', border: '1.5px solid #E8ECF4', borderRadius: 10, fontSize: 14, color: '#0D1B3E', background: '#F8F9FD', transition: 'all 0.2s', boxSizing: 'border-box', fontFamily: 'inherit' },
    subjectGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    subjectBtn: { padding: '8px 14px', borderRadius: 8, border: '1.5px solid', background: '#F8F9FD', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
    cancelBtn: { padding: '12px 24px', border: '1.5px solid #E8ECF4', borderRadius: 10, background: '#fff', fontSize: 14, fontWeight: 600, color: '#8896AB', cursor: 'pointer', fontFamily: 'inherit' },
    submitBtn: { padding: '12px 28px', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },
};