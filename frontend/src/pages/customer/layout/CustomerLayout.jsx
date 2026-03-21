import { useState, useEffect, useMemo, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { AlertTriangle, Bell, CheckCircle2, Clock3 } from 'lucide-react';
import api from '../../../api/axios';
import './CustomerLayout.css';

const CustomerLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const [showDropdown, setShowDropdown] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState([]);
    const dropdownRef = useRef(null);
    const bellRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return 'C';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const [unreadRes, bookingsRes] = await Promise.all([
                    api.get('/messages/unread-count'),
                    api.get('/bookings')
                ]);

                const unreadMessages = unreadRes.data?.unreadCount || 0;
                const bookings = bookingsRes.data || [];

                const pendingCount = bookings.filter((job) => job.status === 'Pending').length;
                const activeCount = bookings.filter((job) => job.status === 'In Progress').length;
                const readyForPickupCount = bookings.filter(
                    (job) => job.stage === 'Ready for Pickup' && job.status !== 'Cancelled'
                ).length;

                const nextNotifications = [];

                if (unreadMessages > 0) {
                    nextNotifications.push({
                        id: 'unread-messages',
                        type: 'warning',
                        title: 'Unread messages',
                        message: `You have ${unreadMessages} unread message(s) from the service team.`,
                        route: '/customer/chat'
                    });
                }

                if (pendingCount > 0) {
                    nextNotifications.push({
                        id: 'pending-bookings',
                        type: 'info',
                        title: 'Booking pending',
                        message: `${pendingCount} booking(s) are waiting for service start.`,
                        route: '/customer/history'
                    });
                }

                if (activeCount > 0) {
                    nextNotifications.push({
                        id: 'active-repairs',
                        type: 'info',
                        title: 'Repair in progress',
                        message: `${activeCount} vehicle(s) are currently being worked on.`,
                        route: '/customer/tracking'
                    });
                }

                if (readyForPickupCount > 0) {
                    nextNotifications.push({
                        id: 'ready-pickup',
                        type: 'success',
                        title: 'Ready for pickup',
                        message: `${readyForPickupCount} vehicle(s) are ready for pickup.`,
                        route: '/customer/tracking'
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
                console.error('Error fetching customer notifications:', error);
                setNotifications([]);
            }
        };

        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 15000);
        return () => clearInterval(intervalId);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (bellRef.current && !bellRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleRealtimePayment = (payload = {}) => {
            const amount = Number(payload.amount || 0).toFixed(2);
            const notificationId = `realtime-payment-${payload.pidx || Date.now()}`;
            const paymentRoute = payload.mode === 'parts' ? '/customer/inventory' : '/customer/history';

            setNotifications((prev) => {
                const withoutDuplicate = prev.filter((item) => item.id !== notificationId);
                return [{
                    id: notificationId,
                    type: 'success',
                    title: 'Payment successful',
                    message: payload.message || `Your payment of NPR ${amount} was confirmed.`,
                    route: paymentRoute,
                    isRealtime: true
                }, ...withoutDuplicate];
            });

            setDismissedNotificationIds((prev) => prev.filter((id) => id !== notificationId));
        };

        socket.on('payment_received_customer', handleRealtimePayment);
        return () => socket.off('payment_received_customer', handleRealtimePayment);
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleServiceFinalized = (payload = {}) => {
            const notificationId = `service-finalized-${payload.appointmentId || Date.now()}`;

            setNotifications((prev) => {
                const withoutDuplicate = prev.filter((item) => item.id !== notificationId);
                return [{
                    id: notificationId,
                    type: 'success',
                    title: 'Service finalized',
                    message: payload.message || 'Your service has been finalized successfully.',
                    route: '/customer/history',
                    isRealtime: true
                }, ...withoutDuplicate];
            });

            setDismissedNotificationIds((prev) => prev.filter((id) => id !== notificationId));
        };

        socket.on('service_finalized_customer', handleServiceFinalized);
        return () => socket.off('service_finalized_customer', handleServiceFinalized);
    }, [socket]);

    const unreadCount = useMemo(
        () => notifications.filter((item) => !dismissedNotificationIds.includes(item.id)).length,
        [notifications, dismissedNotificationIds]
    );

    const markAllAsRead = () => {
        setDismissedNotificationIds(notifications.map((item) => item.id));
    };

    const handleNotificationClick = (item) => {
        setDismissedNotificationIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
        setNotificationsOpen(false);
        if (item.route) navigate(item.route);
    };

    const renderNotificationIcon = (type) => {
        if (type === 'warning') return <AlertTriangle size={14} />;
        if (type === 'success') return <CheckCircle2 size={14} />;
        return <Clock3 size={14} />;
    };

    return (
        <div className="customer-layout">
            <div className="customer-layout__main-wrap customer-layout__main-wrap--full">
                <header className="customer-layout__header">
                    <div className="customer-layout__header-left" onClick={() => navigate('/customer')}>
                        <div className="customer-layout__brand-icon">A</div>
                        <div>
                            <div className="customer-layout__brand-title">Auto Assist</div>
                            <div className="customer-layout__brand-subtitle">Customer Portal</div>
                        </div>
                    </div>

                    <div className="customer-layout__nav-list">
                        <NavLink to="/customer" end className={({ isActive }) => `customer-layout__nav-link ${isActive ? 'customer-layout__nav-link--active' : ''}`}>
                            Home
                        </NavLink>
                        <NavLink to="/customer/tracking" className={({ isActive }) => `customer-layout__nav-link ${isActive ? 'customer-layout__nav-link--active' : ''}`}>
                            Track Car
                        </NavLink>
                        <NavLink to="/customer/book" className={({ isActive }) => `customer-layout__nav-link ${isActive ? 'customer-layout__nav-link--active' : ''}`}>
                            Booking
                        </NavLink>
                        <NavLink to="/customer/history" className={({ isActive }) => `customer-layout__nav-link ${isActive ? 'customer-layout__nav-link--active' : ''}`}>
                            History
                        </NavLink>
                        <NavLink to="/customer/chat" className={({ isActive }) => `customer-layout__nav-link ${isActive ? 'customer-layout__nav-link--active' : ''}`}>
                            Chat
                        </NavLink>
                        <NavLink to="/customer/inventory" className={({ isActive }) => `customer-layout__nav-link ${isActive ? 'customer-layout__nav-link--active' : ''}`}>
                            Inventory
                        </NavLink>
                        <NavLink to="/customer/cart" className={({ isActive }) => `customer-layout__nav-link ${isActive ? 'customer-layout__nav-link--active' : ''}`}>
                            Cart
                        </NavLink>
                        <NavLink to="/customer/rating" className={({ isActive }) => `customer-layout__nav-link ${isActive ? 'customer-layout__nav-link--active' : ''}`}>
                            Rate Us
                        </NavLink>
                    </div>

                    <div className="customer-layout__header-clock">
                        {currentTime.toLocaleTimeString()}
                    </div>

                    <div className="customer-layout__alerts" ref={bellRef}>
                        <button
                            className="customer-layout__bell-btn"
                            onClick={() => setNotificationsOpen((prev) => !prev)}
                            aria-label="Toggle notifications"
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && <span className="customer-layout__bell-badge">{unreadCount}</span>}
                        </button>

                        {notificationsOpen && (
                            <div className="customer-layout__notification-panel">
                                <div className="customer-layout__notification-header">
                                    <span>Notifications</span>
                                    <button className="customer-layout__notification-read-btn" onClick={markAllAsRead}>Mark all read</button>
                                </div>

                                <div className="customer-layout__notification-list">
                                    {notifications.length === 0 && (
                                        <div className="customer-layout__notification-empty">No notifications right now.</div>
                                    )}

                                    {notifications.map((item) => (
                                        <button
                                            key={item.id}
                                            className="customer-layout__notification-item"
                                            onClick={() => handleNotificationClick(item)}
                                        >
                                            <span className={`customer-layout__notification-icon customer-layout__notification-icon--${item.type}`}>
                                                {renderNotificationIcon(item.type)}
                                            </span>
                                            <div className="customer-layout__notification-copy">
                                                <div className="customer-layout__notification-title">{item.title}</div>
                                                <div className="customer-layout__notification-message">{item.message}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="customer-layout__profile-wrap" ref={dropdownRef}>
                        <div
                            className="customer-layout__profile-trigger"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            <div className="customer-layout__profile-meta">
                                <div className="customer-layout__profile-name">{user?.name}</div>
                                <div className="customer-layout__profile-role">Customer Account</div>
                            </div>
                            <div className="customer-layout__avatar">
                                {getInitials(user?.name)}
                            </div>
                        </div>

                        {showDropdown && (
                            <div className="customer-layout__dropdown">
                                <div className="customer-layout__dropdown-head">
                                    <div className="customer-layout__dropdown-name">{user?.name}</div>
                                    <div className="customer-layout__dropdown-email">{user?.email}</div>
                                </div>
                                <div className="customer-layout__dropdown-links">
                                    <button onClick={() => { navigate('/customer/profile'); setShowDropdown(false); }} className="customer-layout__dropdown-btn">
                                        <span className="customer-layout__dropdown-icon">👤</span> My Profile
                                    </button>
                                    <button onClick={() => { navigate('/customer/profile'); setShowDropdown(false); }} className="customer-layout__dropdown-btn">
                                        <span className="customer-layout__dropdown-icon">⚙️</span> Settings
                                    </button>
                                    <div className="customer-layout__dropdown-sep"></div>
                                    <button onClick={handleLogout} className="customer-layout__dropdown-btn customer-layout__dropdown-btn--danger">
                                        <span className="customer-layout__dropdown-icon">🚪</span> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="customer-layout__main custom-scrollbar">
                    <div className="customer-layout__main-inner">
                        <div className="customer-layout__page">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CustomerLayout;


