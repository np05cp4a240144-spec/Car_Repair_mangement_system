import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import api from '../../../api/axios';
import './AdminSupportChat.css';

const AdminSupportChat = () => {
  const { user } = useAuth();
  const { socket, sendMessage } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [supportWindow, setSupportWindow] = useState(null);

  useEffect(() => {
    const loadRecentChats = async () => {
      try {
        const res = await api.get('/messages/recent');
        const chats = [];
        const seen = new Set();

        for (const msg of res.data) {
          const otherUser = msg.senderId === user.id ? msg.receiver : msg.sender;
          if (otherUser?.id === user.id || seen.has(otherUser?.id)) continue;
          seen.add(otherUser.id);
          chats.push({
            user: otherUser,
            lastMsg: msg.content,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }

        setRecentChats(chats);
      } catch (error) {
        console.error('Error loading admin support chats:', error);
      }
    };

    if (user) loadRecentChats();
  }, [user, messages]);

  useEffect(() => {
    if (!socket) return;
    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => socket.off('receive_message');
  }, [socket]);

  useEffect(() => {
    const loadSupportStatus = async () => {
      if (!activeChat) {
        setSupportWindow(null);
        return;
      }

      try {
        const res = await api.get(`/messages/payment-support/status?customerId=${activeChat}`);
        setSupportWindow(res.data?.supportWindow || null);
      } catch {
        setSupportWindow(null);
      }
    };

    loadSupportStatus();
  }, [activeChat, messages]);

  const fetchMessages = async (otherUserId) => {
    try {
      await api.patch('/messages/read', { otherUserId });
      const res = await api.get(`/messages?otherUserId=${otherUserId}`);
      setMessages(res.data);
      setActiveChat(otherUserId);

      if (res.data.length > 0) {
        const firstMsg = res.data[0];
        const otherUser = firstMsg.senderId === user.id ? firstMsg.receiver : firstMsg.sender;
        setActiveChatUser(otherUser);
      } else {
        const userRes = await api.get(`/auth/user/${otherUserId}`);
        setActiveChatUser(userRes.data);
      }
    } catch (error) {
      console.error('Error fetching admin support messages:', error);
    }
  };

  const sendMsg = () => {
    if (!input.trim() || !activeChat) return;

    const payload = {
      senderId: user.id,
      receiverId: activeChat,
      content: input.trim()
    };

    sendMessage(payload);
    setMessages((prev) => ([
      ...prev,
      {
        id: Date.now(),
        senderId: user.id,
        content: input.trim(),
        createdAt: new Date().toISOString(),
        sender: { id: user.id, name: user.name }
      }
    ]));
    setInput('');
  };

  const markSolved = async () => {
    if (!activeChat) return;

    try {
      await api.patch('/messages/payment-support/solve', { customerId: activeChat });
      setSupportWindow({ canMessage: false, reason: 'solved' });
      const res = await api.get(`/messages?otherUserId=${activeChat}`);
      setMessages(res.data || []);
    } catch (error) {
      console.error('Error marking payment support solved:', error);
    }
  };

  return (
    <div className="mechanic-chat">
      <div className="mechanic-chat__sidebar">
        <div className="mechanic-chat__sidebar-title">Payment Support Chats</div>
        <div className="mechanic-chat__threads">
          {recentChats.map((chat) => (
            <div key={chat.user.id} onClick={() => fetchMessages(chat.user.id)}>
              <ChatThread
                av={chat.user.name?.charAt(0) || '?'}
                name={chat.user.name || 'Customer'}
                msg={chat.lastMsg}
                time={chat.time}
                active={activeChat === chat.user.id}
              />
            </div>
          ))}
          {recentChats.length === 0 && (
            <div className="mechanic-chat__empty">No support chats yet.</div>
          )}
        </div>
      </div>

      <div className="mechanic-chat__main">
        <div className="mechanic-chat__topbar">
          <div className="mechanic-chat__active-user">
            <div className="mechanic-chat__active-avatar">{activeChatUser?.name?.charAt(0) || '?'}</div>
            <div>
              <div className="mechanic-chat__active-name">{activeChatUser?.name || 'Select a customer'}</div>
              <div className="mechanic-chat__active-subtitle">Admin payment support channel</div>
            </div>
          </div>
            {activeChat && (
              <button
                className="admin-chat__solve-btn"
                onClick={markSolved}
                type="button"
                disabled={supportWindow && supportWindow.canMessage === false}
              >
                {supportWindow && supportWindow.canMessage === false ? 'Solved' : 'Mark as Solved'}
              </button>
            )}
        </div>

          {supportWindow && !supportWindow.canMessage && (
            <div className="customer-chat-main__support-banner">
              Payment support window is closed for this customer ({supportWindow.reason}).
            </div>
          )}

        <div className="mechanic-chat__messages">
          {messages.map((m) => {
            const isPaymentFail = /payment failed|payment-failure|payment unsuccessful/i.test(m.content);
            return (
              <div key={m.id} className={`admin-chat__msg-wrap ${m.senderId === user.id ? 'admin-chat__msg-wrap--mine' : 'admin-chat__msg-wrap--other'}`}>
                <div
                  className={`admin-chat__msg-bubble ${m.senderId === user.id ? 'admin-chat__msg-bubble--mine' : 'admin-chat__msg-bubble--other'} ${isPaymentFail ? 'admin-chat__msg-bubble--alert' : ''}`}
                  style={isPaymentFail ? { background: '#fff4e5', border: '1px solid #f97316', color: '#9a3412', fontWeight: 600, borderRadius: '8px', padding: '10px' } : {}}>
                  {isPaymentFail ? (
                    <>
                      <span style={{ display: 'block', fontWeight: 700, color: '#d97706', marginBottom: 4 }}>Payment Alert</span>
                      <span>{m.content}</span>
                    </>
                  ) : m.content}
                </div>
                <div className="admin-chat__msg-time">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            );
          })}
        </div>

        <div className="mechanic-chat__composer-wrap">
          <div className="mechanic-chat__composer">
            <input
              className="mechanic-chat__input"
              placeholder={activeChatUser ? `Reply to ${activeChatUser.name}...` : 'Select a chat to reply...'}
              value={input}
              disabled={!activeChat}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
            />
            <button className={`mechanic-chat__send-btn ${input.trim() ? 'mechanic-chat__send-btn--active' : ''}`} onClick={sendMsg}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatThread = ({ av, name, msg, time, active = false }) => (
  <div className={`mechanic-chat__thread ${active ? 'mechanic-chat__thread--active' : ''}`}>
    <div className="mechanic-chat__thread-avatar mechanic-chat__thread-avatar--default">{av}</div>
    <div className="mechanic-chat__thread-main">
      <div className="mechanic-chat__thread-top">
        <span className="mechanic-chat__thread-name">{name}</span>
        <span className="mechanic-chat__thread-time">{time}</span>
      </div>
      <div className="mechanic-chat__thread-bottom">
        <span className={`mechanic-chat__thread-msg ${active ? 'mechanic-chat__thread-msg--active' : ''}`}>{msg}</span>
      </div>
    </div>
  </div>
);

export default AdminSupportChat;

