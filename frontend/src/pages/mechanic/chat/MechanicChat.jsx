import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import api from '../../../api/axios';
import './MechanicChat.css';

const MechanicChat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { socket, sendMessage } = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [activeChat, setActiveChat] = useState(location.state?.customerId || null);
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [recentChats, setRecentChats] = useState([]);

    useEffect(() => {
        if (activeChat && recentChats.length > 0) {
            const chat = recentChats.find(c => c.user.id === activeChat);
            if (chat) setActiveChatUser(chat.user);
        }
    }, [activeChat, recentChats]);

    useEffect(() => {
        if (location.state?.customerId) {
            fetchMessages(location.state.customerId);
        }
    }, [location.state]);

    useEffect(() => {
        const loadRecentChats = async () => {
            try {
                const res = await api.get('/messages/recent');
                // Process to get unique chats
                const chats = [];
                const seen = new Set();
                res.data.forEach(msg => {
                    const otherUser = msg.senderId === user.id ? msg.receiver : msg.sender;
                    if (!seen.has(otherUser.id)) {
                        seen.add(otherUser.id);
                        chats.push({
                            user: otherUser,
                            lastMsg: msg.content,
                            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        });
                    }
                });
                setRecentChats(chats);
            } catch (error) {
                console.error('Error loading recent chats:', error);
            }
        };

        if (user) loadRecentChats();
    }, [user, messages]); // Refresh when new messages arrive

    useEffect(() => {
        if (socket) {
            socket.on('receive_message', (message) => {
                setMessages((prev) => [...prev, message]);
            });

            return () => {
                socket.off('receive_message');
            };
        }
    }, [socket]);

    const fetchMessages = async (otherUserId) => {
        try {
            await api.patch('/messages/read', { otherUserId });
            const res = await api.get(`/messages?otherUserId=${otherUserId}`);
            setMessages(res.data);
            setActiveChat(otherUserId);

            // Derive user info from messages if possible
            if (res.data.length > 0) {
                const firstMsg = res.data[0];
                const otherUser = firstMsg.senderId === user.id ? firstMsg.receiver : firstMsg.sender;
                setActiveChatUser(otherUser);
            } else if (otherUserId) {
                // Fallback: Fetch user info if no messages exist yet
                const userRes = await api.get(`/auth/user/${otherUserId}`);
                setActiveChatUser(userRes.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMsg = () => {
        if (!input.trim() || !activeChat) return;

        const messageData = {
            senderId: user.id,
            receiverId: activeChat,
            content: input,
        };

        sendMessage(messageData);
        // Add to local state immediately for responsiveness
        setMessages([...messages, {
            id: Date.now(),
            senderId: user.id,
            content: input,
            createdAt: new Date().toISOString(),
            sender: { id: user.id, name: user.name }
        }]);
        setInput('');
    };

    return (
        <div className="mechanic-chat">
            {/* Sidebar */}
            <div className="mechanic-chat__sidebar">
                <div className="mechanic-chat__sidebar-title">
                    Recent Messages
                </div>
                <div className="mechanic-chat__threads">
                    {recentChats.map(chat => (
                        <div key={chat.user.id} onClick={() => fetchMessages(chat.user.id)}>
                            <ChatThread
                                av={chat.user.name.charAt(0)}
                                name={chat.user.name}
                                msg={chat.lastMsg}
                                time={chat.time}
                                active={activeChat === chat.user.id}
                            />
                        </div>
                    ))}
                    {recentChats.length === 0 && (
                        <div className="mechanic-chat__empty">No recent messages</div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="mechanic-chat__main">
                <div className="mechanic-chat__topbar">
                    <div className="mechanic-chat__active-user">
                        <div className="mechanic-chat__active-avatar">
                            {activeChatUser?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <div className="mechanic-chat__active-name">{activeChatUser?.name || 'Select a chat'}</div>
                            <div className="mechanic-chat__active-subtitle">
                                {activeChatUser ? 'Active Conversation' : 'Pick someone to start chatting'}
                            </div>
                        </div>
                    </div>
                    <button
                        className="mechanic-chat__job-btn"
                        onClick={() => navigate('/mechanic')}
                    >
                        🔧 View Job
                    </button>
                </div>

                <div className="mechanic-chat__messages">
                    <div className="mechanic-chat__day-wrap">
                        <span className="mechanic-chat__day-pill">Today · March 03</span>
                    </div>

                    {messages.map(m => (
                        <div key={m.id} className={`mechanic-chat__msg-wrap ${m.senderId === user.id ? 'mechanic-chat__msg-wrap--mine' : 'mechanic-chat__msg-wrap--other'}`}>
                            <div className={`mechanic-chat__msg-bubble ${m.senderId === user.id ? 'mechanic-chat__msg-bubble--mine' : 'mechanic-chat__msg-bubble--other'}`}>
                                {m.content}
                            </div>
                            <div className="mechanic-chat__msg-time">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    ))}
                </div>

                <div className="mechanic-chat__composer-wrap">
                    <div className="mechanic-chat__composer">
                        <input
                            className="mechanic-chat__input"
                            placeholder={activeChatUser ? `Reply to ${activeChatUser.name}...` : "Select a chat to reply..."}
                            value={input}
                            disabled={!activeChat}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
                        />
                        <button
                            className={`mechanic-chat__send-btn ${input.trim() ? 'mechanic-chat__send-btn--active' : ''}`}
                            onClick={sendMsg}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChatThread = ({ av, name, msg, time, badge, active = false }) => (
    <div className={`mechanic-chat__thread ${active ? 'mechanic-chat__thread--active' : ''}`}>
        <div className="mechanic-chat__thread-avatar mechanic-chat__thread-avatar--default">{av}</div>
        <div className="mechanic-chat__thread-main">
            <div className="mechanic-chat__thread-top">
                <span className="mechanic-chat__thread-name">{name}</span>
                <span className="mechanic-chat__thread-time">{time}</span>
            </div>
            <div className="mechanic-chat__thread-bottom">
                <span className={`mechanic-chat__thread-msg ${active ? 'mechanic-chat__thread-msg--active' : ''}`}>{msg}</span>
                {badge && <div className="mechanic-chat__thread-badge">{badge}</div>}
            </div>
        </div>
    </div>
);

export default MechanicChat;


