// src/pages/shared/MessagesPage.js
import React, { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, getDocs, query,
  orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import Layout from '../../components/Layout';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin:'#E63946', teacher:'#2A9D8F',
  student:'#4361EE', parent:'#7B2D8B',
};

export default function MessagesPage() {
  const { profile } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selConv,       setSelConv]       = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [users,         setUsers]         = useState([]);
  const [newMsg,        setNewMsg]        = useState('');
  const [sending,       setSending]       = useState(false);
  const [showNewConv,   setShowNewConv]   = useState(false);
  const [selUser,       setSelUser]       = useState(null);
  const [search,        setSearch]        = useState('');
  const bottomRef = useRef(null);

  // Load users for new conversation
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db,'users'));
      setUsers(snap.docs.map(d => ({ id:d.id, ...d.data() })).filter(u => u.uid !== profile?.uid));
    };
    load();
  }, [profile]);

  // Load conversations
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(query(collection(db,'messages'), orderBy('createdAt','desc')));
      const allMessages = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      const myMessages  = allMessages.filter(m => m.senderId === profile?.uid || m.receiverId === profile?.uid);

      // Group into conversations
      const convMap = {};
      myMessages.forEach(m => {
        const otherId   = m.senderId === profile?.uid ? m.receiverId   : m.senderId;
        const otherName = m.senderId === profile?.uid ? m.receiverName : m.senderName;
        const otherRole = m.senderId === profile?.uid ? m.receiverRole : m.senderRole;
        if (!convMap[otherId]) {
          convMap[otherId] = {
            userId: otherId, userName: otherName,
            userRole: otherRole, messages: [], lastMessage: m,
          };
        }
        convMap[otherId].messages.push(m);
      });
      setConversations(Object.values(convMap));
    };
    load();
  }, [profile]);

  // Real-time messages for selected conversation
  useEffect(() => {
    if (!selConv) return;
    const q  = query(collection(db,'messages'), orderBy('createdAt','asc'));
    const un = onSnapshot(q, snap => {
      const all  = snap.docs.map(d => ({ id:d.id, ...d.data() }));
      const conv = all.filter(m =>
        (m.senderId === profile?.uid && m.receiverId === selConv.userId) ||
        (m.receiverId === profile?.uid && m.senderId === selConv.userId)
      );
      setMessages(conv);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 100);
    });
    return () => un();
  }, [selConv, profile]);

  const handleSend = async () => {
    if (!newMsg.trim() || !selConv) return;
    setSending(true);
    try {
      await addDoc(collection(db,'messages'), {
        senderId:     profile?.uid  || '',
        senderName:   profile?.name || '',
        senderRole:   profile?.role || '',
        receiverId:   selConv.userId,
        receiverName: selConv.userName,
        receiverRole: selConv.userRole,
        text:         newMsg.trim(),
        createdAt:    serverTimestamp(),
      });
      setNewMsg('');
    } catch (e) { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const handleNewConversation = async () => {
    if (!selUser) { toast.error('Select a user first.'); return; }
    const existing = conversations.find(c => c.userId === selUser.uid);
    if (existing) { setSelConv(existing); setShowNewConv(false); return; }
    const newConv = {
      userId:   selUser.uid,
      userName: selUser.name,
      userRole: selUser.role,
      messages: [],
    };
    setConversations(prev => [newConv, ...prev]);
    setSelConv(newConv);
    setShowNewConv(false);
    setSelUser(null);
  };

  const filteredUsers = search
    ? users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.role?.toLowerCase().includes(search.toLowerCase()))
    : users;

  const formatTime = (ts) => {
    if (!ts?.seconds) return '';
    return new Date(ts.seconds * 1000).toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit' });
  };

  return (
    <Layout title="Messages" subtitle="Chat with teachers, students and parents">
      <div style={s.wrapper}>

        {/* Sidebar */}
        <div style={s.sidebar}>
          <div style={s.sidebarHeader}>
            <h3 style={s.sidebarTitle}>Conversations</h3>
            <button style={s.newConvBtn} onClick={() => setShowNewConv(true)} title="New Conversation">✏️</button>
          </div>

          {conversations.length === 0 ? (
            <div style={s.noConvs}>
              <div style={{ fontSize:36, marginBottom:10 }}>💬</div>
              <div style={{ color:'#8896AB', fontSize:13, textAlign:'center' }}>
                No conversations yet.<br />Start one with the ✏️ button.
              </div>
            </div>
          ) : (
            <div style={s.convList}>
              {conversations.map((conv, i) => {
                const color    = ROLE_COLORS[conv.userRole] || '#4361EE';
                const isActive = selConv?.userId === conv.userId;
                const last     = conv.lastMessage;
                return (
                  <button
                    key={conv.userId || i}
                    style={{
                      ...s.convItem,
                      background: isActive ? '#EEF2FF' : '#fff',
                      borderLeft: isActive ? '3px solid #4361EE' : '3px solid transparent',
                    }}
                    onClick={() => setSelConv(conv)}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F8F9FD'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#fff'; }}
                  >
                    <div style={{ ...s.convAvatar, background: color + '20', color }}>
                      {conv.userName?.charAt(0) || '?'}
                    </div>
                    <div style={s.convInfo}>
                      <div style={s.convName}>{conv.userName || 'User'}</div>
                      <div style={{ ...s.convRole, color }}>{conv.userRole}</div>
                      {last && (
                        <div style={s.convLast}>
                          {last.senderId === profile?.uid ? 'You: ' : ''}{last.text?.slice(0, 28)}...
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div style={s.chatArea}>
          {!selConv ? (
            <div style={s.noChat}>
              <div style={{ fontSize:64 }}>💬</div>
              <h3 style={s.noChatTitle}>Select a conversation</h3>
              <p style={s.noChatSub}>Choose from the left or start a new one</p>
              <button style={s.startBtn} onClick={() => setShowNewConv(true)}>
                ✏️ New Conversation
              </button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={s.chatHeader}>
                <div style={{ ...s.chatAvatar, background: (ROLE_COLORS[selConv.userRole] || '#4361EE') + '20', color: ROLE_COLORS[selConv.userRole] || '#4361EE' }}>
                  {selConv.userName?.charAt(0) || '?'}
                </div>
                <div>
                  <div style={s.chatName}>{selConv.userName}</div>
                  <div style={{ ...s.chatRole, color: ROLE_COLORS[selConv.userRole] || '#4361EE' }}>
                    {selConv.userRole?.charAt(0).toUpperCase() + selConv.userRole?.slice(1)}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={s.messageList}>
                {messages.length === 0 ? (
                  <div style={s.noMessages}>
                    <div style={{ fontSize:48, marginBottom:12 }}>👋</div>
                    <div style={{ color:'#8896AB', fontSize:14 }}>
                      Start a conversation with {selConv.userName}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.senderId === profile?.uid;
                    return (
                      <div key={msg.id || i} style={{ ...s.msgWrap, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        {!isMe && (
                          <div style={{ ...s.msgAvatar, background: (ROLE_COLORS[msg.senderRole] || '#4361EE') + '20', color: ROLE_COLORS[msg.senderRole] || '#4361EE' }}>
                            {msg.senderName?.charAt(0)}
                          </div>
                        )}
                        <div style={{
                          ...s.msgBubble,
                          background:   isMe ? 'linear-gradient(135deg,#4361EE,#2541C4)' : '#fff',
                          color:        isMe ? '#fff' : '#0D1B3E',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          border:       isMe ? 'none' : '1px solid #E8ECF4',
                        }}>
                          {!isMe && <div style={{ ...s.msgSender, color: ROLE_COLORS[msg.senderRole] || '#4361EE' }}>{msg.senderName}</div>}
                          <div style={s.msgText}>{msg.text}</div>
                          <div style={{ ...s.msgTime, color: isMe ? 'rgba(255,255,255,0.6)' : '#C0C8D8' }}>
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={s.inputArea}>
                <input
                  type="text"
                  placeholder={`Message ${selConv.userName}...`}
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  style={s.msgInput}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  onFocus={e => { e.target.style.borderColor = '#4361EE'; e.target.style.boxShadow = '0 0 0 3px #4361EE18'; }}
                  onBlur={e => { e.target.style.borderColor = '#E8ECF4'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  style={{ ...s.sendBtn, opacity: sending || !newMsg.trim() ? 0.6 : 1 }}
                  onClick={handleSend}
                  disabled={sending || !newMsg.trim()}
                >
                  {sending ? '...' : '➤'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConv && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowNewConv(false)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>New Conversation</h2>
              <button style={s.modalClose} onClick={() => setShowNewConv(false)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.searchWrap}>
                <span style={{ fontSize:16, color:'#8896AB' }}>🔍</span>
                <input type="text" placeholder="Search by name or role..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={s.searchInput}
                />
              </div>
              <div style={s.userList}>
                {filteredUsers.map(u => {
                  const color = ROLE_COLORS[u.role] || '#4361EE';
                  const isSel = selUser?.uid === u.uid;
                  return (
                    <button key={u.uid || u.id}
                      style={{ ...s.userItem, background: isSel ? '#EEF2FF' : '#F8F9FD', borderColor: isSel ? '#4361EE' : '#E8ECF4' }}
                      onClick={() => setSelUser(u)}
                    >
                      <div style={{ ...s.userAvatar, background: color + '20', color }}>
                        {u.name?.charAt(0) || '?'}
                      </div>
                      <div style={s.userInfo}>
                        <div style={s.userName2}>{u.name}</div>
                        <div style={{ ...s.userRole2, color }}>{u.role}</div>
                      </div>
                      {isSel && <span style={{ color:'#4361EE', fontWeight:700 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              <div style={s.modalFooter}>
                <button style={s.cancelBtn} onClick={() => setShowNewConv(false)}>Cancel</button>
                <button style={s.submitBtn} onClick={handleNewConversation} disabled={!selUser}>
                  Start Conversation →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}} @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(1.05)}}`}</style>
    </Layout>
  );
}

const s = {
  wrapper:  { display:'grid', gridTemplateColumns:'300px 1fr', gap:0, height:'calc(100vh - 130px)', background:'#fff', borderRadius:20, overflow:'hidden', border:'1px solid #E8ECF4', boxShadow:'0 4px 20px rgba(13,27,62,0.08)' },

  sidebar:       { borderRight:'1px solid #E8ECF4', display:'flex', flexDirection:'column', overflow:'hidden' },
  sidebarHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 20px', borderBottom:'1px solid #E8ECF4', flexShrink:0 },
  sidebarTitle:  { fontSize:16, fontWeight:800, color:'#0D1B3E', margin:0 },
  newConvBtn:    { background:'#EEF2FF', border:'none', width:36, height:36, borderRadius:10, cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' },
  noConvs:       { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 },
  convList:      { overflowY:'auto', flex:1 },
  convItem:      { width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 20px', border:'none', cursor:'pointer', transition:'all 0.15s', textAlign:'left', fontFamily:'inherit', background:'#fff' },
  convAvatar:    { width:44, height:44, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, flexShrink:0 },
  convInfo:      { flex:1, minWidth:0 },
  convName:      { fontSize:14, fontWeight:700, color:'#0D1B3E', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  convRole:      { fontSize:11, fontWeight:600, marginTop:1, textTransform:'capitalize' },
  convLast:      { fontSize:12, color:'#8896AB', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },

  chatArea:   { display:'flex', flexDirection:'column', overflow:'hidden' },
  noChat:     { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:32, textAlign:'center' },
  noChatTitle:{ fontSize:20, fontWeight:800, color:'#0D1B3E', margin:0 },
  noChatSub:  { color:'#8896AB', fontSize:14, margin:0 },
  startBtn:   { background:'linear-gradient(135deg,#4361EE,#2541C4)', color:'#fff', border:'none', padding:'12px 24px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', marginTop:8, fontFamily:'inherit' },

  chatHeader: { display:'flex', alignItems:'center', gap:14, padding:'16px 24px', borderBottom:'1px solid #E8ECF4', flexShrink:0, background:'#fff' },
  chatAvatar: { width:44, height:44, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, flexShrink:0 },
  chatName:   { fontSize:16, fontWeight:800, color:'#0D1B3E' },
  chatRole:   { fontSize:12, fontWeight:600, marginTop:2, textTransform:'capitalize' },

  messageList:{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:12, background:'#F8F9FD' },
  noMessages: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' },
  msgWrap:    { display:'flex', alignItems:'flex-end', gap:8 },
  msgAvatar:  { width:32, height:32, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, flexShrink:0 },
  msgBubble:  { maxWidth:'65%', padding:'10px 14px', boxShadow:'0 2px 8px rgba(13,27,62,0.08)' },
  msgSender:  { fontSize:11, fontWeight:700, marginBottom:4, textTransform:'capitalize' },
  msgText:    { fontSize:14, lineHeight:1.5 },
  msgTime:    { fontSize:10, marginTop:4, textAlign:'right' },

  inputArea:  { display:'flex', gap:12, padding:'16px 24px', borderTop:'1px solid #E8ECF4', background:'#fff', flexShrink:0 },
  msgInput:   { flex:1, height:46, padding:'0 16px', border:'1.5px solid #E8ECF4', borderRadius:12, fontSize:14, color:'#0D1B3E', outline:'none', fontFamily:'inherit', transition:'all 0.2s' },
  sendBtn:    { width:46, height:46, borderRadius:12, background:'linear-gradient(135deg,#4361EE,#2541C4)', color:'#fff', border:'none', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' },

  overlay:     { position:'fixed', inset:0, background:'rgba(13,27,62,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, backdropFilter:'blur(4px)' },
  modal:       { background:'#fff', borderRadius:20, width:'100%', maxWidth:480, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 40px 80px rgba(0,0,0,0.3)' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid #E8ECF4' },
  modalTitle:  { fontSize:18, fontWeight:900, color:'#0D1B3E', margin:0 },
  modalClose:  { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#8896AB' },
  modalBody:   { overflowY:'auto', padding:'20px 24px', flex:1 },
  searchWrap:  { display:'flex', alignItems:'center', gap:10, background:'#F8F9FD', border:'1.5px solid #E8ECF4', borderRadius:10, padding:'0 14px', height:44, marginBottom:16 },
  searchInput: { flex:1, border:'none', outline:'none', fontSize:14, color:'#0D1B3E', background:'transparent', fontFamily:'inherit' },
  userList:    { display:'flex', flexDirection:'column', gap:8, maxHeight:300, overflowY:'auto' },
  userItem:    { display:'flex', alignItems:'center', gap:12, padding:'12px 14px', border:'1.5px solid', borderRadius:12, cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit', textAlign:'left' },
  userAvatar:  { width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:17, flexShrink:0 },
  userInfo:    { flex:1 },
  userName2:   { fontSize:14, fontWeight:700, color:'#0D1B3E' },
  userRole2:   { fontSize:12, fontWeight:600, marginTop:2, textTransform:'capitalize' },
  modalFooter: { display:'flex', justifyContent:'flex-end', gap:12, marginTop:20 },
  cancelBtn:   { padding:'10px 20px', border:'1.5px solid #E8ECF4', borderRadius:10, background:'#fff', fontSize:14, fontWeight:600, color:'#8896AB', cursor:'pointer', fontFamily:'inherit' },
  submitBtn:   { padding:'10px 20px', background:'linear-gradient(135deg,#4361EE,#2541C4)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
};