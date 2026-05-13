// src/pages/admin/ReportsPage.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Layout from '../../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { generateResultPDF } from '../../utils/pdfGenerator';


const TABS = ['Overview', 'Academic', 'Attendance', 'Finance'];

export default function ReportsPage() {
    const [tab, setTab] = useState('Overview');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        students: 0, teachers: 0, classes: 0,
        grades: [], attendance: [], fees: [],
        assignments: 0, announcements: 0,
    });

    useEffect(() => {
        const load = async () => {
            try {
                const [studSnap, teachSnap, classSnap, gradeSnap, attSnap, feeSnap, assignSnap, annSnap] = await Promise.all([
                    getDocs(collection(db, 'students')),
                    getDocs(collection(db, 'teachers')),
                    getDocs(collection(db, 'classes')),
                    getDocs(query(collection(db, 'grades'), orderBy('createdAt', 'desc'), limit(50))),
                    getDocs(query(collection(db, 'attendance'), orderBy('createdAt', 'desc'), limit(20))),
                    getDocs(collection(db, 'fees')),
                    getDocs(collection(db, 'assignments')),
                    getDocs(collection(db, 'announcements')),
                ]);
                setData({
                    students: studSnap.size,
                    teachers: teachSnap.size,
                    classes: classSnap.size,
                    grades: gradeSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                    attendance: attSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                    fees: feeSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                    assignments: assignSnap.size,
                    announcements: annSnap.size,
                });
            } catch (e) { console.warn(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    // Computed values
    const avgScore = data.grades.length ? Math.round(data.grades.reduce((s, g) => s + Number(g.score || 0), 0) / data.grades.length) : 0;
    const totalFees = data.fees.reduce((s, f) => s + Number(f.amount || 0), 0);
    const paidFees = data.fees.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.amount || 0), 0);
    const pendingFees = data.fees.filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount || 0), 0);
    const collectionRate = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0;

    // Grade distribution
    const gradeDist = ['A', 'B', 'C', 'D', 'F'].map(letter => {
        const range = { A: [80, 100], B: [70, 79], C: [60, 69], D: [50, 59], F: [0, 49] }[letter];
        const count = data.grades.filter(g => g.score >= range[0] && g.score <= range[1]).length;
        const pct = data.grades.length ? Math.round((count / data.grades.length) * 100) : 0;
        const color = { A: '#27AE60', B: '#4361EE', C: '#20C997', D: '#F5A623', F: '#E63946' }[letter];
        return { letter, count, pct, color };
    });

    // Subject averages
    const subjectMap = {};
    data.grades.forEach(g => {
        if (!subjectMap[g.subject]) subjectMap[g.subject] = [];
        subjectMap[g.subject].push(Number(g.score || 0));
    });
    const subjectAvgs = Object.entries(subjectMap).map(([subject, scores]) => ({
        subject: subject.split(' ')[0],
        avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    })).sort((a, b) => b.avg - a.avg).slice(0, 6);

    // Attendance trend
    const attTrend = data.attendance.slice(0, 7).reverse().map((att, i) => ({
        day: att.dateLabel?.split(',')[0] || `Day ${i + 1}`,
        present: att.totalPresent || 0,
        absent: att.totalAbsent || 0,
        late: att.totalLate || 0,
    }));

    // Fees by term
    const termMap = {};
    data.fees.forEach(f => {
        if (!termMap[f.term]) termMap[f.term] = { paid: 0, pending: 0 };
        if (f.status === 'paid') termMap[f.term].paid += Number(f.amount || 0);
        if (f.status === 'pending') termMap[f.term].pending += Number(f.amount || 0);
    });
    const termData = Object.entries(termMap).map(([term, v]) => ({
        term: term.replace('Term', 'T').replace('2025', ''),
        paid: v.paid, pending: v.pending,
    }));

    const PIE_DATA = [
        { name: 'Paid', value: paidFees, color: '#27AE60' },
        { name: 'Pending', value: pendingFees, color: '#E63946' },
    ];

    return (
        <Layout title="Reports & Analytics" subtitle="Third Term 2025">

            {/* Tabs */}
            <div style={s.tabs}>
                {TABS.map(t => (
                    <button
                        key={t}
                        style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
                        onClick={() => setTab(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={s.loadingWrap}>
                    <div style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
                    <div style={{ color: '#8896AB' }}>Loading reports...</div>
                </div>
            ) : (
                <>
                    {/* ── OVERVIEW ── */}
                    {tab === 'Overview' && (
                        <div>
                            {/* KPI Row */}
                            <div style={s.kpiRow}>
                                {[
                                    { icon: '🎓', label: 'Students', value: data.students, color: '#4361EE', bg: '#EEF2FF' },
                                    { icon: '📚', label: 'Teachers', value: data.teachers, color: '#2A9D8F', bg: '#F0FAFA' },
                                    { icon: '🏫', label: 'Classes', value: data.classes, color: '#20C997', bg: '#F0FAF6' },
                                    { icon: '📊', label: 'Avg Score', value: `${avgScore}%`, color: '#F5A623', bg: '#FFFAF0' },
                                    { icon: '📝', label: 'Assignments', value: data.assignments, color: '#6F42C1', bg: '#F5F0FF' },
                                    { icon: '📢', label: 'Announcements', value: data.announcements, color: '#E63946', bg: '#FFF0F0' },
                                ].map((k, i) => (
                                    <div key={i} style={s.kpiCard}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = k.color; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#E8ECF4'; }}
                                    >
                                        <div style={{ ...s.kpiIcon, background: k.bg }}>{k.icon}</div>
                                        <div style={{ ...s.kpiValue, color: k.color }}>{k.value}</div>
                                        <div style={s.kpiLabel}>{k.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Charts row */}
                            <div style={s.chartsRow}>
                                {/* Subject Averages */}
                                <div style={s.chartCard}>
                                    <h3 style={s.chartTitle}>Subject Performance</h3>
                                    {subjectAvgs.length === 0 ? (
                                        <div style={s.noData}>📊 No grade data yet</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart data={subjectAvgs} barSize={32}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F3FA" />
                                                <XAxis dataKey="subject" tick={{ fontSize: 12, fill: '#8896AB' }} />
                                                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#8896AB' }} />
                                                <Tooltip formatter={v => [`${v}%`, 'Average']} contentStyle={{ borderRadius: 10, border: '1px solid #E8ECF4' }} />
                                                <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                                                    {subjectAvgs.map((_, i) => (
                                                        <Cell key={i} fill={['#4361EE', '#2A9D8F', '#E63946', '#F5A623', '#27AE60', '#6F42C1'][i % 6]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>

                                {/* Fee Collection */}
                                <div style={s.chartCard}>
                                    <h3 style={s.chartTitle}>Fee Collection</h3>
                                    <div style={s.feeOverview}>
                                        <div style={s.feeRate}>
                                            <div style={{ ...s.feeRateValue, color: collectionRate >= 75 ? '#27AE60' : '#E63946' }}>
                                                {collectionRate}%
                                            </div>
                                            <div style={s.feeRateLabel}>Collected</div>
                                        </div>
                                        {totalFees > 0 ? (
                                            <PieChart width={160} height={160}>
                                                <Pie data={PIE_DATA} cx={75} cy={75} innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                                                    {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                </Pie>
                                                <Tooltip formatter={v => [`₦${v.toLocaleString()}`]} contentStyle={{ borderRadius: 10 }} />
                                            </PieChart>
                                        ) : (
                                            <div style={s.noData}>No fee data</div>
                                        )}
                                        <div style={s.feeLegend}>
                                            {PIE_DATA.map((p, i) => (
                                                <div key={i} style={s.feeLegendItem}>
                                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                                                    <div>
                                                        <div style={{ fontSize: 11, color: '#8896AB' }}>{p.name}</div>
                                                        <div style={{ fontSize: 13, fontWeight: 700 }}>₦{p.value.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ACADEMIC ── */}
                    {tab === 'Academic' && (
                        <div>
                            <div style={s.avgBanner}>
                                <div>
                                    <div style={s.avgLabel}>SCHOOL AVERAGE SCORE</div>
                                    <div style={s.avgValue}>{avgScore}%</div>
                                    <div style={s.avgSub}>Based on {data.grades.length} assessments</div>
                                </div>
                                <div style={s.avgRight}>
                                    {['A', 'B', 'C'].map(l => {
                                        const gd = gradeDist.find(g => g.letter === l);
                                        return (
                                            <div key={l} style={{ ...s.avgBadge, background: gd?.color + '20', color: gd?.color }}>
                                                {l}: {gd?.count || 0}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={s.chartsRow}>
                                {/* Grade Distribution */}
                                <div style={s.chartCard}>
                                    <h3 style={s.chartTitle}>Grade Distribution</h3>
                                    {gradeDist.every(g => g.count === 0) ? (
                                        <div style={s.noData}>📊 No grade data yet</div>
                                    ) : (
                                        <div style={s.gradeDistList}>
                                            {gradeDist.map((g, i) => (
                                                <div key={i} style={s.gradeDistRow}>
                                                    <div style={{ ...s.gradeDistBadge, background: g.color + '20', color: g.color }}>{g.letter}</div>
                                                    <div style={s.gradeDistBarBg}>
                                                        <div style={{ ...s.gradeDistBarFill, width: `${g.pct}%`, background: g.color }} />
                                                    </div>
                                                    <div style={s.gradeDistCount}>{g.count}</div>
                                                    <div style={{ ...s.gradeDistPct, color: g.color }}>{g.pct}%</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Subject Bar Chart */}
                                <div style={s.chartCard}>
                                    <h3 style={s.chartTitle}>Subject Averages</h3>
                                    {subjectAvgs.length === 0 ? (
                                        <div style={s.noData}>📊 No data yet</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={subjectAvgs} layout="vertical" barSize={20}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#F0F3FA" horizontal={false} />
                                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#8896AB' }} />
                                                <YAxis dataKey="subject" type="category" tick={{ fontSize: 12, fill: '#8896AB' }} width={80} />
                                                <Tooltip formatter={v => [`${v}%`, 'Average']} contentStyle={{ borderRadius: 10 }} />
                                                <Bar dataKey="avg" radius={[0, 6, 6, 0]}>
                                                    {subjectAvgs.map((_, i) => (
                                                        <Cell key={i} fill={['#4361EE', '#2A9D8F', '#E63946', '#F5A623', '#27AE60', '#6F42C1'][i % 6]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Recent Grades Table */}
                            <div style={s.chartCard}>
                                <h3 style={s.chartTitle}>Recent Grade Entries</h3>
                                <div style={s.gradesTable}>
                                    <div style={s.gradeTableHeader}>
                                        <span style={{ flex: 2 }}>Student</span>
                                        <span>Subject</span>
                                        <span>Type</span>
                                        <span>Class</span>
                                        <span>Teacher</span>
                                        <span style={{ textAlign: 'right' }}>Score</span>
                                    </div>
                                    {data.grades.slice(0, 10).map((g, i) => {
                                        const color = g.score >= 80 ? '#27AE60' : g.score >= 70 ? '#4361EE' : g.score >= 60 ? '#20C997' : g.score >= 50 ? '#F5A623' : '#E63946';
                                        return (
                                            <div key={i} style={{ ...s.gradeTableRow, background: i % 2 === 0 ? '#fff' : '#F8F9FD' }}>
                                                <span style={{ flex: 2, fontWeight: 600, fontSize: 13 }}>{g.studentName || '—'}</span>
                                                <span style={s.gCell}>{g.subject?.split(' ')[0] || '—'}</span>
                                                <span style={s.gCell}>{g.examType || '—'}</span>
                                                <span style={s.gCell}>{g.className || '—'}</span>
                                                <span style={s.gCell}>{g.teacherName?.split(' ')[0] || '—'}</span>
                                                <span style={{ textAlign: 'right', fontWeight: 800, color, fontSize: 14 }}>{g.score}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {data.grades.length > 0 && (
                                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        style={{
                                            padding: '10px 24px',
                                            background: 'linear-gradient(135deg,#0D1B3E,#1A3066)',
                                            color: '#fff', border: 'none', borderRadius: 10,
                                            fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                        onClick={() => {
                                            // Group by student and generate result for each
                                            const students = [...new Set(data.grades.map(g => g.studentName))];
                                            students.forEach((name, i) => {
                                                setTimeout(() => {
                                                    const studentGrades = data.grades.filter(g => g.studentName === name);
                                                    generateResultPDF({ name, className: studentGrades[0]?.className }, studentGrades);
                                                }, i * 800);
                                            });
                                        }}
                                    >
                                        📄 Export All Results as PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── ATTENDANCE ── */}
                    {tab === 'Attendance' && (
                        <div>
                            <div style={s.attSummary}>
                                {[
                                    { icon: '📋', label: 'Sessions Logged', value: data.attendance.length, color: '#4361EE', bg: '#EEF2FF' },
                                    { icon: '✅', label: 'Avg Present', value: '87%', color: '#27AE60', bg: '#F0FAF4' },
                                    { icon: '❌', label: 'Avg Absent', value: '9%', color: '#E63946', bg: '#FFF0F0' },
                                    { icon: '⏰', label: 'Avg Late', value: '4%', color: '#F5A623', bg: '#FFFAF0' },
                                ].map((k, i) => (
                                    <div key={i} style={s.kpiCard}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = k.color; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#E8ECF4'; }}
                                    >
                                        <div style={{ ...s.kpiIcon, background: k.bg }}>{k.icon}</div>
                                        <div style={{ ...s.kpiValue, color: k.color }}>{k.value}</div>
                                        <div style={s.kpiLabel}>{k.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Attendance Trend Chart */}
                            <div style={s.chartCard}>
                                <h3 style={s.chartTitle}>Attendance Trend</h3>
                                {attTrend.length === 0 ? (
                                    <div style={s.noData}>✅ No attendance records yet</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <LineChart data={attTrend}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#F0F3FA" />
                                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8896AB' }} />
                                            <YAxis tick={{ fontSize: 12, fill: '#8896AB' }} />
                                            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E8ECF4' }} />
                                            <Legend />
                                            <Line type="monotone" dataKey="present" stroke="#27AE60" strokeWidth={2} dot={{ fill: '#27AE60', r: 4 }} />
                                            <Line type="monotone" dataKey="absent" stroke="#E63946" strokeWidth={2} dot={{ fill: '#E63946', r: 4 }} />
                                            <Line type="monotone" dataKey="late" stroke="#F5A623" strokeWidth={2} dot={{ fill: '#F5A623', r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* Attendance Records */}
                            <div style={s.chartCard}>
                                <h3 style={s.chartTitle}>Recent Attendance Records</h3>
                                {data.attendance.length === 0 ? (
                                    <div style={s.noData}>No records yet</div>
                                ) : (
                                    <div>
                                        <div style={{ ...s.gradeTableHeader, gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                                            <span style={{ flex: 2 }}>Class</span>
                                            <span>Date</span>
                                            <span style={{ color: '#27AE60' }}>Present</span>
                                            <span style={{ color: '#E63946' }}>Absent</span>
                                            <span style={{ color: '#F5A623' }}>Late</span>
                                            <span style={{ textAlign: 'right' }}>Total</span>
                                        </div>
                                        {data.attendance.map((att, i) => (
                                            <div key={i} style={{ ...s.gradeTableRow, background: i % 2 === 0 ? '#fff' : '#F8F9FD', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                                                <span style={{ fontWeight: 700, fontSize: 13 }}>{att.className}</span>
                                                <span style={s.gCell}>{att.dateLabel || att.date}</span>
                                                <span style={{ color: '#27AE60', fontWeight: 700, textAlign: 'center' }}>{att.totalPresent || 0}</span>
                                                <span style={{ color: '#E63946', fontWeight: 700, textAlign: 'center' }}>{att.totalAbsent || 0}</span>
                                                <span style={{ color: '#F5A623', fontWeight: 700, textAlign: 'center' }}>{att.totalLate || 0}</span>
                                                <span style={{ textAlign: 'right', fontWeight: 600 }}>{att.total || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── FINANCE ── */}
                    {tab === 'Finance' && (
                        <div>
                            {/* Finance KPIs */}
                            <div style={{ ...s.kpiRow, gridTemplateColumns: 'repeat(3,1fr)' }}>
                                {[
                                    { icon: '💼', label: 'Total Expected', value: `₦${totalFees.toLocaleString()}`, color: '#4361EE', bg: '#EEF2FF' },
                                    { icon: '✅', label: 'Total Collected', value: `₦${paidFees.toLocaleString()}`, color: '#27AE60', bg: '#F0FAF4' },
                                    { icon: '⏳', label: 'Outstanding', value: `₦${pendingFees.toLocaleString()}`, color: '#E63946', bg: '#FFF0F0' },
                                ].map((k, i) => (
                                    <div key={i} style={{ ...s.kpiCard, padding: '24px 28px' }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = k.color; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#E8ECF4'; }}
                                    >
                                        <div style={{ ...s.kpiIcon, background: k.bg, width: 52, height: 52, fontSize: 26 }}>{k.icon}</div>
                                        <div style={{ ...s.kpiValue, color: k.color, fontSize: 28 }}>{k.value}</div>
                                        <div style={s.kpiLabel}>{k.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Collection Rate */}
                            <div style={s.chartCard}>
                                <h3 style={s.chartTitle}>Fee Collection Rate</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 48, fontWeight: 900, color: collectionRate >= 75 ? '#27AE60' : '#E63946', marginBottom: 8 }}>
                                            {collectionRate}%
                                        </div>
                                        <div style={s.collectionBarBg}>
                                            <div style={{ ...s.collectionBarFill, width: `${collectionRate}%`, background: collectionRate >= 75 ? '#27AE60' : '#E63946' }} />
                                        </div>
                                        <div style={{ fontSize: 13, color: '#8896AB', marginTop: 8 }}>
                                            ₦{paidFees.toLocaleString()} of ₦{totalFees.toLocaleString()} collected
                                        </div>
                                    </div>
                                    {termData.length > 0 && (
                                        <div style={{ flex: 2 }}>
                                            <ResponsiveContainer width="100%" height={180}>
                                                <BarChart data={termData} barSize={28}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F3FA" />
                                                    <XAxis dataKey="term" tick={{ fontSize: 11, fill: '#8896AB' }} />
                                                    <YAxis tick={{ fontSize: 11, fill: '#8896AB' }} />
                                                    <Tooltip formatter={v => [`₦${Number(v).toLocaleString()}`]} contentStyle={{ borderRadius: 10 }} />
                                                    <Legend />
                                                    <Bar dataKey="paid" name="Paid" radius={[4, 4, 0, 0]} fill="#27AE60" />
                                                    <Bar dataKey="pending" name="Pending" radius={[4, 4, 0, 0]} fill="#E63946" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Fee Records */}
                            <div style={s.chartCard}>
                                <h3 style={s.chartTitle}>Fee Records</h3>
                                {data.fees.length === 0 ? (
                                    <div style={s.noData}>💰 No fee records yet</div>
                                ) : (
                                    <div>
                                        <div style={{ ...s.gradeTableHeader, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                                            <span>Student</span>
                                            <span>Fee Type</span>
                                            <span>Term</span>
                                            <span style={{ textAlign: 'right' }}>Amount</span>
                                            <span style={{ textAlign: 'center' }}>Status</span>
                                        </div>
                                        {data.fees.slice(0, 12).map((f, i) => (
                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 16px', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#F8F9FD', borderBottom: '1px solid #F0F3FA', fontSize: 13, gap: 12 }}>
                                                <span style={{ fontWeight: 700, color: '#0D1B3E' }}>{f.studentName || '—'}</span>
                                                <span style={{ color: '#4A5568' }}>{f.feeType || '—'}</span>
                                                <span style={{ color: '#8896AB', fontSize: 12 }}>{f.term?.replace('Term', 'T')?.replace('2025', '') || '—'}</span>
                                                <span style={{ textAlign: 'right', fontWeight: 800, color: '#0D1B3E' }}>₦{Number(f.amount || 0).toLocaleString()}</span>
                                                <span style={{ textAlign: 'center' }}>
                                                    <span style={{ background: f.status === 'paid' ? '#F0FAF4' : '#FFF0F0', color: f.status === 'paid' ? '#27AE60' : '#E63946', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                                                        {f.status === 'paid' ? '✓ Paid' : '⏳ Due'}
                                                    </span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
        </Layout>
    );
}

const s = {
    tabs: { display: 'flex', gap: 4, marginBottom: 28, background: '#fff', borderRadius: 12, padding: 6, border: '1px solid #E8ECF4', width: 'fit-content' },
    tab: { padding: '10px 24px', borderRadius: 9, border: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, color: '#8896AB', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },
    tabActive: { background: '#0D1B3E', color: '#fff' },

    loadingWrap: { textAlign: 'center', padding: '80px 20px' },

    kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 16, marginBottom: 24 },
    kpiCard: { background: '#fff', borderRadius: 14, padding: 18, border: '1.5px solid #E8ECF4', boxShadow: '0 2px 10px rgba(13,27,62,0.06)', transition: 'all 0.3s', cursor: 'default', textAlign: 'center' },
    kpiIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 10px' },
    kpiValue: { fontSize: 26, fontWeight: 900, lineHeight: 1, marginBottom: 4 },
    kpiLabel: { fontSize: 12, color: '#8896AB', fontWeight: 500 },

    chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
    chartCard: { background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E8ECF4', boxShadow: '0 2px 12px rgba(13,27,62,0.06)', marginBottom: 20 },
    chartTitle: { fontSize: 16, fontWeight: 800, color: '#0D1B3E', marginBottom: 20 },
    noData: { textAlign: 'center', padding: '40px 20px', color: '#8896AB', fontSize: 14 },

    feeOverview: { display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'space-around', flexWrap: 'wrap' },
    feeRate: { textAlign: 'center' },
    feeRateValue: { fontSize: 48, fontWeight: 900, lineHeight: 1 },
    feeRateLabel: { fontSize: 13, color: '#8896AB', marginTop: 4 },
    feeLegend: { display: 'flex', flexDirection: 'column', gap: 14 },
    feeLegendItem: { display: 'flex', alignItems: 'center', gap: 10 },

    avgBanner: { background: 'linear-gradient(135deg,#4361EE,#2541C4)', borderRadius: 20, padding: '28px 32px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    avgLabel: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
    avgValue: { fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 4 },
    avgSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
    avgRight: { display: 'flex', gap: 12 },
    avgBadge: { padding: '8px 20px', borderRadius: 12, fontSize: 16, fontWeight: 800 },

    gradeDistList: { display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' },
    gradeDistRow: { display: 'flex', alignItems: 'center', gap: 12 },
    gradeDistBadge: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, flexShrink: 0 },
    gradeDistBarBg: { flex: 1, height: 10, background: '#F0F3FA', borderRadius: 5, overflow: 'hidden' },
    gradeDistBarFill: { height: 10, borderRadius: 5, transition: 'width 0.8s ease' },
    gradeDistCount: { fontSize: 14, fontWeight: 700, color: '#0D1B3E', width: 30, textAlign: 'right', flexShrink: 0 },
    gradeDistPct: { fontSize: 13, fontWeight: 700, width: 36, textAlign: 'right', flexShrink: 0 },

    gradesTable: { borderRadius: 10, overflow: 'hidden', border: '1px solid #E8ECF4' },
    gradeTableHeader: { display: 'flex', padding: '10px 16px', background: '#0D1B3E', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', gap: 12 },
    gradeTableRow: { display: 'flex', padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid #F0F3FA', fontSize: 13, gap: 12 },
    gCell: { flex: 1, color: '#4A5568' },

    attSummary: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 },

    collectionBarBg: { height: 12, background: '#F0F3FA', borderRadius: 6, overflow: 'hidden', margin: '12px 0' },
    collectionBarFill: { height: 12, borderRadius: 6, transition: 'width 0.8s ease' },
};