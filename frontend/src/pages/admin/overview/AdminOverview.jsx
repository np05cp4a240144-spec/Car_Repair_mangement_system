import './AdminOverview.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { ArrowRight, BarChart3 } from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

const AdminOverview = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ customers: 0, mechanics: 0, activeAppointments: 0, totalRevenue: 0 });
    const [appointments, setAppointments] = useState([]);
    const [allAppointments, setAllAppointments] = useState([]);
    const [mechanics, setMechanics] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [revenueData, setRevenueData] = useState(null);
    const [partsStats, setPartsStats] = useState({ totalRevenue: 0, thisMonth: 0, thisYear: 0, monthlyRevenue: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsRes, bookingsRes, mechanicsRes, revenueRes, inventoryRes, partsRevenueRes] = await Promise.all([
                    api.get('/customer/admin-stats'),
                    api.get('/bookings/admin'),
                    api.get('/mechanics'),
                    api.get('/bookings/revenue'),
                    api.get('/inventory'),
                    api.get('/inventory/sales/revenue')
                ]);
                setStats(statsRes.data);
                setAppointments(bookingsRes.data.slice(0, 5));
                setAllAppointments(bookingsRes.data);
                setMechanics(mechanicsRes.data);
                setRevenueData(revenueRes.data);
                setInventory(inventoryRes.data || []);
                setPartsStats(partsRevenueRes.data || { totalRevenue: 0, thisMonth: 0, thisYear: 0, monthlyRevenue: [] });
            } catch (error) {
                console.error('Error fetching admin overview data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0].substring(0, 2).toUpperCase();
    };

    const getAppointmentAmount = (app) => {
        if (app?.invoice?.totalAmount) return app.invoice.totalAmount;
        return app?.amount || 0;
    };

    const mechanicJobCount = mechanics.reduce((acc, mechanic) => {
        const count = allAppointments.filter((app) => app.mechanicId === mechanic.id && app.status !== 'Completed' && app.status !== 'Cancelled').length;
        acc[mechanic.id] = count;
        return acc;
    }, {});

    // Service mix count (for percentage)
    const serviceMixMap = allAppointments.reduce((acc, app) => {
        if (!app.service) return acc;
        app.service.split(',').map((x) => x.trim()).filter(Boolean).forEach((svc) => {
            acc[svc] = (acc[svc] || 0) + 1;
        });
        return acc;
    }, {});

    // Service revenue breakdown (mechanic jobs)
    const serviceRevenueMap = allAppointments.reduce((acc, app) => {
        if (!app.service) return acc;
        const amount = app.amount || 0;
        app.service.split(',').map((x) => x.trim()).filter(Boolean).forEach((svc) => {
            acc[svc] = (acc[svc] || 0) + amount;
        });
        return acc;
    }, {});

    const totalServiceCount = Object.values(serviceMixMap).reduce((sum, n) => sum + n, 0);
    const serviceMixTop = Object.entries(serviceMixMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([label, count]) => ({
            label,
            count,
            pct: totalServiceCount ? `${Math.round((count / totalServiceCount) * 100)}%` : '0%',
            revenue: serviceRevenueMap[label] || 0
        }));

    const mixColors = ['orange', 'blue', 'green', 'purple'];
    const serviceMixForRender = serviceMixTop.map((item, idx) => ({ ...item, color: mixColors[idx] }));

    // Add combined parts revenue (direct + mechanic jobs)
    const combinedPartsRevenue = (serviceRevenueMap['Parts'] || 0) + (partsStats.totalRevenue || 0);

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

    const lowFirstInventory = [...inventory]
        .sort((a, b) => getStock(a) - getStock(b))
        .slice(0, 3)
        .map((item) => {
            const qty = getStock(item);
            const minStock = getMinStock(item);
            const status = qty <= 0 ? 'Critical' : qty <= minStock ? 'Low' : 'OK';
            const sColor = status === 'Critical' ? 'red' : status === 'Low' ? 'yellow' : 'green';
            const maxForProgress = Math.max(minStock * 2, 1);
            const pct = Math.max(0, Math.min(100, Math.round((qty / maxForProgress) * 100)));
            const prog = status === 'Critical' ? 15 : status === 'Low' ? Math.max(28, Math.min(50, pct)) : Math.max(60, pct);
            return {
                id: item.id,
                name: item.name,
                sku: item.sku,
                count: item.unit ? `${qty} ${item.unit}` : String(qty),
                status,
                sColor,
                prog
            };
        });

    if (loading) {
        return (
            <div className="admin-overview__loading">
                <div className="admin-overview__spinner"></div>
            </div>
        );
    }

    // Combine mechanic and direct parts sales revenue for total
    const combinedRevenue = Math.round((stats.totalRevenue || 0) + (partsStats.totalRevenue || 0));

    return (
        <div className="admin-overview">
            <div className="admin-overview__kpis">
                <KPICard label="Today's Jobs" val={stats.activeAppointments || 0} delta="Updated just now" deltaType="up" size="sm" />
                <KPICard label="Parts Sales Revenue" val={`Rs. ${partsStats.totalRevenue.toLocaleString()}`} delta="Direct parts sales" deltaType="up" size="md" />
                <KPICard label="Customers" val={stats.customers || 0} delta="New signups" deltaType="up" size="xs" />
            </div>



            <div className="admin-overview__top-row">
                <section className="admin-overview__panel admin-overview__panel--chart">
                    <h3 className="admin-overview__panel-title">Revenue Growth (2026)</h3>
                    {revenueData ? (
                        <div className="admin-overview__chart-shell">
                            <RevenueLineGraph data={revenueData.monthlyRevenue} />
                        </div>
                    ) : (
                        <div className="admin-overview__chart-error">
                            <div className="admin-overview__chart-error-inner">
                                <BarChart3 size={40} />
                                <p>ERROR LOADING CHART DATA...</p>
                            </div>
                        </div>
                    )}
                </section>

                <section className="admin-overview__panel admin-overview__panel--mechanics">
                    <h4 className="admin-overview__subhead">Our Mechanics</h4>
                    <div className="admin-overview__mechanic-list">
                        {mechanics.length === 0 ? (
                            <div className="admin-overview__empty-hint">Loading mechanics...</div>
                        ) : (
                            mechanics.map((m) => (
                                <MechRow
                                    key={m.id}
                                    initials={getInitials(m.name)}
                                    name={m.name}
                                    spec={m.speciality || 'Main Mechanic'}
                                    jobs={String(mechanicJobCount[m.id] || 0)}
                                    status="Online"
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>

            <div className="admin-overview__bottom-row">
                <section className="admin-overview__panel admin-overview__panel--appointments">
                    <div className="admin-overview__panel-head">
                        <div className="admin-overview__panel-head-title">Recent Appointments</div>
                        <button className="admin-overview__link-btn" onClick={() => navigate('/admin/appointments')}>View all <ArrowRight size={12} /></button>
                    </div>
                    <div className="admin-overview__table-wrap">
                        <table className="admin-overview__table">
                            <thead>
                                <tr>
                                    <th>Vehicle</th>
                                    <th>Customer</th>
                                    <th>Mechanic</th>
                                    <th>Status</th>
                                    <th className="admin-overview__table-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="admin-overview__table-empty">No recent appointments found.</td>
                                    </tr>
                                ) : (
                                    appointments.map((app) => (
                                        <JobTableRow
                                            key={app.id}
                                            car={`${app.vehicle?.make} ${app.vehicle?.model}`}
                                            plate={app.vehicle?.plate}
                                            cust={app.user?.name}
                                            mech={app.mechanic?.name || 'Unassigned'}
                                            mechI={getInitials(app.mechanic?.name)}
                                            status={app.status}
                                            statusColor={app.status === 'Completed' ? 'green' : app.status === 'In Progress' ? 'orange' : 'blue'}
                                            amt={`Rs. ${getAppointmentAmount(app).toLocaleString()}`}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="admin-overview__panel admin-overview__panel--service-mix">
                    <div className="admin-overview__panel-head">
                        <div className="admin-overview__panel-head-title">Service Mix</div>
                    </div>
                    <div className="admin-overview__mix-body">
                        <div className="admin-overview__donut-wrap">
                            <svg viewBox="0 0 100 100" className="admin-overview__donut">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="16" />
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#F06A00" strokeWidth="16" strokeDasharray="105 159" strokeDashoffset="0" />
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#3B82F6" strokeWidth="16" strokeDasharray="63 201" strokeDashoffset="-105" />
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#10B981" strokeWidth="16" strokeDasharray="47 217" strokeDashoffset="-168" />
                                <circle cx="50" cy="50" r="42" fill="none" stroke="#8B5CF6" strokeWidth="16" strokeDasharray="31 233" strokeDashoffset="-215" />
                            </svg>
                            <div className="admin-overview__donut-center">
                                <div className="admin-overview__donut-count">{totalServiceCount}</div>
                                <div className="admin-overview__donut-caption">services</div>
                            </div>
                        </div>
                        <div className="admin-overview__legend-list">
                            {serviceMixForRender.length === 0 && <div className="admin-overview__empty-hint">No service data available.</div>}
                            {serviceMixForRender.map((item) => (
                                <LegendItem key={item.label} color={item.color} label={item.label} pct={item.pct} />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="admin-overview__panel admin-overview__panel--inventory">
                    <div className="admin-overview__panel-head">
                        <div className="admin-overview__panel-head-title">Inventory Status</div>
                        <button className="admin-overview__link-btn" onClick={() => navigate('/admin/inventory')}>Manage <ArrowRight size={12} /></button>
                    </div>
                    <div className="admin-overview__inventory-list">
                        {lowFirstInventory.length === 0 && <div className="admin-overview__empty-hint">No inventory data available.</div>}
                        {lowFirstInventory.map((item) => (
                            <InvMiniRow key={item.id} name={item.name} sku={item.sku} prog={item.prog} count={item.count} status={item.status} sColor={item.sColor} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

const KPICard = ({ label, val, delta, deltaType, size }) => (
    <div className={`admin-kpi admin-kpi--${size}`}>
        <div className="admin-kpi__label">{label}</div>
        <div className="admin-kpi__value">{val}</div>
        <div className={`admin-kpi__delta ${deltaType === 'up' ? 'admin-kpi__delta--up' : 'admin-kpi__delta--down'}`}>
            {deltaType === 'up' ? '▲' : '▼'} {delta}
        </div>
    </div>
);

const RevenueLineGraph = ({ data }) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = data.map((val, i) => ({ month: monthNames[i], revenue: val }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF5C1A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF5C1A" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 100, fill: '#94A3B8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 100, fill: '#94A3B8' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 'bold' }} cursor={{ stroke: '#FF5C1A', strokeWidth: 2, strokeDasharray: '5 5' }} />
                <Area type="monotone" dataKey="revenue" stroke="#FF5C1A" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" animationDuration={1500} />
            </AreaChart>
        </ResponsiveContainer>
    );
};

const MechRow = ({ initials, name, spec, jobs, status }) => (
    <div className="admin-mech-row">
        <div className="admin-mech-row__avatar">
            <span className="admin-mech-row__dot"></span>
            {initials}
        </div>
        <div className="admin-mech-row__meta">
            <div className="admin-mech-row__name">{name}</div>
            <div className="admin-mech-row__spec">{spec}</div>
        </div>
        <div className="admin-mech-row__stats">
            <div className="admin-mech-row__jobs">{jobs} jobs</div>
            <div className="admin-mech-row__status">{status}</div>
        </div>
    </div>
);

const JobTableRow = ({ car, plate, cust, mech, mechI, status, statusColor, amt }) => (
    <tr className="admin-job-row">
        <td>
            <div className="admin-job-row__car">{car}</div>
            <div className="admin-job-row__plate">{plate}</div>
        </td>
        <td><div className="admin-job-row__cust">{cust}</div></td>
        <td>
            <div className="admin-job-row__mech-wrap">
                <div className="admin-job-row__mech-avatar">{mechI}</div>
                <span className="admin-job-row__mech-name">{mech}</span>
            </div>
        </td>
        <td>
            <div className={`admin-job-row__status-badge admin-job-row__status-badge--${statusColor}`}>
                <span className="admin-job-row__status-dot"></span>
                {status}
            </div>
        </td>
        <td><div className="admin-job-row__amount">{amt}</div></td>
    </tr>
);

const LegendItem = ({ color, label, pct }) => (
    <div className="admin-legend-item">
        <div className={`admin-legend-item__swatch admin-legend-item__swatch--${color}`}></div>
        <div className="admin-legend-item__label">{label}</div>
        <div className="admin-legend-item__pct">{pct}</div>
    </div>
);

const InvMiniRow = ({ name, sku, prog, count, status, sColor }) => {
    const safeProg = Number.isFinite(prog) ? Math.max(0, Math.min(100, prog)) : 0;
    return (
        <div className="admin-inv-mini">
            <div className="admin-inv-mini__meta">
                <div className="admin-inv-mini__name">{name}</div>
                <div className="admin-inv-mini__sku">{sku}</div>
            </div>
            <div className="admin-inv-mini__track">
                <div className={`admin-inv-mini__fill admin-inv-mini__fill--${sColor}`} style={{ width: `${safeProg}%` }}></div>
            </div>
            <div className="admin-inv-mini__count">{count}</div>
            <div className={`admin-inv-mini__badge admin-inv-mini__badge--${sColor}`}>{status}</div>
        </div>
    );
};

export default AdminOverview;
