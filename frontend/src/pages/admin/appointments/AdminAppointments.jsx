import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import InvoiceModal from '../../../components/InvoiceModal';
import './AdminAppointments.css';

const AdminAppointments = () => {
    const [activeFilter, setActiveFilter] = useState('All');
    const [appointments, setAppointments] = useState([]);
    const [mechanics, setMechanics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [apptRes, mechRes] = await Promise.all([
                api.get('/bookings/admin'),
                api.get('/mechanics')
            ]);
            setAppointments(apptRes.data);
            setMechanics(mechRes.data);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAssign = async (appointmentId, mechanicId) => {
        try {
            await api.put(`/bookings/${appointmentId}`, { mechanicId: mechanicId || null });
            const res = await api.get('/bookings/admin');
            setAppointments(res.data);
        } catch (error) {
            console.error('Error assigning mechanic:', error);
            alert('Failed to assign mechanic');
        }
    };

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0].substring(0, 2).toUpperCase();
    };

    const filteredAppointments = appointments.filter(app => {
        const passesFilter = activeFilter === 'All' ? true : app.status === activeFilter;
        if (!passesFilter) return false;
        if (!searchTerm.trim()) return true;
        const haystack = [
            app.vehicle?.make, app.vehicle?.model, app.vehicle?.plate,
            app.user?.name, app.service, app.mechanic?.name, app.status
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(searchTerm.trim().toLowerCase());
    });

    const getAppointmentAmount = (app) => {
        if (app?.invoice?.totalAmount) return app.invoice.totalAmount;
        return app?.amount || 0;
    };

    const openInvoice = (app) => {
        const vehicleName = [app?.vehicle?.make, app?.vehicle?.model]
            .filter(Boolean).join(' ') || '-';
        const customerName = app?.user?.name || '-';

        let invoiceData;
        if (app.invoice) {
            invoiceData = {
                ...app.invoice,
                parts: app.parts || [],
                vehicleName,
                customerName,
            };
        } else {
            invoiceData = {
                invoiceNumber: `APP-${app?.id || 'N/A'}`,
                partsTotal: 0,
                laborCost: Math.max((app?.amount || 0), 0),
                tax: 0,
                totalAmount: getAppointmentAmount(app),
                parts: app?.parts || [],
                vehicleName,
                customerName,
                appointmentDate: app?.createdAt || null,
                discountAmount: 0,
            };
        }
        // Only open modal if total is greater than zero
        const total = invoiceData.totalAmount ?? (invoiceData.partsTotal + invoiceData.laborCost - (invoiceData.discountAmount ?? 0) + (invoiceData.tax ?? 0));
        if (total > 0) {
            setSelectedInvoice(invoiceData);
            setIsInvoiceModalOpen(true);
        } else {
            // Show a professional message for zero bill
            window.alert('No invoice is available for this appointment as the total bill is Rs. 0. If you believe this is an error, please contact Auto Assist support.');
            setSelectedInvoice(null);
            setIsInvoiceModalOpen(false);
        }
    };

    const counts = {
        All: appointments.length,
        'In Progress': appointments.filter(a => a.status === 'In Progress').length,
        Pending: appointments.filter(a => a.status === 'Pending').length,
        Completed: appointments.filter(a => a.status === 'Completed').length,
        Cancelled: appointments.filter(a => a.status === 'Cancelled').length,
    };

    const filters = [
        { label: 'All', count: counts.All },
        { label: 'In Progress', count: counts['In Progress'] },
        { label: 'Pending', count: counts.Pending },
        { label: 'Completed', count: counts.Completed },
        { label: 'Cancelled', count: counts.Cancelled },
    ];

    if (loading) {
        return (
            <div className="admin-appt__loading">
                <div className="admin-appt__spinner"></div>
            </div>
        );
    }

    return (
        <div className="admin-appt">
            <div className="admin-appt__panel">
                <div className="admin-appt__toolbar">
                    {filters.map(f => (
                        <button
                            key={f.label}
                            onClick={() => setActiveFilter(f.label)}
                            className={`admin-appt__filter-btn ${activeFilter === f.label ? 'admin-appt__filter-btn--active' : ''}`}
                        >
                            {f.label} ({f.count})
                        </button>
                    ))}
                    <div className="admin-appt__toolbar-right">
                        <div className="admin-appt__search-wrap">
                            <span className="admin-appt__search-icon">🔍</span>
                            <input
                                placeholder="Search..."
                                className="admin-appt__search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="admin-appt__table-wrap">
                    <table className="admin-appt__table">
                        <thead>
                            <tr>
                                <th>Vehicle</th>
                                <th>Customer</th>
                                <th>Service</th>
                                <th>Mechanic</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Amount</th>
                                <th className="admin-appt__th-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="admin-appt__empty">No appointments found.</td>
                                </tr>
                            ) : (
                                filteredAppointments.map(app => (
                                    <ApptRow
                                        key={app.id}
                                        id={app.id}
                                        car={`${app.vehicle?.make} ${app.vehicle?.model}`}
                                        plate={app.vehicle?.plate}
                                        cust={app.user?.name}
                                        i={getInitials(app.user?.name)}
                                        cBg="#F06A00"
                                        svc={app.service}
                                        mechId={app.mechanicId}
                                        mechBg="#64748B"
                                        mechI={getInitials(app.mechanic?.name)}
                                        time={app.time}
                                        status={app.status}
                                        sColor={app.status === 'Completed' ? 'green' : app.status === 'In Progress' ? 'orange' : app.status === 'Pending' ? 'blue' : 'red'}
                                        amt={`Rs. ${getAppointmentAmount(app).toLocaleString()}`}
                                        mechanics={mechanics}
                                        onAssign={handleAssign}
                                        onView={() => setSelectedAppointment(app)}
                                        onInvoice={() => openInvoice(app)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="admin-appt__footer">
                    <div>
                        Showing <span className="admin-appt__footer-strong">{filteredAppointments.length}</span> of <span className="admin-appt__footer-strong">{appointments.length}</span> appointments
                    </div>
                    <div className="admin-appt__footer-actions">
                        <button className="admin-appt__pager-btn">Prev</button>
                        <button className="admin-appt__pager-btn">Next</button>
                    </div>
                </div>

                {selectedAppointment && (
                    <div className="admin-appt__modal-backdrop" onClick={() => setSelectedAppointment(null)}>
                        <div className="admin-appt__modal" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-appt__modal-head">
                                <h3 className="admin-appt__modal-title">Appointment Details</h3>
                                <button className="admin-appt__modal-close" onClick={() => setSelectedAppointment(null)}>&times;</button>
                            </div>
                            <div className="admin-appt__modal-grid">
                                <DetailItem label="Vehicle" value={`${selectedAppointment.vehicle?.make || '-'} ${selectedAppointment.vehicle?.model || ''}`.trim()} />
                                <DetailItem label="Plate" value={selectedAppointment.vehicle?.plate || '-'} />
                                <DetailItem label="Customer" value={selectedAppointment.user?.name || '-'} />
                                <DetailItem label="Mechanic" value={selectedAppointment.mechanic?.name || 'Unassigned'} />
                                <DetailItem label="Service" value={selectedAppointment.service || '-'} />
                                <DetailItem label="Status" value={selectedAppointment.status || '-'} />
                                <DetailItem label="Time" value={selectedAppointment.time || '-'} />
                                <DetailItem label="Amount" value={`Rs. ${getAppointmentAmount(selectedAppointment).toLocaleString()}`} />
                            </div>
                            <div className="admin-appt__modal-actions">
                                <button className="admin-appt__action-btn" onClick={() => openInvoice(selectedAppointment)}>Open Invoice</button>
                                <button className="admin-appt__action-btn" onClick={() => setSelectedAppointment(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                <InvoiceModal
                    isOpen={isInvoiceModalOpen}
                    onClose={() => setIsInvoiceModalOpen(false)}
                    invoice={selectedInvoice}
                />
            </div>
        </div>
    );
};

const ApptRow = ({ id, car, plate, cust, i, cBg, svc, mechId, mechBg, mechI, time, status, sColor, amt, mechanics, onAssign, onView, onInvoice }) => {
    const isUnassigned = !mechId;
    const colorMap = { '#F06A00': 'admin-appt__badge-bg--brand', '#64748B': 'admin-appt__badge-bg--muted' };

    return (
        <tr className="admin-appt__row">
            <td>
                <div className="admin-appt__car">{car}</div>
                <div className="admin-appt__plate">{plate}</div>
            </td>
            <td>
                <div className="admin-appt__cust-wrap">
                    <div className={`admin-appt__cust-avatar ${colorMap[cBg] || 'admin-appt__badge-bg--brand'}`}>{i}</div>
                    <div className="admin-appt__cust-name">{cust}</div>
                </div>
            </td>
            <td><div className="admin-appt__svc">{svc}</div></td>
            <td>
                <div className="admin-appt__mech-wrap">
                    <div className={`admin-appt__mech-avatar ${isUnassigned ? 'admin-appt__mech-avatar--unassigned' : (colorMap[mechBg] || 'admin-appt__badge-bg--muted')}`}>{isUnassigned ? '?' : mechI}</div>
                    <select
                        value={mechId || ''}
                        onChange={(e) => onAssign(id, e.target.value)}
                        className={`admin-appt__mech-select ${isUnassigned ? 'admin-appt__mech-select--unassigned' : ''}`}
                    >
                        <option value="">Unassigned</option>
                        {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </td>
            <td><div className="admin-appt__time">{time}</div></td>
            <td>
                <div className={`admin-appt__status ${sColor === 'orange' ? 'admin-appt__status--orange' : sColor === 'blue' ? 'admin-appt__status--blue' : sColor === 'yellow' ? 'admin-appt__status--yellow' : sColor === 'purple' ? 'admin-appt__status--purple' : 'admin-appt__status--green'}`}>
                    <span className="admin-appt__status-dot"></span>
                    {status}
                </div>
            </td>
            <td><div className="admin-appt__amount">{amt}</div></td>
            <td className="admin-appt__actions-col">
                <div className="admin-appt__actions">
                    <button className="admin-appt__action-btn" onClick={onView}>View</button>
                    <button className="admin-appt__action-btn" onClick={onInvoice}>Invoice</button>
                </div>
            </td>
        </tr>
    );
};

const DetailItem = ({ label, value }) => (
    <div className="admin-appt__detail-item">
        <div className="admin-appt__detail-label">{label}</div>
        <div className="admin-appt__detail-value">{value}</div>
    </div>
);

export default AdminAppointments;