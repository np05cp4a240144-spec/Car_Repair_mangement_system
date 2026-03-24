import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Wrench,
    Users,
    Package,
    CreditCard,
    FileText,
    MessageSquare,
    UserCog,
    BarChart3,
    Settings,
    Search,
    Bell,
    ClipboardList,
    Clock,
    Star,
    ChevronRight,
    LogOut,
    AlertCircle,
    CheckCircle2,
    CalendarDays
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './Dashboard.css';

const chartHeightClassMap = {
    58: 'dashboard-h-58',
    68: 'dashboard-h-68',
    74: 'dashboard-h-74',
    75: 'dashboard-h-75',
    79: 'dashboard-h-79',
    80: 'dashboard-h-80',
    82: 'dashboard-h-82',
    85: 'dashboard-h-85',
    90: 'dashboard-h-90',
    91: 'dashboard-h-91',
    96: 'dashboard-h-96',
    100: 'dashboard-h-100'
};

const sparkHeightClassMap = {
    40: 'dashboard-h-40',
    45: 'dashboard-h-45',
    50: 'dashboard-h-50',
    55: 'dashboard-h-55',
    60: 'dashboard-h-60',
    65: 'dashboard-h-65',
    75: 'dashboard-h-75',
    80: 'dashboard-h-80',
    85: 'dashboard-h-85',
    90: 'dashboard-h-90'
};

const avatarColorClassMap = {
    '#7C3AED': 'dashboard-color-violet',
    '#059669': 'dashboard-color-green',
    '#D97706': 'dashboard-color-amber',
    '#2563EB': 'dashboard-color-blue'
};

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('Weekly');
    const [currentDate, setCurrentDate] = useState('');
    const [revenueData, setRevenueData] = useState([]);
    const [monthlyTotal, setMonthlyTotal] = useState(0);
    const [yearlyTotal, setYearlyTotal] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const now = new Date();
        const opts = { weekday: 'short', day: '2-digit', month: 'short' };
        setCurrentDate(now.toLocaleDateString('en-GB', opts));
    }, []);

    // Fetch combined revenue data from bookings and parts sales
    useEffect(() => {
        const fetchRevenueData = async () => {
            try {
                const [bookingsRes, partsRes] = await Promise.all([
                    api.get('/bookings/revenue'),
                    api.get('/inventory/sales/revenue')
                ]);

                const bookingMonthly = bookingsRes.data?.monthlyRevenue || Array(8).fill(0);
                const partsMonthly = partsRes.data?.monthlyRevenue || Array(8).fill(0);

                // Combine both revenue sources
                const combined = bookingMonthly.map((val, idx) => {
                    const partVal = partsMonthly[idx] || 0;
                    const total = val + partVal;
                    // Convert to thousands for chart display (e.g., 24180 -> 82)
                    return Math.round(total / 300);
                });

                setRevenueData(combined);
                
                // Calculate totals
                const totalMonth = (bookingsRes.data?.thisMonth || 0) + (partsRes.data?.thisMonth || 0);
                const totalYear = (bookingsRes.data?.thisYear || 0) + (partsRes.data?.thisYear || 0);
                
                setMonthlyTotal(totalMonth);
                setYearlyTotal(totalYear);
            } catch (error) {
                console.error('Error fetching revenue data:', error);
                // Fallback to default data
                setRevenueData([68, 82, 58, 91, 74, 96, 79, 100]);
                setMonthlyTotal(24180);
            }
        };

        fetchRevenueData();
    }, []);

    const weeks = ['Jan 6', 'Jan 13', 'Jan 20', 'Jan 27', 'Feb 3', 'Feb 10', 'Feb 17', 'Feb 24'];
    const targetData = [75, 75, 75, 80, 80, 85, 85, 90];

    return (
        <div className="dash-page">
            <aside className="dash-sidebar">
                <div className="dash-sidebar__brand">
                    <div className="dash-sidebar__brand-icon">A</div>
                    Auto Assist
                </div>

                <nav className="dash-sidebar__nav">
                    <div className="dash-sidebar__group-title">Main</div>
                    <NavItem to="/dashboard" icon={<LayoutDashboard size={15} />} label="Dashboard" active />
                    <NavItem to="/admin/appointments" icon={<Calendar size={15} />} label="Appointments" badge="3" />
                    <NavItem to="/mechanic" icon={<Wrench size={15} />} label="Repairs" />
                    <NavItem to="/admin/customers" icon={<Users size={15} />} label="Customers" />

                    <div className="dash-sidebar__group-title">Operations</div>
                    <NavItem to="/admin/inventory" icon={<Package size={15} />} label="Inventory" badge="2" badgeColor="dash-badge--danger" />
                    <NavItem to="/customer/payment" icon={<CreditCard size={15} />} label="Payments" />
                    <NavItem to="/customer/history" icon={<FileText size={15} />} label="Invoices" />
                    <NavItem to="/customer/chat" icon={<MessageSquare size={15} />} label="Messages" badge="5" badgeColor="dash-badge--success" />

                    <div className="dash-sidebar__group-title">Admin</div>
                    <NavItem to="/admin/mechanics" icon={<UserCog size={15} />} label="Mechanics" />
                    <NavItem to="/admin/revenue" icon={<BarChart3 size={15} />} label="Analytics" />
                    <NavItem to="/admin/settings" icon={<Settings size={15} />} label="Settings" />
                </nav>

                <div className="dash-sidebar__user">
                    <div className="dash-sidebar__user-avatar">{user?.name?.charAt(0) || 'U'}</div>
                    <div className="dash-sidebar__user-meta">
                        <div className="dash-sidebar__user-name">{user?.name || 'User Name'}</div>
                        <div className="dash-sidebar__user-role">{user?.role || 'Role'}</div>
                    </div>
                    <button onClick={logout} className="dash-sidebar__logout">
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            <main className="dash-main">
                <header className="dash-topbar">
                    <div>
                        <div className="dash-topbar__title">Dashboard</div>
                        <div className="dash-topbar__crumbs">Auto Assist <span><ChevronRight size={10} strokeWidth={3} /></span> Overview</div>
                    </div>

                    <div className="dash-topbar__actions">
                        <div className="dash-topbar__search"><Search size={14} />Search anything...</div>
                        <div className="dash-topbar__icon-btn dash-topbar__icon-btn--notif"><Bell size={15} /><div className="dash-topbar__notif-dot"></div></div>
                        <div className="dash-topbar__icon-btn"><ClipboardList size={15} /></div>
                        <div className="dash-topbar__date">{currentDate}</div>
                    </div>
                </header>

                <div className="dash-content">
                    <div className="dash-kpi-grid">
                        <KPICard label="Today's Jobs" value="14" icon={<Wrench size={15} />} delta="up 3" subText="vs yesterday" color="orange" sparkline={[40, 60, 45, 80, 55, 90]} />
                        <KPICard label="Revenue Today" value="$3,840" icon={<CreditCard size={15} />} delta="up 12%" subText="this week" color="green" sparkline={[50, 65, 40, 75, 60, 85]} />
                        <KPICard label="Pending" value="5" icon={<Clock size={15} />} delta="2 awaiting" subText="parts" color="blue" />
                        <KPICard label="Satisfaction" value="4.9" icon={<Star size={15} />} delta="up 0.2" subText="from last month" color="yellow" />
                    </div>

                    <div className="dash-row-2">
                        <div className="dash-panel">
                            <div className="dash-panel__head">
                                <div>
                                    <div className="dash-panel__title">Revenue Overview</div>
                                    <div className="dash-panel__sub">Last 8 weeks performance</div>
                                </div>
                                <div className="dash-tab-group">
                                    {['Weekly', 'Monthly', 'Yearly'].map((tab) => (
                                        <button key={tab} onClick={() => setActiveTab(tab)} className={`dash-tab ${activeTab === tab ? 'dash-tab--active' : ''}`}>{tab}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="dash-panel__body">
                                <div className="dash-revenue__meta">
                                    <div>
                                        <div className="dash-revenue__value">Rs. {monthlyTotal.toLocaleString()}</div>
                                        <div className="dash-revenue__hint">Appointment + Parts Sales <span>Total Revenue</span></div>
                                    </div>
                                    <div className="dash-revenue__legend">
                                        <div><span className="dash-dot dash-dot--orange"></span> Appointment + Parts</div>
                                        <div><span className="dash-dot dash-dot--target"></span> Target</div>
                                    </div>
                                </div>

                                <div className="dash-revenue-chart">
                                    {weeks.map((week, idx) => (
                                        <div key={week} className="dash-revenue-chart__pair">
                                            <div className={`dash-revenue-chart__bar dash-revenue-chart__bar--target ${chartHeightClassMap[targetData[idx]] || 'dashboard-h-75'}`}></div>
                                            <div className={`dash-revenue-chart__bar ${chartHeightClassMap[revenueData[idx]] || 'dashboard-h-68'} ${idx === weeks.length - 1 ? 'dashboard-revenue-gradient' : 'dash-revenue-chart__bar--actual'}`}></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="dash-revenue-chart__labels">
                                    {weeks.map((week) => <div key={week}>{week.split(' ')[1]}</div>)}
                                </div>
                            </div>
                        </div>

                        <div className="dash-panel">
                            <div className="dash-panel__head">
                                <div>
                                    <div className="dash-panel__title">Today's Queue</div>
                                    <div className="dash-panel__sub">14 jobs scheduled</div>
                                </div>
                                <button className="dash-link-btn" onClick={() => navigate('/admin/appointments')}>View all</button>
                            </div>
                            <div className="dash-queue-list">
                                <QueueItem num="01" vehicle="2019 BMW 3 Series" type="Engine Diagnostics" status="live" />
                                <QueueItem num="02" vehicle="2021 Toyota Camry" type="Oil Change + Filter" status="done" />
                                <QueueItem num="03" vehicle="2018 Honda Civic" type="Brake Pad Replacement" status="live" />
                                <QueueItem num="04" vehicle="2022 Ford Ranger" type="Transmission Service" status="next" />
                                <QueueItem num="05" vehicle="2020 Audi A4" type="Full Service" status="next" />
                                <QueueItem num="06" vehicle="2017 Mercedes C200" type="AC Recharge" time="2:30 PM" />
                            </div>
                        </div>
                    </div>

                    <div className="dash-panel">
                        <div className="dash-table-head">
                            <div>
                                <div className="dash-panel__title">Recent Appointments</div>
                                <div className="dash-panel__sub">Showing 6 of 48 this week</div>
                            </div>
                            <div className="dash-table-head__actions">
                                <div className="dash-mini-tabs">
                                    {['All', 'In Progress', 'Pending', 'Done'].map((t, i) => <button key={t} className={`dash-mini-tab ${i === 0 ? 'dash-mini-tab--active' : ''}`}>{t}</button>)}
                                </div>
                                <button className="dash-link-btn">Export</button>
                            </div>
                        </div>
                        <div className="dash-table-wrap">
                            <table className="dash-table">
                                <thead>
                                    <tr>
                                        <th>Vehicle</th><th>Customer</th><th>Service</th><th>Mechanic</th><th>Time</th><th>Status</th><th className="dash-table__right">Amount</th><th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <TableRow vehicle="BMW 3 Series" plate="ABC-1234" vIcon="CAR" customer="Marcus Reid" service="Engine Diagnostics" mech="Ana Torres" mCount="AT" mColor="#7C3AED" time="9:00 AM" status="in-progress" amount="$280" />
                                    <TableRow vehicle="Toyota Camry" plate="XYZ-5678" vIcon="SUV" customer="Sarah Chen" service="Oil Change + Filter" mech="Dan Kim" mCount="DK" mColor="#059669" time="9:30 AM" status="completed" amount="$95" action="Invoice" />
                                    <TableRow vehicle="Honda Civic" plate="DEF-9012" vIcon="CAR" customer="James Liu" service="Brake Pad Replacement" mech="Mike Ross" mCount="MR" mColor="#D97706" time="10:15 AM" status="in-progress" amount="$180" />
                                    <TableRow vehicle="Ford Ranger" plate="GHI-3456" vIcon="TRK" customer="Tom Walsh" service="Transmission Service" mech="Sam Kelly" mCount="SK" mColor="#2563EB" time="11:00 AM" status="pending" amount="$420" />
                                    <TableRow vehicle="Audi A4" plate="JKL-7890" vIcon="CAR" customer="Priya Patel" service="Full Service" mech="Ana Torres" mCount="AT" mColor="#7C3AED" time="1:00 PM" status="pending" amount="$650" />
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="dash-row-4">
                        <div className="dash-panel">
                            <div className="dash-panel__head"><div className="dash-panel__title">Mechanics On Duty</div><button className="dash-link-btn" onClick={() => navigate('/admin/mechanics')}>Manage</button></div>
                            <div>
                                <MechRow name="Ana Torres" spec="Engine Specialist" status="busy" jobs="2" color="#7C3AED" ini="AT" />
                                <MechRow name="Dan Kim" spec="General Mechanic" status="free" color="#059669" ini="DK" />
                                <MechRow name="Mike Ross" spec="Brakes & Suspension" status="busy" jobs="1" color="#D97706" ini="MR" />
                                <MechRow name="Sam Kelly" spec="Transmission" status="break" color="#2563EB" ini="SK" />
                            </div>
                        </div>

                        <div className="dash-panel">
                            <div className="dash-panel__head"><div className="dash-panel__title">Inventory Status</div><button className="dash-link-btn dash-link-btn--alert">2 alerts</button></div>
                            <div>
                                <InvItem name="Brake Pads (Front)" sku="SKU-BP-001" stock="3" status="critical" />
                                <InvItem name="Engine Oil 5W-30" sku="SKU-OL-030" stock="7" status="low" />
                                <InvItem name="Air Filter (Universal)" sku="SKU-AF-002" stock="18" status="ok" />
                                <InvItem name="Spark Plugs (Set)" sku="SKU-SP-011" stock="12" status="ok" />
                            </div>
                        </div>

                        <div className="dash-panel">
                            <div className="dash-panel__head"><div className="dash-panel__title">Notifications</div><button className="dash-link-btn">Mark all read</button></div>
                            <div>
                                <NotifItem icon={<AlertCircle size={16} />} color="notif-icon--danger" msg="Brake Pads (Front) stock critically low - only 3 units remaining." time="2 min ago" unread />
                                <NotifItem icon={<CheckCircle2 size={16} />} color="notif-icon--success" msg="Payment of $95 received from Sarah Chen for Invoice #1042." time="14 min ago" unread />
                                <NotifItem icon={<CalendarDays size={16} />} color="notif-icon--info" msg="New booking from Priya Patel - Full Service at 1:00 PM." time="38 min ago" />
                                <NotifItem icon={<MessageSquare size={16} />} color="notif-icon--warning" msg="James Liu sent a message about his Honda Civic repair." time="1 hr ago" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ to, icon, label, active = false, badge = null, badgeColor = '' }) => (
    <Link to={to} className={`dash-nav-item ${active ? 'dash-nav-item--active' : ''}`}>
        {active && <div className="dash-nav-item__active-line"></div>}
        <span className="dash-nav-item__icon">{icon}</span>
        <span className="dash-nav-item__label">{label}</span>
        {badge && <span className={`dash-badge ${badgeColor}`}>{badge}</span>}
    </Link>
);

const KPICard = ({ label, value, icon, delta, subText, color, sparkline }) => {
    const colorMap = {
        orange: { card: 'kpi--orange', badge: 'kpi__icon--orange', delta: 'kpi__delta-pill--orange', spark: 'dashboard-spark-orange' },
        green: { card: 'kpi--green', badge: 'kpi__icon--green', delta: 'kpi__delta-pill--green', spark: 'dashboard-spark-green' },
        blue: { card: 'kpi--blue', badge: 'kpi__icon--blue', delta: 'kpi__delta-pill--blue', spark: 'dashboard-spark-orange' },
        yellow: { card: 'kpi--yellow', badge: 'kpi__icon--yellow', delta: 'kpi__delta-pill--yellow', spark: 'dashboard-spark-orange' }
    };

    return (
        <div className={`kpi-card ${colorMap[color].card}`}>
            <div className="kpi-card__top">
                <label className="kpi-card__label">{label}</label>
                <div className={`kpi-card__icon ${colorMap[color].badge}`}>{icon}</div>
            </div>
            <div className="kpi-card__value">{value}</div>
            <div className="kpi-card__bottom">
                <span className={`kpi__delta-pill ${colorMap[color].delta}`}>{delta}</span>
                {subText}
                {sparkline && (
                    <div className="kpi-spark">
                        {sparkline.map((h, i) => (
                            <div key={i} className={`kpi-spark__bar ${i === sparkline.length - 1 ? 'kpi-spark__bar--last' : ''} ${sparkHeightClassMap[h] || 'dashboard-h-50'} ${colorMap[color].spark}`}></div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const QueueItem = ({ num, vehicle, type, status = null, time = null }) => (
    <div className="dash-queue-item">
        <div className="dash-queue-item__num">{num}</div>
        <div className="dash-queue-item__meta"><div className="dash-queue-item__vehicle">{vehicle}</div><div className="dash-queue-item__type">{type}</div></div>
        {status && <span className={`dash-queue-pill dash-queue-pill--${status}`}><div></div>{status}</span>}
        {time && <span className="dash-queue-item__time">{time}</span>}
    </div>
);

const TableRow = ({ vehicle, plate, vIcon, customer, service, mech, mCount, mColor, time, status, amount, action = 'View' }) => (
    <tr className="dash-table-row">
        <td>
            <div className="dash-table-row__vehicle-wrap">
                <div className="dash-table-row__vehicle-icon">{vIcon}</div>
                <div><div className="dash-table-row__vehicle">{vehicle}</div><div className="dash-table-row__plate">{plate}</div></div>
            </div>
        </td>
        <td className="dash-table-row__muted">{customer}</td>
        <td className="dash-table-row__muted">{service}</td>
        <td>
            <div className="dash-table-row__mech-wrap">
                <div className={`dash-table-row__mech-avatar ${avatarColorClassMap[mColor] || 'dashboard-color-violet'}`}>{mCount}</div>
                {mech}
            </div>
        </td>
        <td className="dash-table-row__time">{time}</td>
        <td><span className={`dash-table-row__status dash-table-row__status--${status.replace(' ', '-')}`}>{status}</span></td>
        <td className="dash-table-row__amount">{amount}</td>
        <td className="dash-table-row__action-cell"><button className="dash-table-row__action-btn">{action}</button></td>
    </tr>
);

const MechRow = ({ name, spec, status, jobs = null, color, ini }) => (
    <div className="dash-mech-row">
        <div className={`dash-mech-row__avatar ${avatarColorClassMap[color] || 'dashboard-color-violet'}`}>{ini}</div>
        <div className="dash-mech-row__meta"><div className="dash-mech-row__name">{name}</div><div className="dash-mech-row__spec">{spec}</div></div>
        <div className={`dash-mech-row__status dash-mech-row__status--${status}`}>{status === 'busy' ? `Busy - ${jobs} ${jobs > 1 ? 'jobs' : 'job'}` : status === 'free' ? 'Free' : 'Break'}</div>
    </div>
);

const InvItem = ({ name, sku, stock, status }) => (
    <div className="dash-inv-item">
        <div className="dash-inv-item__meta"><div className="dash-inv-item__name">{name}</div><div className="dash-inv-item__sku">{sku}</div></div>
        <div className="dash-inv-item__track"><div className={`dash-inv-item__fill dash-inv-item__fill--${status}`}></div></div>
        <div className={`dash-inv-item__stock dash-inv-item__stock--${status}`}>{stock} left</div>
    </div>
);

const NotifItem = ({ icon, color, msg, time, unread = false }) => (
    <div className={`dash-notif-item ${unread ? 'dash-notif-item--unread' : ''}`}>
        <div className={`dash-notif-item__icon ${color}`}>{icon}</div>
        <div className="dash-notif-item__meta"><div className="dash-notif-item__msg">{msg}</div><div className="dash-notif-item__time">{time}</div></div>
        {unread && <div className="dash-notif-item__dot"></div>}
    </div>
);

export default Dashboard;
