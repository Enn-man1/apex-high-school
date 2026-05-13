// src/pages/admin/ManageStudents.js
import React, { useState, useEffect } from 'react';
import {
    collection, addDoc, getDocs, deleteDoc,
    doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, secondaryAuth } from '../../config/firebase';
import { setDoc } from 'firebase/firestore';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import ProfilePhoto from '../../components/ProfilePhoto';

const EMPTY = {
    name: '', email: '', password: '', phone: '',
    className: '', admissionNo: '', gender: 'Male',
    parentName: '', parentPhone: '', address: '',
    parentPassword: '', address: '',
    createParentAccount: false,
};

const CLASSES = ['Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 11B', 'Grade 12A', 'Grade 12B'];

export default function ManageStudents() {
    const [students, setStudents] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [selClass, setSelClass] = useState('All');

    const load = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'students'), orderBy('createdAt', 'desc')));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setStudents(data);
        } catch (e) { toast.error('Failed to load students'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        let data = students;
        if (selClass !== 'All') data = data.filter(s => s.className === selClass);
        if (search) {
            const q = search.toLowerCase();
            data = data.filter(s =>
                s.name?.toLowerCase().includes(q) ||
                s.admissionNo?.toLowerCase().includes(q) ||
                s.email?.toLowerCase().includes(q)
            );
        }
        setFiltered(data);
    }, [search, students, selClass]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password || !form.className) {
            toast.error('Name, email, password and class are required.');
            return;
        }
        setSaving(true);
        try {
            // ── Create student Firebase Auth account ──
            // ── Create student account using secondaryAuth ──
            const studentCred = await createUserWithEmailAndPassword(
                secondaryAuth,           // ← changed from auth
                form.email.trim(),
                form.password
            );

            // ── Save student to users collection ──
            await setDoc(doc(db, 'users', studentCred.user.uid), {
                uid: studentCred.user.uid,
                email: form.email,
                name: form.name,
                role: 'student',
                className: form.className,
                admissionNo: form.admissionNo,
                phone: form.phone,
                address: form.address,
                createdAt: serverTimestamp(),
            });

            // ── Save to students collection ──
            await addDoc(collection(db, 'students'), {
                uid: studentCred.user.uid,
                name: form.name,
                email: form.email,
                phone: form.phone,
                className: form.className,
                admissionNo: form.admissionNo,
                gender: form.gender,
                parentName: form.parentName,
                parentPhone: form.parentPhone,
                address: form.address,
                status: 'active',
                createdAt: serverTimestamp(),
            });

            // ── Create parent account if requested ──
            if (form.createParentAccount && form.parentEmail && form.parentPassword) {
                // Save current user so we can switch back
                // ── Create parent account using secondaryAuth ──
                const parentCred = await createUserWithEmailAndPassword(
                    secondaryAuth,           // ← changed from auth
                    form.parentEmail.trim(),
                    form.parentPassword
                );

                await setDoc(doc(db, 'users', parentCred.user.uid), {
                    uid: parentCred.user.uid,
                    email: form.parentEmail,
                    name: form.parentName || `Parent of ${form.name}`,
                    role: 'parent',
                    phone: form.parentPhone,
                    // ── The key link fields ──
                    childUid: studentCred.user.uid,
                    childName: form.name,
                    childClass: form.className,
                    childAdmissionNo: form.admissionNo,
                    childEmail: form.email,
                    createdAt: serverTimestamp(),
                });

                toast.success(`✅ ${form.name} + parent account created!`);
            } else {
                toast.success(`✅ ${form.name} added successfully!`);
            }

            setShowForm(false);
            setForm(EMPTY);
            load();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (student) => {
        if (!window.confirm(`Remove ${student.name}? This cannot be undone.`)) return;
        try {
            await deleteDoc(doc(db, 'students', student.id));
            toast.success('Student removed.');
            load();
        } catch (e) { toast.error(e.message); }
    };

    const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <Layout title="Manage Students" subtitle={`${students.length} students enrolled`}>

            {/* Toolbar */}
            <div style={s.toolbar}>
                <div style={s.searchWrap}>
                    <span style={s.searchIcon}>🔍</span>
                    <input
                        type="text" placeholder="Search name, admission no, email..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={s.searchInput}
                    />
                    {search && (
                        <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
                    )}
                </div>

                {/* Class filter */}
                <div style={s.classFilter}>
                    {['All', ...CLASSES].map(c => (
                        <button key={c}
                            style={{ ...s.filterChip, ...(selClass === c ? s.filterChipActive : {}) }}
                            onClick={() => setSelClass(c)}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                <button
                    style={s.addBtn}
                    onClick={() => setShowForm(true)}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    + Add Student
                </button>
            </div>

            {/* Stats strip */}
            <div style={s.statsStrip}>
                {['All', ...CLASSES].map(c => {
                    const count = c === 'All' ? students.length : students.filter(s => s.className === c).length;
                    return (
                        <div key={c} style={s.stripItem}>
                            <div style={s.stripValue}>{count}</div>
                            <div style={s.stripLabel}>{c}</div>
                        </div>
                    );
                })}
            </div>

            {/* Table */}
            <div style={s.tableCard}>
                {/* Header */}
                <div style={s.tableHeader}>
                    <div style={{ flex: 2 }}>Student</div>
                    <div>Admission No</div>
                    <div>Class</div>
                    <div>Parent</div>
                    <div>Phone</div>
                    <div>Status</div>
                    <div style={{ textAlign: 'right' }}>Actions</div>
                </div>

                {loading ? (
                    <div style={s.loadingWrap}>
                        {[1, 2, 3, 4, 5].map(i => <div key={i} style={s.skeleton} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={s.empty}>
                        <div style={s.emptyIcon}>🎓</div>
                        <div style={s.emptyTitle}>
                            {search ? 'No students match your search' : 'No students yet'}
                        </div>
                        <div style={s.emptySub}>
                            {!search && 'Click "+ Add Student" to enroll your first student'}
                        </div>
                    </div>
                ) : (
                    filtered.map((student, i) => (
                        <div
                            key={student.id}
                            style={{ ...s.tableRow, background: i % 2 === 0 ? '#fff' : '#F8F9FD' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#EEF2FF'}
                            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F8F9FD'}
                        >
                            {/* Student info */}
                            <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                                {/* Replace the plain avatar div with this */}
                                <ProfilePhoto
                                    uid={student.uid}
                                    name={student.name}
                                    photoURL={student.photoURL}
                                    role="student"
                                    size={44}
                                    editable={false}
                                />
                                <div style={{ ...s.avatar, background: `hsl(${(i * 40) % 360}, 70%, 60%)` }}>
                                    {student.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                    <div style={s.studentName}>{student.name}</div>
                                    <div style={s.studentEmail}>{student.email}</div>
                                </div>
                            </div>
                            <div style={s.cell}>{student.admissionNo || '—'}</div>
                            <div style={s.cell}>
                                <span style={{ ...s.classBadge }}>
                                    {student.className || '—'}
                                </span>
                            </div>
                            <div style={s.cell}>{student.parentName || '—'}</div>
                            <div style={s.cell}>{student.phone || '—'}</div>
                            <div style={s.cell}>
                                <span style={{ ...s.statusBadge, background: '#F0FAF4', color: '#27AE60' }}>
                                    Active
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <button
                                    style={s.deleteBtn}
                                    onClick={() => handleDelete(student)}
                                    onMouseEnter={e => e.currentTarget.style.background = '#FFF0F0'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    🗑 Remove
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>



            {/* Add Student Modal */}
            {showForm && (
                <div style={s.modalOverlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div style={s.modal}>
                        <div style={s.modalHeader}>
                            <h2 style={s.modalTitle}>Add New Student</h2>
                            <button style={s.modalClose} onClick={() => { setShowForm(false); setForm(EMPTY); }}>✕</button>
                        </div>
                        <div style={s.modalBody}>
                            <form onSubmit={handleAdd}>

                                <div style={s.formSection}>Personal Information</div>
                                <div style={s.formGrid}>
                                    {[
                                        { label: 'Full Name *', key: 'name', placeholder: 'Student full name', type: 'text' },
                                        { label: 'Admission No', key: 'admissionNo', placeholder: 'e.g. AHS/2025/001', type: 'text' },
                                        { label: 'Phone', key: 'phone', placeholder: 'Phone number', type: 'tel' },
                                        { label: 'Address', key: 'address', placeholder: 'Home address', type: 'text' },
                                    ].map(f => (
                                        <div key={f.key} style={s.formGroup}>
                                            <label style={s.label}>{f.label.toUpperCase()}</label>
                                            <input
                                                type={f.type}
                                                placeholder={f.placeholder}
                                                value={form[f.key]}
                                                onChange={e => F(f.key, e.target.value)}
                                                style={s.input}
                                                onFocus={e => { e.target.style.borderColor = '#4361EE'; e.target.style.boxShadow = '0 0 0 3px #4361EE18'; }}
                                                onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Gender */}
                                <div style={s.formGroup}>
                                    <label style={s.label}>GENDER</label>
                                    <div style={s.genderRow}>
                                        {['Male', 'Female', 'Other'].map(g => (
                                            <button key={g} type="button"
                                                style={{ ...s.genderBtn, ...(form.gender === g ? s.genderBtnActive : {}) }}
                                                onClick={() => F('gender', g)}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={s.formSection}>Academic Information</div>
                                <div style={s.formGroup}>
                                    <label style={s.label}>CLASS *</label>
                                    <div style={s.classGrid}>
                                        {CLASSES.map(c => (
                                            <button key={c} type="button"
                                                style={{ ...s.classBtn, ...(form.className === c ? s.classBtnActive : {}) }}
                                                onClick={() => F('className', c)}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={s.formSection}>Login Credentials</div>
                                <div style={s.formGrid}>
                                    {[
                                        { label: 'Email *', key: 'email', placeholder: 'student@apexhs.edu', type: 'email' },
                                        { label: 'Password *', key: 'password', placeholder: 'Set a password', type: 'password' },
                                    ].map(f => (
                                        <div key={f.key} style={s.formGroup}>
                                            <label style={s.label}>{f.label.toUpperCase()}</label>
                                            <input
                                                type={f.type}
                                                placeholder={f.placeholder}
                                                value={form[f.key]}
                                                onChange={e => F(f.key, e.target.value)}
                                                style={s.input}
                                                autoComplete="new-password"
                                                onFocus={e => { e.target.style.borderColor = '#4361EE'; e.target.style.boxShadow = '0 0 0 3px #4361EE18'; }}
                                                onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div style={s.formSection}>Parent / Guardian</div>
                                <div style={s.formGrid}>
                                    {[
                                        { label: 'Parent Name', key: 'parentName', placeholder: 'Guardian full name', type: 'text' },
                                        { label: 'Parent Phone', key: 'parentPhone', placeholder: 'Guardian phone', type: 'tel' },
                                    ].map(f => (
                                        <div key={f.key} style={s.formGroup}>
                                            <label style={s.label}>{f.label.toUpperCase()}</label>
                                            <input
                                                type={f.type}
                                                placeholder={f.placeholder}
                                                value={form[f.key]}
                                                onChange={e => F(f.key, e.target.value)}
                                                style={s.input}
                                                onFocus={e => { e.target.style.borderColor = '#4361EE'; e.target.style.boxShadow = '0 0 0 3px #4361EE18'; }}
                                                onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Create Parent Account Toggle */}
                                <div style={{
                                    background: form.createParentAccount ? '#F0FAFA' : '#F8F9FD',
                                    border: `1.5px solid ${form.createParentAccount ? '#2A9D8F' : '#E8ECF4'}`,
                                    borderRadius: 12, padding: 16, marginTop: 8,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.createParentAccount ? 16 : 0 }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0D1B3E' }}>
                                                👨‍👩‍👧 Create Parent Portal Account
                                            </div>
                                            <div style={{ fontSize: 12, color: '#8896AB', marginTop: 2 }}>
                                                Allow the parent to log in and view this student's data
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => F('createParentAccount', !form.createParentAccount)}
                                            style={{
                                                width: 48, height: 26, borderRadius: 13,
                                                background: form.createParentAccount ? '#2A9D8F' : '#E8ECF4',
                                                border: 'none', cursor: 'pointer',
                                                position: 'relative', transition: 'all 0.3s',
                                            }}
                                        >
                                            <div style={{
                                                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                                                position: 'absolute', top: 3,
                                                left: form.createParentAccount ? 24 : 4,
                                                transition: 'all 0.3s',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                            }} />
                                        </button>
                                    </div>

                                    {form.createParentAccount && (
                                        <div style={s.formGrid}>
                                            <div style={s.formGroup}>
                                                <label style={s.label}>PARENT EMAIL *</label>
                                                <input
                                                    type="email"
                                                    placeholder="parent@email.com"
                                                    value={form.parentEmail}
                                                    onChange={e => F('parentEmail', e.target.value)}
                                                    style={s.input}
                                                    onFocus={e => { e.target.style.borderColor = '#2A9D8F'; e.target.style.boxShadow = '0 0 0 3px #2A9D8F18'; }}
                                                    onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                                                />
                                            </div>
                                            <div style={s.formGroup}>
                                                <label style={s.label}>PARENT PASSWORD *</label>
                                                <input
                                                    type="password"
                                                    placeholder="Set parent password"
                                                    value={form.parentPassword}
                                                    onChange={e => F('parentPassword', e.target.value)}
                                                    style={s.input}
                                                    autoComplete="new-password"
                                                    onFocus={e => { e.target.style.borderColor = '#2A9D8F'; e.target.style.boxShadow = '0 0 0 3px #2A9D8F18'; }}
                                                    onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={s.modalFooter}>
                                    <button type="button" style={s.cancelBtn} onClick={() => { setShowForm(false); setForm(EMPTY); }}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={s.submitBtn}
                                        disabled={saving}
                                        onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        {saving ? 'Adding...' : '✅ Add Student'}
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
    toolbar: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
    searchWrap: {
        flex: 1, minWidth: 260,
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', border: '1.5px solid #E8ECF4',
        borderRadius: 10, padding: '0 14px', height: 44,
    },
    searchIcon: { fontSize: 16, color: '#8896AB' },
    searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0D1B3E', background: 'transparent', fontFamily: 'inherit' },
    clearBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#8896AB', fontSize: 14 },

    classFilter: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    filterChip: {
        padding: '6px 14px', borderRadius: 20, border: '1.5px solid #E8ECF4',
        background: '#fff', fontSize: 13, fontWeight: 600, color: '#8896AB',
        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
    },
    filterChipActive: { borderColor: '#4361EE', background: '#EEF2FF', color: '#4361EE' },

    addBtn: {
        padding: '10px 22px', background: 'linear-gradient(135deg,#4361EE,#2541C4)',
        color: '#fff', border: 'none', borderRadius: 10,
        fontSize: 14, fontWeight: 700, cursor: 'pointer',
        whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: 'inherit',
        boxShadow: '0 4px 14px rgba(67,97,238,0.3)',
    },

    statsStrip: {
        display: 'flex', gap: 12, marginBottom: 20,
        background: '#fff', borderRadius: 12, padding: '16px 20px',
        border: '1px solid #E8ECF4', flexWrap: 'wrap',
    },
    stripItem: { textAlign: 'center', minWidth: 60 },
    stripValue: { fontSize: 22, fontWeight: 900, color: '#0D1B3E' },
    stripLabel: { fontSize: 11, color: '#8896AB', marginTop: 2 },

    tableCard: {
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        border: '1px solid #E8ECF4',
        boxShadow: '0 2px 12px rgba(13,27,62,0.06)',
    },
    tableHeader: {
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.8fr 1fr',
        padding: '12px 20px', background: '#0D1B3E',
        color: '#fff', fontSize: 11, fontWeight: 700,
        letterSpacing: 0.5, textTransform: 'uppercase', gap: 12,
    },
    tableRow: {
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.8fr 1fr',
        padding: '14px 20px', alignItems: 'center',
        borderBottom: '1px solid #F0F3FA', gap: 12,
        transition: 'background 0.15s',
    },
    avatar: {
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800, fontSize: 16,
    },
    studentName: { fontSize: 14, fontWeight: 700, color: '#0D1B3E' },
    studentEmail: { fontSize: 12, color: '#8896AB', marginTop: 2 },
    cell: { fontSize: 13, color: '#4A5568' },
    classBadge: { background: '#EEF2FF', color: '#4361EE', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },
    statusBadge: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
    deleteBtn: {
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: '#E63946', fontSize: 13, fontWeight: 600,
        padding: '6px 12px', borderRadius: 8, transition: 'all 0.2s',
        fontFamily: 'inherit',
    },

    loadingWrap: { padding: '20px' },
    skeleton: { height: 56, borderRadius: 8, background: 'linear-gradient(90deg,#F0F3FA 25%,#E8ECF4 50%,#F0F3FA 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 8 },

    empty: { textAlign: 'center', padding: '60px 20px' },
    emptyIcon: { fontSize: 52, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: 700, color: '#0D1B3E', marginBottom: 8 },
    emptySub: { color: '#8896AB', fontSize: 14 },

    // Modal
    modalOverlay: {
        position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)',
    },
    modal: {
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
    },
    modalHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 32px', borderBottom: '1px solid #E8ECF4',
    },
    modalTitle: { fontSize: 20, fontWeight: 900, color: '#0D1B3E', margin: 0 },
    modalClose: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#8896AB', padding: 4 },
    modalBody: { overflowY: 'auto', padding: '24px 32px', flex: 1 },

    formSection: {
        fontSize: 13, fontWeight: 700, color: '#4361EE',
        letterSpacing: 0.5, textTransform: 'uppercase',
        marginTop: 24, marginBottom: 16, paddingBottom: 8,
        borderBottom: '2px solid #E8ECF4',
    },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    formGroup: { marginBottom: 16 },
    label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#8896AB', letterSpacing: 1.5, marginBottom: 6 },
    input: {
        width: '100%', height: 46, padding: '0 14px',
        border: '1.5px solid #E8ECF4', borderRadius: 10,
        fontSize: 14, color: '#0D1B3E', background: '#F8F9FD',
        transition: 'all 0.2s', boxSizing: 'border-box', fontFamily: 'inherit',
    },

    genderRow: { display: 'flex', gap: 10 },
    genderBtn: {
        flex: 1, height: 42, borderRadius: 8, border: '1.5px solid #E8ECF4',
        background: '#F8F9FD', fontSize: 13, fontWeight: 600, color: '#8896AB',
        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
    },
    genderBtnActive: { borderColor: '#4361EE', background: '#EEF2FF', color: '#4361EE' },

    classGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    classBtn: { padding: '8px 16px', borderRadius: 8, border: '1.5px solid #E8ECF4', background: '#F8F9FD', fontSize: 13, fontWeight: 600, color: '#8896AB', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },
    classBtnActive: { borderColor: '#4361EE', background: '#EEF2FF', color: '#4361EE' },

    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
    cancelBtn: { padding: '12px 24px', border: '1.5px solid #E8ECF4', borderRadius: 10, background: '#fff', fontSize: 14, fontWeight: 600, color: '#8896AB', cursor: 'pointer', fontFamily: 'inherit' },
    submitBtn: { padding: '12px 28px', background: 'linear-gradient(135deg,#4361EE,#2541C4)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },
};