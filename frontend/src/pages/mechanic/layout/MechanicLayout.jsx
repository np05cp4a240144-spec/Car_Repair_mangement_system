import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import api from '../../../api/axios';
import './MechanicLayout.css';
import {
    Wrench,
    Calendar,
    MessageSquare,
    Package,
    Settings,
    Bell,
    AlertTriangle,
    Clock3,
    CheckCircle2
} from 'lucide-react';

const MechanicLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const [time, setTime] = useState(new Date());
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState([]);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const bellContainerRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!bellContainerRef.current?.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const [jobsRes, unreadRes] = await Promise.all([
                    api.get('/bookings/mechanic'),
                    api.get('/messages/unread-count')
                ]);

                const jobs = jobsRes.data || [];
                const unreadMessages = unreadRes.data?.unreadCount || 0;
                setUnreadMessageCount(unreadMessages);

                const pendingJobs = jobs.filter((job) => job.status === 'Pending').length;
                const activeJobs = jobs.filter((job) => job.status === 'In Progress').length;
                const readyForPickup = jobs.filter(
                    (job) => job.stage === 'Ready for Pickup' && job.status !== 'Completed' && job.status !== 'Cancelled'
                ).length;

                const nextNotifications = [];

                if (pendingJobs > 0) {
                    nextNotifications.push({
                        id: `new-assigned-${pendingJobs}`,
                        type: 'warning',
                        title: 'New assignments',
                        message: `${pendingJobs} job(s) are waiting to be started.`
                    });
                }

                if (activeJobs > 0) {
                    nextNotifications.push({
                        id: `active-jobs-${activeJobs}`,
                        type: 'info',
                        title: 'Current workload',
                        message: `${activeJobs} job(s) are currently in progress.`
                    });
                }

                if (readyForPickup > 0) {
                    nextNotifications.push({
                        id: `pickup-ready-${readyForPickup}`,
                        type: 'warning',
                        title: 'Pickup ready',
                        message: `${readyForPickup} vehicle(s) are ready for pickup.`
                    });
                }

                if (unreadMessages > 0) {
                    nextNotifications.push({
                        id: `unread-messages-${unreadMessages}`,
                        type: 'warning',
                        title: 'Unread messages',
                        message: `${unreadMessages} message(s) are unread in your inbox.`
                    });
                }

                setNotifications((prev) => {
                    const realtimeNotifications = prev.filter((item) => item.isRealtime);
                    const baseNotifications = nextNotifications.filter(
                        (item) => !realtimeNotifications.some((existing) => existing.id === item.id)
                    );
                    return [...realtimeNotifications, ...baseNotifications];
                });
            } catch (error) {
                console.error('Error fetching mechanic notifications:', error);
                setNotifications([]);
                setUnreadMessageCount(0);
            }
        };

        fetchNotifications();

        const intervalId = setInterval(fetchNotifications, 15000);
        return () => clearInterval(intervalId);
    }, [location.pathname]);

    useEffect(() => {
        if (!socket) return;

        const handleJobAssigned = (payload = {}) => {
            const notificationId = `mechanic-assigned-${payload.appointmentId || Date.now()}`;

            setNotifications((prev) => {
                const withoutDuplicate = prev.filter((item) => item.id !== notificationId);
                return [{
                    id: notificationId,
                    type: 'warning',
                    title: 'New job assigned',
                    message: payload.message || `You have been assigned job #${payload.appointmentId}.`,
                    isRealtime: true
                }, ...withoutDuplicate];
            });

            setDismissedNotificationIds((prev) => prev.filter((id) => id !== notificationId));
        };

        socket.on('mechanic_job_assigned', handleJobAssigned);
        return () => socket.off('mechanic_job_assigned', handleJobAssigned);
    }, [socket]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatTime = (date) => {
        return [date.getHours(), date.getMinutes(), date.getSeconds()]
            .map(v => String(v).padStart(2, '0'))
            .join(':');
    };

    const getInitials = (name) => {
        if (!name) return 'M';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('schedule')) return 'My Schedule';
        if (path.includes('chat')) return 'Messages';
        if (path.includes('parts')) return 'Parts Inventory';
        if (path.includes('profile')) return 'Settings';
        return 'My Jobs';
    };

    const unreadCount = useMemo(
        () => notifications.filter((item) => item.type === 'warning' && !dismissedNotificationIds.includes(item.id)).length,
        [notifications, dismissedNotificationIds]
    );

    const markAllAsRead = () => {
        setDismissedNotificationIds(notifications.map((item) => item.id));
    };

    const renderNotificationIcon = (type) => {
        if (type === 'warning') return <AlertTriangle size={14} />;
        if (type === 'success') return <CheckCircle2 size={14} />;
        return <Clock3 size={14} />;
    };

    return (
        <div className="mechanic-layout">
            {/* SIDEBAR - Student Edition */}
            <nav className="mechanic-layout__sidebar">
                <div className="mechanic-layout__brand" onClick={() => navigate('/mechanic')}>
                    <div className="mechanic-layout__brand-badge">A</div>
                    <div>
                        <div className="mechanic-layout__brand-title">Auto Assist</div>
                        <div className="mechanic-layout__brand-subtitle">Mechanic V1</div>
                    </div>
                </div>

                <div className="mechanic-layout__nav-wrap">
                    <div className="mechanic-layout__nav-title">Main</div>
                    <SidebarLink to="/mechanic" icon={<Wrench size={18} />} label="My Jobs" end />
                    <SidebarLink to="/mechanic/schedule" icon={<Calendar size={18} />} label="Schedule" />
                    <SidebarLink
                        to="/mechanic/chat"
                        icon={<MessageSquare size={18} />}
                        label="Messages"
                        badge={unreadMessageCount > 0 ? String(unreadMessageCount) : null}
                    />

                    <div className="mechanic-layout__nav-title mechanic-layout__nav-title--spaced">Tools</div>
                    <SidebarLink to="/mechanic/parts" icon={<Package size={18} />} label="Inventory" />
                    <SidebarLink to="/mechanic/profile" icon={<Settings size={18} />} label="Settings" />
                </div>

                <div className="mechanic-layout__user-card">
                    <div className="mechanic-layout__user-row">
                        <div className="mechanic-layout__avatar">
                            {getInitials(user?.name)}
                        </div>
                        <div className="mechanic-layout__user-meta">
                            <div className="mechanic-layout__user-name">{user?.name || 'Mechanic'}</div>
                            <div className="mechanic-layout__user-role">Mechanic</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mechanic-layout__logout-btn"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <div className="mechanic-layout__main">
                <header className="mechanic-layout__header">
                    <h1 className="mechanic-layout__title">{getPageTitle()}</h1>

                    <div className="mechanic-layout__header-right">
                        <div className="mechanic-layout__online-pill">
                            <span className="mechanic-layout__online-dot"></span>
                            ONLINE
                        </div>
                        <div className="mechanic-layout__clock">
                            {formatTime(time)}
                        </div>

                        <div className="mechanic-layout__alerts" ref={bellContainerRef}>
                            <button
                                className="mechanic-layout__bell-btn"
                                onClick={() => setNotificationsOpen((prev) => !prev)}
                                aria-label="Toggle notifications"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && <span className="mechanic-layout__bell-badge">{unreadCount}</span>}
                            </button>

                            {notificationsOpen && (
                                <div className="mechanic-layout__notification-panel">
                                    <div className="mechanic-layout__notification-header">
                                        <span>Notifications</span>
                                        <button className="mechanic-layout__notification-read-btn" onClick={markAllAsRead}>Mark all read</button>
                                    </div>

                                    <div className="mechanic-layout__notification-list">
                                        {notifications.length === 0 && (
                                            <div className="mechanic-layout__notification-empty">No notifications right now.</div>
                                        )}

                                        {notifications.map((item) => (
                                            <div key={item.id} className="mechanic-layout__notification-item">
                                                <span className={`mechanic-layout__notification-icon mechanic-layout__notification-icon--${item.type}`}>
                                                    {renderNotificationIcon(item.type)}
                                                </span>
                                                <div className="mechanic-layout__notification-copy">
                                                    <div className="mechanic-layout__notification-title">{item.title}</div>
                                                    <div className="mechanic-layout__notification-message">{item.message}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mechanic-layout__content">
                    <div className="mechanic-layout__content-bg"></div>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const SidebarLink = ({ to, icon, label, end = false, badge = null }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `mechanic-layout__link ${isActive ? 'mechanic-layout__link--active' : ''}`}
    >
        {({ isActive }) => (
            <>
                {isActive && <span className="mechanic-layout__link-indicator"></span>}
                <span className={`mechanic-layout__link-icon ${isActive ? 'mechanic-layout__link-icon--active' : ''}`}>{icon}</span>
                <span className="mechanic-layout__link-label">{label}</span>
                {badge && <span className="mechanic-layout__link-badge">{badge}</span>}
            </>
        )}
    </NavLink>
);

export default MechanicLayout;


