import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import './AdminLayout.css';
import {
    Settings,
    LayoutDashboard,
    ClipboardList,
    Users,
    TrendingUp,
    Wrench,
    Package,
    MessageSquare,
    Bell,
    LogOut,
    AlertTriangle,
    Clock3,
    CheckCircle2,
    Star
} from 'lucide-react';

const DEFAULT_NOTIFICATION_PREFS = {
    newBookingAlerts: true,
    cancellationAlerts: true,
    lowStockAlerts: true,
    paymentConfirmations: true,
    dailyDigest: false
};

const getNotificationPrefs = () => {
    if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFS;
    try {
        const raw = window.localStorage.getItem('autoassist_admin_notification_prefs');
        if (!raw) return DEFAULT_NOTIFICATION_PREFS;
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_NOTIFICATION_PREFS, ...parsed };
    } catch {
        return DEFAULT_NOTIFICATION_PREFS;
    }
};

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState([]);
    const [sidebarBadgeCounts, setSidebarBadgeCounts] = useState({
        appointments: 0,
        inventory: 0
    });
    const location = useLocation();
    const navigate = useNavigate();
    const bellContainerRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
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
                const [bookingsRes, inventoryRes] = await Promise.all([
                    api.get('/bookings/admin'),
                    api.get('/inventory')
                ]);

                const bookings = bookingsRes.data || [];
                const inventory = inventoryRes.data || [];

                const getStock = (item) => {
                    const raw = item?.stock ?? item?.quantity ?? 0;
                    const parsed = Number(raw);
                    return Number.isFinite(parsed) ? parsed : 0;
                };

                const getMinStock = (item) => {
                    const raw = item?.minStock;
                    const parsed = Number(raw);
                    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
                };

                const pendingCount = bookings.filter((b) => b.status === 'Pending').length;
                const unassignedCount = bookings.filter((b) => !b.mechanicId).length;
                const inProgressCount = bookings.filter((b) => b.status === 'In Progress').length;
                const lowStockCount = inventory.filter((item) => {
                    const stock = getStock(item);
                    const minStock = getMinStock(item);
                    return stock > 0 && stock <= minStock;
                }).length;
                const outOfStockCount = inventory.filter((item) => getStock(item) <= 0).length;
                const prefs = getNotificationPrefs();

                setSidebarBadgeCounts({
                    appointments: pendingCount,
                    inventory: lowStockCount + outOfStockCount
                });

                const nextNotifications = [];

                if (prefs.newBookingAlerts && pendingCount > 0) {
                    nextNotifications.push({
                        id: 'pending-jobs',
                        type: 'warning',
                        title: 'Pending appointments',
                        message: `${pendingCount} appointment(s) are waiting for action.`
                    });
                }

                if (prefs.newBookingAlerts && unassignedCount > 0) {
                    nextNotifications.push({
                        id: 'unassigned-jobs',
                        type: 'warning',
                        title: 'Mechanic assignment',
                        message: `${unassignedCount} appointment(s) are still unassigned.`
                    });
                }

                if (prefs.dailyDigest && inProgressCount > 0) {
                    nextNotifications.push({
                        id: 'active-jobs',
                        type: 'info',
                        title: 'Active services',
                        message: `${inProgressCount} appointment(s) are currently in progress.`
                    });
                }

                if (prefs.lowStockAlerts && lowStockCount > 0) {
                    nextNotifications.push({
                        id: 'low-stock',
                        type: 'warning',
                        title: 'Inventory warning',
                        message: `${lowStockCount} item(s) are running low (<= 5 units).`
                    });
                }

                if (prefs.lowStockAlerts && outOfStockCount > 0) {
                    nextNotifications.push({
                        id: 'out-of-stock',
                        type: 'warning',
                        title: 'Inventory critical',
                        message: `${outOfStockCount} item(s) are out of stock.`
                    });
                }

                setNotifications(nextNotifications);
            } catch (error) {
                console.error('Error fetching admin notifications:', error);
                setNotifications([]);
                setSidebarBadgeCounts({ appointments: 0, inventory: 0 });
            }
        };

        fetchNotifications();
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getPageTitle = () => {
        const path = location.pathname.split('/').pop();
        switch (path) {
            case 'admin': return 'Overview';
            case 'appointments': return 'Appointments';
            case 'customers': return 'Customers';
            case 'revenue': return 'Revenue';
            case 'mechanics': return 'Mechanics';
            case 'inventory': return 'Inventory';
            case 'ratings': return 'Ratings';
            case 'settings': return 'Settings';
            default: return 'Overview';
        }
    };

    const getInitials = (name) => {
        if (!name) return 'A';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
        <div className="admin-layout">
            <nav className="admin-layout__sidebar">
                <div className="admin-layout__brand-row">
                    <div className="admin-layout__brand-badge">A</div>
                    <div>
                        <div className="admin-layout__brand-title">Auto Assist</div>
                        <div className="admin-layout__brand-subtitle">Admin Dashboard V1.0</div>
                    </div>
                </div>

                <div className="admin-layout__nav-wrap">
                    <div className="admin-layout__nav-title">Main</div>
                    <SidebarLink to="/admin" icon={<LayoutDashboard size={18} />} label="Overview" end />
                    <SidebarLink
                        to="/admin/appointments"
                        icon={<ClipboardList size={18} />}
                        label="Appointments"
                        badge={sidebarBadgeCounts.appointments > 0 ? String(sidebarBadgeCounts.appointments) : null}
                        badgeColor="blue"
                    />
                    <SidebarLink to="/admin/customers" icon={<Users size={18} />} label="Customers" />
                    <SidebarLink to="/admin/revenue" icon={<TrendingUp size={18} />} label="Revenue" />

                    <div className="admin-layout__nav-title admin-layout__nav-title--spaced">Operations</div>
                    <SidebarLink to="/admin/mechanics" icon={<Wrench size={18} />} label="Mechanics" />
                    <SidebarLink
                        to="/admin/inventory"
                        icon={<Package size={18} />}
                        label="Inventory"
                        badge={sidebarBadgeCounts.inventory > 0 ? String(sidebarBadgeCounts.inventory) : null}
                        badgeColor="yellow"
                    />
                    <SidebarLink to="/admin/support" icon={<MessageSquare size={18} />} label="Support Chat" />
                    <SidebarLink to="/admin/ratings" icon={<Star size={18} />} label="Ratings" />

                    <div className="admin-layout__nav-title admin-layout__nav-title--spaced">System</div>
                    <SidebarLink to="/admin/settings" icon={<Settings size={18} />} label="Settings" />
                </div>

                <div className="admin-layout__user-card">
                    <div className="admin-layout__user-row">
                        <div className="admin-layout__avatar">
                            {getInitials(user?.name)}
                        </div>
                        <div className="admin-layout__user-meta">
                            <div className="admin-layout__user-name">{user?.name || 'Admin User'}</div>
                            <div className="admin-layout__user-role">{user?.role}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="admin-layout__logout-btn"
                    >
                        <LogOut size={14} />
                        Logout
                    </button>
                </div>
            </nav>

            <div className="admin-layout__main">
                <header className="admin-layout__header">
                    <h1 className="admin-layout__title">{getPageTitle()}</h1>

                    <div className="admin-layout__header-right">
                        <div className="admin-layout__clock">
                            {currentTime.toLocaleTimeString()}
                        </div>

                        <div className="admin-layout__alerts" ref={bellContainerRef}>
                            <button
                                className="admin-layout__bell-btn"
                                onClick={() => setNotificationsOpen((prev) => !prev)}
                                aria-label="Toggle notifications"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && <span className="admin-layout__bell-badge">{unreadCount}</span>}
                            </button>

                            {notificationsOpen && (
                                <div className="admin-layout__notification-panel">
                                    <div className="admin-layout__notification-header">
                                        <span>Notifications</span>
                                        <button className="admin-layout__notification-read-btn" onClick={markAllAsRead}>Mark all read</button>
                                    </div>

                                    <div className="admin-layout__notification-list">
                                        {notifications.length === 0 && (
                                            <div className="admin-layout__notification-empty">No notifications right now.</div>
                                        )}

                                        {notifications.map((item) => (
                                            <div key={item.id} className="admin-layout__notification-item">
                                                <span className={`admin-layout__notification-icon admin-layout__notification-icon--${item.type}`}>
                                                    {renderNotificationIcon(item.type)}
                                                </span>
                                                <div className="admin-layout__notification-copy">
                                                    <div className="admin-layout__notification-title">{item.title}</div>
                                                    <div className="admin-layout__notification-message">{item.message}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="admin-layout__content custom-scrollbar">
                    <div className="admin-layout__content-bg"></div>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const SidebarLink = ({ to, icon, label, end = false, badge = null, badgeColor = "red" }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `admin-layout__link ${isActive ? 'admin-layout__link--active' : ''}`}
    >
        {({ isActive }) => (
            <>
                {isActive && <span className="admin-layout__link-indicator"></span>}
                <span className={`admin-layout__link-icon ${isActive ? 'admin-layout__link-icon--active' : ''}`}>{icon}</span>
                <span className="admin-layout__link-label">{label}</span>
                {badge && <span className={`admin-layout__link-badge admin-layout__link-badge--${badgeColor}`}>{badge}</span>}
            </>
        )}
    </NavLink>
);

export default AdminLayout;


