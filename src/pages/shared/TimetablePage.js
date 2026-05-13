// src/pages/shared/TimetablePage.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

const SUBJECT_COLORS = {
  'Mathematics':'#4361EE','English Language':'#2A9D8F','Biology':'#27AE60',
  'Chemistry':'#E63946','Physics':'#F5A623','History':'#6F42C1',
  'Geography':'#E84393','Economics':'#20C997','Further Maths':'#3498DB',
  'Computer Science':'#0D1B3E','Free Period':'#8896AB',
  'Assembly':'#F5A623','Closing':'#8896AB',
};

const SUBJECT_ICONS = {
  'Mathematics':'🔢','English Language':'📖','Biology':'🧬',
  'Chemistry':'⚗️','Physics':'⚡','History':'📜',
  'Geography':'🌍','Economics':'📈','Further Maths':'📐',
  'Computer Science':'💻','Free Period':'☕',
  'Assembly':'📣','Closing':'🔔',
};

export default function TimetablePage() {
  const { profile }   = useAuth();
  const todayIdx      = Math.min(Math.max(new Date().getDay() - 1, 0), 4);
  const [view,        setView]       = useState('week');
  const [activeDay,   setActiveDay]  = useState(todayIdx);
  const [timetable,   setTimetable]  = useState({});
  const [loading,     setLoading]    = useState(true);
  const [selClass,    setSelClass]   = useState('');

  // Determine which class to show
  useEffect(() => {
    if (profile?.role === 'student') {
      setSelClass(profile?.className || '');
    } else if (profile?.role === 'parent') {
      setSelClass(profile?.childClass || '');
    } else if (profile?.role === 'teacher') {
      setSelClass('Grade 10A'); // default for teacher
    }
  }, [profile]);

  // Load timetable from Firestore
  useEffect(() => {
    if (!selClass) return;
    const load = async () => {
      setLoading(true);
      try {
        const result = {};
        for (const day of DAYS) {
          const snap = await getDocs(
            collection(db, 'timetable', selClass, 'days', day, 'periods')
          );
          result[day] = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => a.time?.localeCompare(b.time));
        }
        setTimetable(result);
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    };
    load();
  }, [selClass]);

  const now         = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const isCurrentClass = (dayIdx, period) => {
    if (dayIdx !== todayIdx) return false;
    const start = parseTime(period.time);
    const end   = parseTime(period.endTime);
    return currentMins >= start && currentMins < end;
  };

  // For teachers — class selector
  const CLASSES = ['Grade 10A','Grade 10B','Grade 11A','Grade 11B','Grade 12A','Grade 12B'];

  return (
    <Layout
      title="Class Timetable"
      subtitle={selClass ? `${selClass} Schedule` : 'Weekly schedule'}
    >

      {/* Teacher class selector */}
      {profile?.role === 'teacher' && (
        <div style={s.classSelector}>
          {CLASSES.map(c => (
            <button
              key={c}
              style={{
                ...s.classSelectorBtn,
                background:  selClass === c ? 'linear-gradient(135deg,#2A9D8F,#1A6B64)' : '#fff',
                color:       selClass === c ? '#fff' : '#8896AB',
                borderColor: selClass === c ? '#2A9D8F' : '#E8ECF4',
              }}
              onClick={() => setSelClass(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* View toggle */}
      <div style={s.viewToggle}>
        <button
          style={{ ...s.toggleBtn, ...(view === 'week' ? s.toggleBtnActive : {}) }}
          onClick={() => setView('week')}
        >
          📅 Week View
        </button>
        <button
          style={{ ...s.toggleBtn, ...(view === 'day' ? s.toggleBtnActive : {}) }}
          onClick={() => setView('day')}
        >
          📆 Day View
        </button>
        {selClass && (
          <div style={s.classLabel}>
            🏫 {selClass}
          </div>
        )}
      </div>

      {loading ? (
        <div style={s.loadingWrap}>
          {[1,2,3].map(i => <div key={i} style={s.skeleton} />)}
        </div>
      ) : view === 'day' ? (

        <>
          {/* Day selector */}
          <div style={s.daySelector}>
            {DAYS.map((day, i) => (
              <button
                key={day}
                onClick={() => setActiveDay(i)}
                style={{
                  ...s.dayBtn,
                  background: activeDay === i
                    ? 'linear-gradient(135deg,#4361EE,#2541C4)' : '#fff',
                  color:      activeDay === i ? '#fff' : '#8896AB',
                  border:     activeDay === i ? 'none' : '1.5px solid #E8ECF4',
                  fontWeight: activeDay === i ? 700 : 500,
                }}
              >
                <div style={s.dayBtnName}>{day.slice(0, 3)}</div>
                <div style={s.dayBtnCount}>
                  {(timetable[day] || []).length} classes
                </div>
                {i === todayIdx && (
                  <div style={{
                    ...s.todayDot,
                    background: activeDay === i ? '#7FFF00' : '#4361EE',
                  }} />
                )}
              </button>
            ))}
          </div>

          {/* Day classes */}
          <div style={s.dayClasses}>
            {(timetable[DAYS[activeDay]] || []).length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#0D1B3E' }}>
                  No classes on {DAYS[activeDay]}
                </div>
                <div style={{ fontSize:13, color:'#8896AB', marginTop:4 }}>
                  The timetable for this day hasn't been set yet
                </div>
              </div>
            ) : (
              (timetable[DAYS[activeDay]] || []).map((cls, i) => {
                const color = SUBJECT_COLORS[cls.subject] || '#8896AB';
                const isNow = isCurrentClass(activeDay, cls);
                const isPast = activeDay === todayIdx && currentMins > parseTime(cls.endTime);
                return (
                  <div
                    key={cls.id || i}
                    style={{
                      ...s.dayClassCard,
                      opacity:   isPast ? 0.55 : 1,
                      border:    isNow ? `2px solid ${color}` : '1px solid #E8ECF4',
                      background:isNow ? color + '08' : '#fff',
                    }}
                  >
                    <div style={{ ...s.dayClassStrip, background: color }} />
                    <div style={s.dayClassTime}>
                      <div style={s.timeText}>{cls.time}</div>
                      <div style={s.timeSep}>—</div>
                      <div style={s.timeEnd}>{cls.endTime}</div>
                    </div>
                    <div style={s.dayClassIcon}>
                      <span style={{ fontSize:28 }}>
                        {SUBJECT_ICONS[cls.subject] || '📚'}
                      </span>
                    </div>
                    <div style={s.dayClassInfo}>
                      <div style={{ ...s.daySubject, color }}>{cls.subject}</div>
                      {cls.teacher && (
                        <div style={s.dayTeacher}>👤 {cls.teacher}</div>
                      )}
                      {cls.room && (
                        <div style={s.dayRoom}>📍 {cls.room}</div>
                      )}
                    </div>
                    {isNow && (
                      <div style={s.nowBadge}>
                        <div style={s.nowDot} />
                        NOW
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>

      ) : (

        /* Week View */
        <div style={s.weekGrid}>
          {DAYS.map((day, di) => (
            <div key={day} style={s.weekCol}>
              <div style={{
                ...s.weekColHeader,
                background: di === todayIdx
                  ? 'linear-gradient(135deg,#4361EE,#2541C4)' : '#0D1B3E',
              }}>
                <div style={s.weekColDay}>{day.slice(0, 3)}</div>
                <div style={s.weekColFull}>{day}</div>
                {di === todayIdx && (
                  <div style={s.weekTodayBadge}>Today</div>
                )}
              </div>
              <div style={s.weekClassList}>
                {(timetable[day] || []).length === 0 ? (
                  <div style={s.weekEmpty}>No classes</div>
                ) : (
                  (timetable[day] || []).map((cls, ci) => {
                    const color = SUBJECT_COLORS[cls.subject] || '#8896AB';
                    const isNow = isCurrentClass(di, cls);
                    return (
                      <div
                        key={cls.id || ci}
                        style={{
                          ...s.weekClass,
                          borderLeft:  `4px solid ${color}`,
                          background:  isNow ? color + '12' : '#F8F9FD',
                          boxShadow:   isNow ? `0 4px 12px ${color}25` : 'none',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform  = 'translateX(3px)';
                          e.currentTarget.style.background = color + '18';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform  = 'translateX(0)';
                          e.currentTarget.style.background = isNow ? color + '12' : '#F8F9FD';
                        }}
                      >
                        <div style={s.weekClassTime}>{cls.time}</div>
                        <div style={{ ...s.weekClassSubject, color }}>
                          {cls.subject}
                        </div>
                        {cls.room && (
                          <div style={s.weekClassRoom}>📍 {cls.room}</div>
                        )}
                        {isNow && <span style={s.weekNowDot} />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

const s = {
  classSelector:    { display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 },
  classSelectorBtn: { padding:'8px 16px', borderRadius:10, border:'1.5px solid', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },

  viewToggle:      { display:'flex', gap:8, marginBottom:24, alignItems:'center' },
  toggleBtn:       { padding:'10px 24px', border:'1.5px solid #E8ECF4', borderRadius:10, background:'#fff', fontSize:14, fontWeight:600, color:'#8896AB', cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit' },
  toggleBtnActive: { borderColor:'#4361EE', background:'#4361EE', color:'#fff' },
  classLabel:      { marginLeft:'auto', background:'#EEF2FF', color:'#4361EE', fontSize:13, fontWeight:700, padding:'6px 16px', borderRadius:20 },

  loadingWrap: { display:'flex', flexDirection:'column', gap:12 },
  skeleton:    { height:80, borderRadius:14, background:'linear-gradient(90deg,#F0F3FA 25%,#E8ECF4 50%,#F0F3FA 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' },

  daySelector: { display:'flex', gap:10, marginBottom:24, flexWrap:'wrap' },
  dayBtn: {
    flex:1, minWidth:100, padding:'14px 12px', borderRadius:14,
    cursor:'pointer', textAlign:'center', transition:'all 0.2s',
    fontFamily:'inherit', position:'relative',
  },
  dayBtnName:  { fontSize:18, fontWeight:800, marginBottom:2 },
  dayBtnCount: { fontSize:11, opacity:0.7 },
  todayDot:    { width:6, height:6, borderRadius:'50%', margin:'4px auto 0' },

  dayClasses:    { display:'flex', flexDirection:'column', gap:12 },
  dayClassCard:  { display:'flex', alignItems:'center', borderRadius:16, overflow:'hidden', transition:'all 0.3s ease' },
  dayClassStrip: { width:5, alignSelf:'stretch', flexShrink:0 },
  dayClassTime:  { width:80, padding:'16px 12px', textAlign:'center', flexShrink:0, borderRight:'1px solid #F0F3FA' },
  timeText:      { fontSize:14, fontWeight:800, color:'#0D1B3E' },
  timeSep:       { fontSize:10, color:'#C0C8D8', margin:'2px 0' },
  timeEnd:       { fontSize:12, color:'#8896AB' },
  dayClassIcon:  { width:60, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  dayClassInfo:  { flex:1, padding:'16px 16px' },
  daySubject:    { fontSize:16, fontWeight:800, marginBottom:4 },
  dayTeacher:    { fontSize:13, color:'#4A5568', marginBottom:3 },
  dayRoom:       { fontSize:12, color:'#8896AB' },
  nowBadge:      { display:'flex', alignItems:'center', gap:6, background:'#4361EE', color:'#fff', fontSize:11, fontWeight:800, padding:'4px 14px', borderRadius:20, marginRight:16, letterSpacing:1, flexShrink:0 },
  nowDot:        { width:6, height:6, borderRadius:'50%', background:'#7FFF00' },

  weekGrid:       { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 },
  weekCol:        { display:'flex', flexDirection:'column', gap:8 },
  weekColHeader:  { padding:'14px 12px', textAlign:'center', color:'#fff', borderRadius:12, marginBottom:4 },
  weekColDay:     { fontSize:20, fontWeight:900 },
  weekColFull:    { fontSize:11, opacity:0.8, marginTop:2 },
  weekTodayBadge: { background:'rgba(255,255,255,0.2)', fontSize:10, fontWeight:700, padding:'2px 10px', borderRadius:20, margin:'4px auto 0', display:'inline-block' },
  weekClassList:  { display:'flex', flexDirection:'column', gap:8 },
  weekClass:      { borderRadius:10, padding:'10px 12px', cursor:'default', transition:'all 0.2s', position:'relative' },
  weekClassTime:  { fontSize:10, color:'#8896AB', marginBottom:4, fontWeight:600 },
  weekClassSubject:{ fontSize:12, fontWeight:800, marginBottom:3 },
  weekClassRoom:  { fontSize:10, color:'#8896AB' },
  weekNowDot:     { position:'absolute', top:8, right:8, width:6, height:6, borderRadius:'50%', background:'#27AE60' },
  weekEmpty:      { padding:'16px 10px', textAlign:'center', fontSize:12, color:'#C0C8D8', background:'#F8F9FD', borderRadius:10 },

  empty: { textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:16, border:'1px solid #E8ECF4' },
};