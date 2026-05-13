// src/pages/shared/FeesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    collection, addDoc, getDocs, updateDoc,
    doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { db, FLW_PUBLIC_KEY } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';
import { generateFeeReceiptPDF } from '../../utils/pdfGenerator';

const FEE_TYPES = ['Tuition', 'Exam Fee', 'Sports Levy', 'Library Fee', 'Development Levy'];
const TERMS = ['First Term 2025', 'Second Term 2025', 'Third Term 2025'];
const CLASSES = ['Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 11B', 'Grade 12A', 'Grade 12B'];
const EMPTY = { studentName: '', className: '', feeType: 'Tuition', term: 'Third Term 2025', amount: '', description: '' };

// ── Individual fee card with its own Flutterwave hook ─────────
function FeeCard({ fee, profile, isAdmin, onMarkPaid, onRevert, onPaySuccess }) {
    const isPaid = fee.status === 'paid';
    const color = isPaid ? '#27AE60' : '#E63946';
    const txRef = `AHS-${fee.id}-${Date.now()}`;

    const config = {
        public_key: FLW_PUBLIC_KEY,
        tx_ref: txRef,
        amount: Number(fee.amount),
        currency: 'NGN',
        payment_options: 'card,banktransfer,ussd,mobilemoney',
        customer: {
            email: profile?.email || 'student@apexhs.edu',
            name: profile?.name || 'Student',
            phonenumber: profile?.phone || '',
        },
        customizations: {
            title: 'Apex High School',
            description: `${fee.feeType} — ${fee.term}`,
            logo: 'https://via.placeholder.com/100x100?text=AHS',
        },
    };

    const handleFlutterPayment = useFlutterwave(config);

    const handlePay = () => {
        handleFlutterPayment({
            callback: async (response) => {
                closePaymentModal();
                if (response.status === 'successful') {
                    try {
                        // Update fee record
                        await updateDoc(doc(db, 'fees', fee.id), {
                            status: 'paid',
                            paidDate: new Date().toDateString(),
                            txRef: response.transaction_id || txRef,
                            paymentMethod: 'flutterwave',
                        });
                        // Save payment record
                        await addDoc(collection(db, 'payments'), {
                            feeId: fee.id,
                            studentName: fee.studentName,
                            payerId: profile?.uid || '',
                            payerName: profile?.name || '',
                            payerRole: profile?.role || '',
                            amount: Number(fee.amount),
                            feeType: fee.feeType,
                            term: fee.term,
                            className: fee.className,
                            txRef: response.transaction_id || txRef,
                            status: 'successful',
                            paymentMethod: 'flutterwave',
                            paidAt: serverTimestamp(),
                        });
                        toast.success(`✅ Payment of ₦${Number(fee.amount).toLocaleString()} confirmed!`);
                        onPaySuccess();
                    } catch (e) {
                        toast.error('Payment recorded but update failed. Contact admin.');
                    }
                } else if (response.status === 'cancelled') {
                    toast.error('Payment was cancelled.');
                } else {
                    toast.error('Payment failed. Please try again.');
                }
            },
            onClose: () => {
                toast('Payment window closed.', { icon: 'ℹ️' });
            },
        });
    };

    return (
        <div
            style={{
                ...s.feeCard,
                ':hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 30px ${color}15`,
                    borderColor: color,
                },
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 12px 30px ${color}15`;
                e.currentTarget.style.borderColor = color;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(13,27,62,0.06)';
                e.currentTarget.style.borderColor = '#E8ECF4';
            }}
        >
            {/* Left color strip */}
            <div style={{ ...s.feeStrip, background: color }} />

            <div style={s.feeBody}>
                <div style={s.feeTop}>
                    <div style={s.feeLeft}>
                        <div style={s.feeStudent}>{fee.studentName}</div>
                        <div style={s.feeMeta}>{fee.feeType} · {fee.className}</div>
                        <div style={s.feeTerm}>{fee.term}</div>
                        {fee.description && <div style={s.feeDesc}>{fee.description}</div>}
                        {fee.paidDate && (
                            <div style={s.feePaidDate}>
                                ✅ Paid on {fee.paidDate}
                                {fee.txRef && (
                                    <span style={{ fontSize: 11, color: '#8896AB', marginLeft: 8 }}>
                                        · Ref: {String(fee.txRef).slice(0, 12)}...
                                    </span>
                                )}
                            </div>
                        )}
                        {fee.paymentMethod === 'flutterwave' && (
                            <div style={s.flwBadge}>
                                💳 Paid via Flutterwave
                            </div>
                        )}
                    </div>
                    <div style={s.feeRight}>
                        <div style={s.feeAmount}>₦{Number(fee.amount).toLocaleString()}</div>
                        <div style={{ ...s.feeStatus, background: color + '18', color }}>
                            {isPaid ? '✓ PAID' : '⏳ DUE'}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={s.feeActions}>
                    {/* Admin actions */}
                    {isAdmin && !isPaid && (
                        <button style={s.markPaidBtn} onClick={() => onMarkPaid(fee)}>
                            ✓ Mark as Paid
                        </button>
                    )}
                    {isAdmin && isPaid && (
                        <button style={s.revertBtn} onClick={() => onRevert(fee)}>
                            ↩ Revert to Pending
                        </button>

                    )}

                    {/* Student / Parent pay button */}
                    {!isAdmin && !isPaid && (
                        <button
                            style={s.payNowBtn}
                            onClick={handlePay}
                        >
                            <span style={{ marginRight: 8 }}>💳</span>
                            Pay ₦{Number(fee.amount).toLocaleString()} via Flutterwave
                        </button>
                    )}

                    {/* Already paid badge for student/parent */}
                    {!isAdmin && isPaid && (
                        <div style={s.paidBadge}>
                            ✅ Payment Complete
                            {fee.paymentMethod === 'flutterwave' && ' · via Flutterwave'}
                        </div>
                    )}
                    {/* Receipt download for paid fees */}
                    {fee.status === 'paid' && (
                        <button
                            style={{
                                padding: '7px 14px',
                                background: '#EEF2FF',
                                color: '#4361EE',
                                border: '1px solid #4361EE40',
                                borderRadius: 8,
                                fontSize: 13, fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                            }}
                            onClick={() => generateFeeReceiptPDF(fee, profile)}
                            onMouseEnter={e => { e.currentTarget.style.background = '#4361EE'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#4361EE'; }}
                        >
                            🖨️ Print Receipt
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main FeesPage ─────────────────────────────────────────────
export default function FeesPage() {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'admin';
    const isStudentOrParent = ['student', 'parent'].includes(profile?.role);

    const [allFees, setAllFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [selTerm, setSelTerm] = useState('All');
    const [selStatus, setSelStatus] = useState('All');
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        try {
            const snap = await getDocs(query(collection(db, 'fees'), orderBy('createdAt', 'desc')));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            if (profile?.role === 'student') {
                setAllFees(data.filter(f => f.studentName === profile.name));
            } else if (profile?.role === 'parent') {
                setAllFees(data.filter(f => f.studentName === profile.childName));
            } else {
                setAllFees(data);
            }
        } catch (e) { toast.error('Failed to load fees'); }
        finally { setLoading(false); }
    }, [profile]);

    useEffect(() => { if (profile) load(); }, [profile, load]);

    const filtered = allFees.filter(f => {
        const termOk = selTerm === 'All' || f.term === selTerm;
        const statusOk = selStatus === 'All' || f.status === selStatus;
        const searchOk = !search ||
            f.studentName?.toLowerCase().includes(search.toLowerCase()) ||
            f.feeType?.toLowerCase().includes(search.toLowerCase());
        return termOk && statusOk && searchOk;
    });

    // Totals
    const totalAll = allFees.reduce((s, f) => s + Number(f.amount || 0), 0);
    const totalPaid = allFees.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.amount || 0), 0);
    const totalPending = allFees.filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount || 0), 0);
    const rate = totalAll > 0 ? Math.round((totalPaid / totalAll) * 100) : 0;
    const paidCount = allFees.filter(f => f.status === 'paid').length;
    const pendingCount = allFees.filter(f => f.status === 'pending').length;

    // Term breakdown
    const termBreakdown = TERMS.map(term => {
        const termFees = allFees.filter(f => f.term === term);
        const paid = termFees.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.amount || 0), 0);
        const pending = termFees.filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount || 0), 0);
        const total = paid + pending;
        const termRate = total > 0 ? Math.round((paid / total) * 100) : 0;
        return { term, total, paid, pending, rate: termRate, count: termFees.length };
    }).filter(t => t.count > 0);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.studentName || !form.amount) {
            toast.error('Student name and amount are required.');
            return;
        }
        setSaving(true);
        try {
            await addDoc(collection(db, 'fees'), {
                ...form, amount: Number(form.amount),
                status: 'pending', createdAt: serverTimestamp(),
            });
            toast.success('Fee record added!');
            setShowForm(false); setForm(EMPTY); load();
        } catch (e) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleMarkPaid = async (fee) => {
        if (!window.confirm(`Mark ₦${Number(fee.amount).toLocaleString()} as paid manually?`)) return;
        try {
            await updateDoc(doc(db, 'fees', fee.id), {
                status: 'paid', paidDate: new Date().toDateString(), paymentMethod: 'manual',
            });
            toast.success('Marked as paid!'); load();
        } catch (e) { toast.error(e.message); }
    };

    const handleRevert = async (fee) => {
        if (!window.confirm('Revert this payment to pending?')) return;
        try {
            await updateDoc(doc(db, 'fees', fee.id), { status: 'pending', paidDate: null, txRef: null });
            toast.success('Reverted to pending.'); load();
        } catch (e) { toast.error(e.message); }
    };

    const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <Layout
            title="School Fees"
            subtitle={isAdmin ? 'Manage all fee records' : 'Your fee records'}
        >

            {/* ── Summary Banner ── */}
            <div style={s.banner}>
                <div style={s.bannerLeft}>
                    <div style={s.bannerLabel}>
                        {isAdmin ? 'TOTAL SCHOOL FEES' : 'MY FEE SUMMARY'}
                    </div>
                    <div style={s.bannerTotal}>₦{totalAll.toLocaleString()}</div>
                    <div style={s.bannerBarWrap}>
                        <div style={s.bannerBarBg}>
                            <div style={{ ...s.bannerBarFill, width: `${rate}%` }} />
                        </div>
                    </div>
                    <div style={s.bannerSub}>{rate}% collected</div>
                </div>

                <div style={s.bannerStats}>
                    <div style={s.bannerStatItem}>
                        <div style={{ ...s.bannerStatVal, color: '#7FFF00' }}>
                            ₦{totalPaid.toLocaleString()}
                        </div>
                        <div style={s.bannerStatLabel}>✅ Collected</div>
                        <div style={s.bannerStatCount}>{paidCount} records</div>
                    </div>
                    <div style={s.bannerDivider} />
                    <div style={s.bannerStatItem}>
                        <div style={{ ...s.bannerStatVal, color: '#FF6B6B' }}>
                            ₦{totalPending.toLocaleString()}
                        </div>
                        <div style={s.bannerStatLabel}>⏳ Outstanding</div>
                        <div style={s.bannerStatCount}>{pendingCount} records</div>
                    </div>
                </div>
            </div>

            {/* ── Payment Info Banner for Students/Parents ── */}
            {isStudentOrParent && totalPending > 0 && (
                <div style={s.payInfoBanner}>
                    <div style={s.payInfoIcon}>💳</div>
                    <div style={s.payInfoText}>
                        <div style={s.payInfoTitle}>
                            You have ₦{totalPending.toLocaleString()} in outstanding fees
                        </div>
                        <div style={s.payInfoSub}>
                            Pay securely using Card, Bank Transfer, USSD or Mobile Money via Flutterwave.
                            Your payment is 256-bit SSL encrypted.
                        </div>
                    </div>
                    <div style={s.payInfoMethods}>
                        {['💳 Card', '🏦 Transfer', '📱 USSD'].map(m => (
                            <div key={m} style={s.payInfoMethod}>{m}</div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Term Breakdown (Admin only) ── */}
            {isAdmin && termBreakdown.length > 0 && (
                <div style={s.termSection}>
                    <h3 style={s.sectionTitle}>Breakdown by Term</h3>
                    <div style={s.termGrid}>
                        {termBreakdown.map((t, i) => {
                            const barColor = t.rate >= 75 ? '#27AE60' : t.rate >= 50 ? '#F5A623' : '#E63946';
                            return (
                                <div key={i} style={s.termCard}>
                                    <div style={s.termCardTop}>
                                        <div style={s.termName}>{t.term}</div>
                                        <div style={{ ...s.termRate, background: barColor + '18', color: barColor }}>
                                            {t.rate}% paid
                                        </div>
                                    </div>
                                    <div style={s.termBarBg}>
                                        <div style={{ ...s.termBarFill, width: `${t.rate}%`, background: barColor }} />
                                    </div>
                                    <div style={s.termStats}>
                                        <div style={s.termStat}>
                                            <div style={s.termStatLabel}>Expected</div>
                                            <div style={s.termStatVal}>₦{t.total.toLocaleString()}</div>
                                        </div>
                                        <div style={s.termStat}>
                                            <div style={s.termStatLabel}>Collected</div>
                                            <div style={{ ...s.termStatVal, color: '#27AE60' }}>₦{t.paid.toLocaleString()}</div>
                                        </div>
                                        <div style={s.termStat}>
                                            <div style={s.termStatLabel}>Outstanding</div>
                                            <div style={{ ...s.termStatVal, color: '#E63946' }}>₦{t.pending.toLocaleString()}</div>
                                        </div>
                                        <div style={s.termStat}>
                                            <div style={s.termStatLabel}>Records</div>
                                            <div style={s.termStatVal}>{t.count}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Toolbar ── */}
            <div style={s.toolbar}>
                <div style={s.toolbarLeft}>
                    {isAdmin && (
                        <div style={s.searchWrap}>
                            <span style={{ fontSize: 16, color: '#8896AB' }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search student or fee type..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={s.searchInput}
                            />
                            {search && (
                                <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>
                            )}
                        </div>
                    )}
                    <div style={s.filters}>
                        <select
                            value={selTerm}
                            onChange={e => setSelTerm(e.target.value)}
                            style={s.select}
                        >
                            <option value="All">All Terms</option>
                            {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select
                            value={selStatus}
                            onChange={e => setSelStatus(e.target.value)}
                            style={s.select}
                        >
                            <option value="All">All Status</option>
                            <option value="paid">✓ Paid</option>
                            <option value="pending">⏳ Pending</option>
                        </select>
                    </div>
                </div>

                {isAdmin && (
                    <button
                        style={s.addBtn}
                        onClick={() => setShowForm(true)}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        + Add Fee Record
                    </button>
                )}
            </div>

            {/* Filtered totals strip */}
            {(selTerm !== 'All' || selStatus !== 'All') && filtered.length > 0 && (
                <div style={s.filteredStrip}>
                    <span style={s.filteredCount}>{filtered.length} records shown</span>
                    <span style={s.filteredSep}>·</span>
                    <span style={s.filteredTotal}>Total: ₦{filtered.reduce((s, f) => s + Number(f.amount || 0), 0).toLocaleString()}</span>
                    <span style={s.filteredSep}>·</span>
                    <span style={{ ...s.filteredTotal, color: '#27AE60' }}>
                        Paid: ₦{filtered.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.amount || 0), 0).toLocaleString()}
                    </span>
                    <span style={s.filteredSep}>·</span>
                    <span style={{ ...s.filteredTotal, color: '#E63946' }}>
                        Due: ₦{filtered.filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount || 0), 0).toLocaleString()}
                    </span>
                </div>
            )}

            {/* ── Fee Records ── */}
            {loading ? (
                <div style={s.skeletonWrap}>
                    {[1, 2, 3, 4].map(i => <div key={i} style={s.skeleton} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div style={s.empty}>
                    <div style={s.emptyIcon}>💰</div>
                    <div style={s.emptyTitle}>No fee records found</div>
                    <div style={s.emptySub}>
                        {allFees.length === 0 ? 'No fees added yet' : 'Try adjusting your filters'}
                    </div>
                </div>
            ) : (
                <div style={s.feeList}>
                    {filtered.map(fee => (
                        <FeeCard
                            key={fee.id}
                            fee={fee}
                            profile={profile}
                            isAdmin={isAdmin}
                            onMarkPaid={handleMarkPaid}
                            onRevert={handleRevert}
                            onPaySuccess={load}
                        />
                    ))}
                </div>
            )}

            {/* ── Security note for students/parents ── */}
            {isStudentOrParent && (
                <div style={s.securityNote}>
                    🔒 All payments are secured by Flutterwave · 256-bit SSL Encrypted · PCI DSS Compliant
                </div>
            )}

            {/* ── Add Fee Modal (Admin only) ── */}
            {showForm && (
                <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div style={s.modal}>
                        <div style={s.modalHeader}>
                            <h2 style={s.modalTitle}>Add Fee Record</h2>
                            <button
                                style={s.modalClose}
                                onClick={() => { setShowForm(false); setForm(EMPTY); }}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={s.modalBody}>
                            <form onSubmit={handleAdd}>
                                <div style={s.formGrid}>
                                    <div style={s.formGroup}>
                                        <label style={s.label}>STUDENT NAME *</label>
                                        <input type="text" placeholder="Full student name"
                                            value={form.studentName}
                                            onChange={e => F('studentName', e.target.value)}
                                            style={s.input}
                                            onFocus={e => { e.target.style.borderColor = '#6F42C1'; e.target.style.boxShadow = '0 0 0 3px #6F42C118'; }}
                                            onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>
                                    <div style={s.formGroup}>
                                        <label style={s.label}>AMOUNT (₦) *</label>
                                        <input type="number" placeholder="e.g. 150000"
                                            value={form.amount}
                                            onChange={e => F('amount', e.target.value)}
                                            style={s.input}
                                            onFocus={e => { e.target.style.borderColor = '#6F42C1'; e.target.style.boxShadow = '0 0 0 3px #6F42C118'; }}
                                            onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                                        />
                                    </div>
                                </div>

                                <div style={s.formGroup}>
                                    <label style={s.label}>CLASS</label>
                                    <div style={s.chipGrid}>
                                        {CLASSES.map(c => (
                                            <button key={c} type="button"
                                                style={{ ...s.chip, ...(form.className === c ? s.chipActive : {}) }}
                                                onClick={() => F('className', c)}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={s.formGroup}>
                                    <label style={s.label}>FEE TYPE</label>
                                    <div style={s.chipGrid}>
                                        {FEE_TYPES.map(t => (
                                            <button key={t} type="button"
                                                style={{ ...s.chip, ...(form.feeType === t ? s.chipActive : {}) }}
                                                onClick={() => F('feeType', t)}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={s.formGroup}>
                                    <label style={s.label}>TERM</label>
                                    <div style={s.chipGrid}>
                                        {TERMS.map(t => (
                                            <button key={t} type="button"
                                                style={{ ...s.chip, ...(form.term === t ? s.chipActive : {}) }}
                                                onClick={() => F('term', t)}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={s.formGroup}>
                                    <label style={s.label}>DESCRIPTION (OPTIONAL)</label>
                                    <input type="text" placeholder="Optional note"
                                        value={form.description}
                                        onChange={e => F('description', e.target.value)}
                                        style={s.input}
                                        onFocus={e => { e.target.style.borderColor = '#6F42C1'; e.target.style.boxShadow = '0 0 0 3px #6F42C118'; }}
                                        onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>

                                <div style={s.modalFooter}>
                                    <button
                                        type="button"
                                        style={s.cancelBtn}
                                        onClick={() => { setShowForm(false); setForm(EMPTY); }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" style={s.submitBtn} disabled={saving}>
                                        {saving ? 'Adding...' : '💰 Add Fee Record'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
        </Layout>
    );
}

// ── Styles ────────────────────────────────────────────────────
const s = {
    // Banner
    banner: { background: 'linear-gradient(135deg,#6F42C1,#5A1F9E)', borderRadius: 20, padding: '28px 32px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap', boxShadow: '0 8px 30px rgba(111,66,193,0.3)' },
    bannerLeft: { flex: 1 },
    bannerLabel: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
    bannerTotal: { fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 12 },
    bannerBarWrap: { marginBottom: 6 },
    bannerBarBg: { height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
    bannerBarFill: { height: 8, background: '#7FFF00', borderRadius: 4, transition: 'width 0.8s ease' },
    bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    bannerStats: { display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' },
    bannerStatItem: { textAlign: 'center' },
    bannerStatVal: { fontSize: 24, fontWeight: 900, marginBottom: 4 },
    bannerStatLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    bannerStatCount: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
    bannerDivider: { width: 1, height: 60, background: 'rgba(255,255,255,0.2)' },

    // Payment info banner
    payInfoBanner: { background: 'linear-gradient(135deg,#EEF2FF,#F5F0FF)', border: '1.5px solid #C7D2FE', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
    payInfoIcon: { fontSize: 40, flexShrink: 0 },
    payInfoText: { flex: 1 },
    payInfoTitle: { fontSize: 16, fontWeight: 800, color: '#0D1B3E', marginBottom: 4 },
    payInfoSub: { fontSize: 13, color: '#4A5568', lineHeight: 1.5 },
    payInfoMethods: { display: 'flex', gap: 8, flexShrink: 0 },
    payInfoMethod: { background: '#fff', border: '1px solid #E8ECF4', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#4A5568' },

    // Term breakdown
    termSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: 800, color: '#0D1B3E', marginBottom: 16 },
    termGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 },
    termCard: { background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #E8ECF4', boxShadow: '0 2px 10px rgba(13,27,62,0.06)' },
    termCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    termName: { fontSize: 14, fontWeight: 700, color: '#0D1B3E' },
    termRate: { fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
    termBarBg: { height: 6, background: '#F0F3FA', borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
    termBarFill: { height: 6, borderRadius: 3, transition: 'width 0.8s ease' },
    termStats: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 },
    termStat: { textAlign: 'center' },
    termStatLabel: { fontSize: 10, color: '#8896AB', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
    termStatVal: { fontSize: 12, fontWeight: 800, color: '#0D1B3E' },

    // Toolbar
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16, flexWrap: 'wrap' },
    toolbarLeft: { display: 'flex', gap: 12, alignItems: 'center', flex: 1, flexWrap: 'wrap' },
    searchWrap: { display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid #E8ECF4', borderRadius: 10, padding: '0 14px', height: 44, minWidth: 260 },
    searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#0D1B3E', background: 'transparent', fontFamily: 'inherit' },
    clearBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#8896AB', fontSize: 14 },
    filters: { display: 'flex', gap: 10 },
    select: { height: 44, padding: '0 12px', border: '1.5px solid #E8ECF4', borderRadius: 10, fontSize: 13, color: '#4A5568', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' },
    addBtn: { padding: '11px 22px', background: 'linear-gradient(135deg,#6F42C1,#5A1F9E)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(111,66,193,0.3)', transition: 'all 0.2s' },

    // Filtered strip
    filteredStrip: { display: 'flex', alignItems: 'center', gap: 12, background: '#F8F9FD', borderRadius: 10, padding: '10px 16px', marginBottom: 16, flexWrap: 'wrap' },
    filteredCount: { fontSize: 13, fontWeight: 700, color: '#0D1B3E' },
    filteredSep: { color: '#C0C8D8' },
    filteredTotal: { fontSize: 13, fontWeight: 600, color: '#4A5568' },

    // Skeleton
    skeletonWrap: { display: 'flex', flexDirection: 'column', gap: 12 },
    skeleton: { height: 130, borderRadius: 16, background: 'linear-gradient(90deg,#F0F3FA 25%,#E8ECF4 50%,#F0F3FA 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' },

    // Fee cards
    feeList: { display: 'flex', flexDirection: 'column', gap: 14 },
    feeCard: { display: 'flex', background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1.5px solid #E8ECF4', boxShadow: '0 2px 12px rgba(13,27,62,0.06)', transition: 'all 0.3s', cursor: 'default' },
    feeStrip: { width: 5, flexShrink: 0 },
    feeBody: { flex: 1, padding: '18px 22px' },
    feeTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    feeLeft: { flex: 1 },
    feeStudent: { fontSize: 16, fontWeight: 800, color: '#0D1B3E', marginBottom: 4 },
    feeMeta: { fontSize: 13, color: '#4A5568', marginBottom: 2 },
    feeTerm: { fontSize: 12, color: '#8896AB' },
    feeDesc: { fontSize: 12, color: '#8896AB', fontStyle: 'italic', marginTop: 4 },
    feePaidDate: { fontSize: 12, color: '#27AE60', fontWeight: 600, marginTop: 6 },
    flwBadge: { display: 'inline-block', background: '#F0FAF4', color: '#27AE60', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginTop: 4 },
    feeRight: { textAlign: 'right', flexShrink: 0, marginLeft: 20 },
    feeAmount: { fontSize: 26, fontWeight: 900, color: '#0D1B3E', marginBottom: 6, lineHeight: 1 },
    feeStatus: { fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 20, letterSpacing: 0.5, display: 'inline-block' },

    // Fee actions
    feeActions: { display: 'flex', gap: 10, paddingTop: 14, borderTop: '1px solid #F0F3FA', flexWrap: 'wrap', alignItems: 'center' },
    markPaidBtn: { background: '#F0FAF4', color: '#27AE60', border: '1.5px solid #A8E6C1', padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' },
    revertBtn: { background: '#FFF0F0', color: '#E63946', border: '1.5px solid #FECDD3', padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' },
    payNowBtn: { display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg,#6F42C1,#5A1F9E)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(111,66,193,0.35)', transition: 'all 0.2s' },
    paidBadge: { display: 'inline-flex', alignItems: 'center', background: '#F0FAF4', color: '#27AE60', border: '1.5px solid #A8E6C1', padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 },

    // Security note
    securityNote: { textAlign: 'center', color: '#8896AB', fontSize: 13, marginTop: 20, padding: '12px', background: '#F8F9FD', borderRadius: 10, border: '1px solid #E8ECF4' },

    // Empty
    empty: { textAlign: 'center', padding: '80px 20px' },
    emptyIcon: { fontSize: 52, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: 700, color: '#0D1B3E', marginBottom: 8 },
    emptySub: { color: '#8896AB', fontSize: 14 },

    // Modal
    overlay: { position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(6px)' },
    modal: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid #E8ECF4' },
    modalTitle: { fontSize: 20, fontWeight: 900, color: '#0D1B3E', margin: 0 },
    modalClose: { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8896AB', padding: 4 },
    modalBody: { overflowY: 'auto', padding: '24px 32px', flex: 1 },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    formGroup: { marginBottom: 18 },
    label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#8896AB', letterSpacing: 1.5, marginBottom: 8 },
    input: { width: '100%', height: 46, padding: '0 14px', border: '1.5px solid #E8ECF4', borderRadius: 10, fontSize: 14, color: '#0D1B3E', background: '#F8F9FD', transition: 'all 0.2s', boxSizing: 'border-box', fontFamily: 'inherit' },
    chipGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    chip: { padding: '7px 14px', borderRadius: 20, border: '1.5px solid #E8ECF4', background: '#F8F9FD', fontSize: 13, fontWeight: 600, color: '#8896AB', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },
    chipActive: { borderColor: '#6F42C1', background: '#F5F0FF', color: '#6F42C1' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
    cancelBtn: { padding: '12px 24px', border: '1.5px solid #E8ECF4', borderRadius: 10, background: '#fff', fontSize: 14, fontWeight: 600, color: '#8896AB', cursor: 'pointer', fontFamily: 'inherit' },
    submitBtn: { padding: '12px 28px', background: 'linear-gradient(135deg,#6F42C1,#5A1F9E)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
};