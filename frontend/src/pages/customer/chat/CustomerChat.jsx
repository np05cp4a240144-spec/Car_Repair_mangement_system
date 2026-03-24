import './CustomerChat.css';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import api from '../../../api/axios';

const CustomerChat = () => {
    const location = useLocation();
    const { user } = useAuth();
    const { socket, sendMessage } = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [activeChat, setActiveChat] = useState(location.state?.supportUserId || location.state?.mechanicId || null);
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [recentChats, setRecentChats] = useState([]);
    const [isSupportMode, setIsSupportMode] = useState(Boolean(location.state?.supportMode));
    const [supportWindow, setSupportWindow] = useState({ canMessage: true, reason: 'active' });

    useEffect(() => {
        if (activeChat && recentChats.length > 0) {
            const chat = recentChats.find((c) => c.user.id === activeChat);
            if (chat) setActiveChatUser(chat.user);
        }
    }, [activeChat, recentChats]);

    useEffect(() => {
        if (activeChatUser?.role === 'ADMIN') {
            setIsSupportMode(true);
        }
    }, [activeChatUser]);

    useEffect(() => {
        if (location.state?.mechanicId) {
            fetchMessages(location.state.mechanicId);
        }
        if (location.state?.supportUserId) {
            setIsSupportMode(Boolean(location.state?.supportMode));
            fetchMessages(location.state.supportUserId);
        }
    }, [location.state]);

    useEffect(() => {
        const loadSupportStatus = async () => {
            if (!isSupportMode || !activeChat || activeChatUser?.role !== 'ADMIN') return;
            try {
                const res = await api.get(`/messages/payment-support/status?adminId=${activeChat}`);
                setSupportWindow(res.data?.supportWindow || { canMessage: false, reason: 'not_started' });
            } catch (error) {
                console.error('Error loading support status:', error);
            }
        };

        loadSupportStatus();
    }, [isSupportMode, activeChat, activeChatUser]);

    useEffect(() => {
        const loadRecentChats = async () => {
            try {
                const res = await api.get('/messages/recent');
                const chats = [];
                const seen = new Set();
                res.data.forEach((msg) => {
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
    }, [user, messages]);

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
            const isSupportTarget = Boolean(
                location.state?.supportMode &&
                Number(location.state?.supportUserId) === Number(otherUserId)
            );
            setIsSupportMode(isSupportTarget);
            if (!isSupportTarget) {
                setSupportWindow({ canMessage: true, reason: 'active' });
            }

            const res = await api.get(`/messages?otherUserId=${otherUserId}`);
            setMessages(res.data);
            setActiveChat(otherUserId);

            if (res.data.length > 0) {
                const firstMsg = res.data[0];
                const otherUser = firstMsg.senderId === user.id ? firstMsg.receiver : firstMsg.sender;
                setActiveChatUser(otherUser);
            } else if (otherUserId) {
                const userRes = await api.get(`/auth/user/${otherUserId}`);
                setActiveChatUser(userRes.data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessageHandler = async () => {
        if (!input.trim() || !activeChat) return;

        const currentInput = input.trim();
        setInput('');

        const isAdminChat = activeChatUser?.role === 'ADMIN';

        if (isAdminChat) {
            if (!supportWindow?.canMessage) {
                return;
            }
            try {
                const res = await api.post('/messages/payment-support/send', {
                    adminId: activeChat,
                    content: currentInput
                });

                setMessages((prev) => [...prev, ...(res.data?.messages || [])]);
                return;
            } catch (error) {
                console.error('Error sending support message:', error);
                if (error?.response?.data?.supportWindow) {
                    setSupportWindow(error.response.data.supportWindow);
                }
                return;
            }
        }

        const messageData = {
            senderId: user.id,
            receiverId: activeChat,
            content: currentInput
        };

        sendMessage(messageData);
        setMessages((prev) => ([
            ...prev,
            {
                id: Date.now(),
                senderId: user.id,
                content: currentInput,
                createdAt: new Date().toISOString(),
                sender: { id: user.id, name: user.name }
            }
        ]));
    };

    return (
        <div className="customer-chat-page">
            <div className="customer-chat-sidebar">
                <div className="customer-chat-sidebar__head">
                    <div className="customer-chat-sidebar__title-row">
                        <h2 className="customer-chat-sidebar__title">Messages</h2>
                        <div className="customer-chat-sidebar__add-btn">+</div>
                    </div>
                    <div className="customer-chat-sidebar__search-wrap">
                        <input className="customer-chat-sidebar__search-input" placeholder="Search conversations..." />
                        <span className="customer-chat-sidebar__search-icon">S</span>
                    </div>
                </div>

                <div className="customer-chat-sidebar__list">
                    {recentChats.map((chat) => (
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
                        <div className="customer-chat-sidebar__empty">No recent messages</div>
                    )}
                </div>
            </div>

            <div className="customer-chat-main">
                <div className="customer-chat-main__header">
                    <div className="customer-chat-main__user-wrap">
                        <div className="customer-chat-main__avatar">{activeChatUser?.name?.charAt(0) || '?'}</div>
                        <div>
                            <div className="customer-chat-main__name">{activeChatUser?.name || 'Select a Conversation'}</div>
                            <div className="customer-chat-main__presence">
                                <span className={`customer-chat-main__presence-dot ${activeChatUser ? 'customer-chat-main__presence-dot--on' : 'customer-chat-main__presence-dot--off'}`}></span>
                                {activeChatUser ? 'Online | Ready to Help' : 'Start a chat with your mechanic'}
                            </div>
                        </div>
                    </div>
                    <button className="customer-chat-main__menu-btn">...</button>
                </div>

                <div className="customer-chat-main__messages">
                    {isSupportMode && (
                        <div className="customer-chat-main__support-banner">
                            {supportWindow?.canMessage
                                ? 'Payment Support AI is active. Admin team will also see this conversation.'
                                : `Payment support chat is closed (${supportWindow?.reason || 'closed'}).`}
                        </div>
                    )}
                    <div className="customer-chat-main__day-marker-wrap">
                        <span className="customer-chat-main__day-marker">Today | March 03</span>
                    </div>

                    {messages.map((m) => (
                        <div key={m.id} className={`customer-chat-bubble-wrap ${m.senderId === user.id ? 'customer-chat-bubble-wrap--mine' : 'customer-chat-bubble-wrap--theirs'}`}>
                            {m.senderId !== user.id && (
                                <div className="customer-chat-bubble-wrap__sender-row">
                                    <div className="customer-chat-bubble-wrap__sender-avatar">{m.sender?.name?.charAt(0)}</div>
                                    <span className="customer-chat-bubble-wrap__sender-name">{m.sender?.name}</span>
                                </div>
                            )}

                            <div className={`customer-chat-bubble ${m.senderId === user.id ? 'customer-chat-bubble--mine' : 'customer-chat-bubble--theirs'}`}>
                                {m.content}
                            </div>

                            <div className="customer-chat-bubble__time">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="customer-chat-main__composer">
                    <div className="customer-chat-main__composer-inner">
                        <div className="customer-chat-main__input-wrap">
                            <input
                                className="customer-chat-main__input"
                                placeholder={activeChatUser ? `Message ${activeChatUser.name}...` : 'Select a chat to message...'}
                                value={input}
                                disabled={!activeChat || (activeChatUser?.role === 'ADMIN' && !supportWindow?.canMessage)}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessageHandler()}
                            />
                            <button
                                className={`customer-chat-main__send-btn ${input.trim() ? 'customer-chat-main__send-btn--active' : ''}`}
                                disabled={activeChatUser?.role === 'ADMIN' && !supportWindow?.canMessage}
                                onClick={sendMessageHandler}
                            >
                                {'>'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChatThread = ({ av, name, msg, time, badge, active = false }) => (
    <div className={`customer-chat-thread ${active ? 'customer-chat-thread--active' : ''}`}>
        <div className="customer-chat-thread__avatar-wrap">
            <div className="customer-chat-thread__avatar">{av}</div>
            {active && <div className="customer-chat-thread__online-dot"></div>}
        </div>
        <div className="customer-chat-thread__meta">
            <div className="customer-chat-thread__top">
                <span className="customer-chat-thread__name">{name}</span>
                <span className="customer-chat-thread__time">{time}</span>
            </div>
            <div className="customer-chat-thread__bottom">
                <span className={`customer-chat-thread__msg ${active ? 'customer-chat-thread__msg--active' : ''}`}>{msg}</span>
                {badge && <span className="customer-chat-thread__badge">{badge}</span>}
            </div>
        </div>
    </div>
);

export default CustomerChat;
