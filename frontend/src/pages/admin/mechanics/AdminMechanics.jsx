import './AdminMechanics.css';
import { useState, useEffect } from 'react';
import api from '../../../api/axios';

const AdminMechanics = () => {
    const [mechanics, setMechanics] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newMech, setNewMech] = useState({ name: '', email: '', phone: '', speciality: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchMechanics = async () => {
        try {
            const [mechanicsRes, bookingsRes] = await Promise.all([
                api.get('/mechanics'),
                api.get('/bookings/admin')
            ]);

            setMechanics(mechanicsRes.data || []);
            setBookings(bookingsRes.data || []);
        } catch (err) {
            console.error('Error fetching mechanics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMechanics();
    }, []);

    const handleAddMechanic = async (e) => {
        e.preventDefault();
        if (submitting) return;

        setError('');
        setSubmitting(true);
        try {
            await api.post('/mechanics', newMech);
            setNewMech({ name: '', email: '', phone: '', speciality: '' });
            setShowModal(false);
            fetchMechanics();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add mechanic');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this mechanic?')) return;
        try {
            await api.delete(`/mechanics/${id}`);
            fetchMechanics();
        } catch {
            alert('Failed to delete mechanic');
        }
    };

    const handleOpenModal = () => {
        setError('');
        setNewMech({ name: '', email: '', phone: '', speciality: '' });
        setShowModal(true);
    };

    const assignedBookings = bookings.filter((booking) => Boolean(booking.mechanicId));
    const todayDate = new Date();
    const jobsAssignedToday = assignedBookings.filter((booking) => {
        if (!booking?.createdAt) return false;
        const bookingDate = new Date(booking.createdAt);
        return bookingDate.toDateString() === todayDate.toDateString();
    }).length;
    const completedAssignedBookings = assignedBookings.filter((booking) => booking.status === 'Completed').length;
    const jobsPerMechanic = (assignedBookings.length / (mechanics.length || 1)).toFixed(1);
    const completionRate = assignedBookings.length > 0
        ? `${Math.round((completedAssignedBookings / assignedBookings.length) * 100)}%`
        : '0%';

    return (
        <div className="admin-mechanics-page">
            <div className="admin-mechanics-kpis">
                <StatCard label="Active Mechanics" value={mechanics.length} delta="All checked in" deltaColor="green" />
                <StatCard label="Jobs Assigned" value={assignedBookings.length} delta={`${jobsAssignedToday} today`} deltaColor="blue" />
                <StatCard label="Completion Rate" value={completionRate} delta={`${completedAssignedBookings} completed`} deltaColor="green" />
                <StatCard label="Jobs/Mechanic" value={jobsPerMechanic} delta="Today avg" deltaColor="blue" />
            </div>

            <section className="admin-mechanics-roster">
                <div className="admin-mechanics-roster__head">
                    <h3 className="admin-mechanics-roster__title">Mechanic Roster</h3>
                    <button onClick={handleOpenModal} className="admin-mechanics-roster__add-btn">+ Add Mechanic</button>
                </div>

                <div className="admin-mechanics-roster__table-wrap">
                    <table className="admin-mechanics-table">
                        <thead>
                            <tr>
                                <th>Mechanic</th>
                                <th>Speciality</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th className="is-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="admin-mechanics-table__empty">Loading mechanics...</td>
                                </tr>
                            ) : mechanics.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="admin-mechanics-table__empty">No mechanics found. Add your first team member!</td>
                                </tr>
                            ) : (
                                mechanics.map((mech) => (
                                    <MechRosterRow
                                        key={mech.id}
                                        name={mech.name}
                                        email={mech.email}
                                        phone={mech.phone}
                                        speciality={mech.speciality || 'General Mechanic'}
                                        status="Available"
                                        statusColor="green"
                                        onDelete={() => handleDelete(mech.id)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {showModal && (
                <div className="admin-mechanics-modal-backdrop">
                    <div className="admin-mechanics-modal-card">
                        <div className="admin-mechanics-modal-head">
                            <h3 className="admin-mechanics-modal-title">Register New Mechanic</h3>
                            <button onClick={() => setShowModal(false)} className="admin-mechanics-modal-close">✕</button>
                        </div>

                        {error && <div className="admin-mechanics-modal-error">{error}</div>}

                        <form onSubmit={handleAddMechanic} className="admin-mechanics-modal-form">
                            <div className="admin-mechanics-field">
                                <label>Full Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Enter full name"
                                    value={newMech.name}
                                    onChange={(e) => setNewMech({ ...newMech, name: e.target.value })}
                                />
                            </div>

                            <div className="admin-mechanics-field">
                                <label>Email Address</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="email@reidsauto.com"
                                    value={newMech.email}
                                    onChange={(e) => setNewMech({ ...newMech, email: e.target.value })}
                                />
                            </div>

                            <div className="admin-mechanics-grid-2">
                                <div className="admin-mechanics-field">
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        placeholder="+1..."
                                        value={newMech.phone}
                                        onChange={(e) => setNewMech({ ...newMech, phone: e.target.value })}
                                    />
                                </div>
                                <div className="admin-mechanics-field">
                                    <label>Speciality</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Brakes"
                                        value={newMech.speciality}
                                        onChange={(e) => setNewMech({ ...newMech, speciality: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="admin-mechanics-modal-note">
                                * A temporary password will be automatically generated and emailed to the mechanic.
                            </div>

                            <button type="submit" disabled={submitting} className="admin-mechanics-submit-btn">
                                {submitting ? (
                                    <>
                                        <span className="admin-mechanics-submit-spinner"></span>
                                        Registering...
                                    </>
                                ) : 'Register Mechanic'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, delta, deltaColor }) => (
    <div className="admin-mech-kpi">
        <div className="admin-mech-kpi__label">{label}</div>
        <div className="admin-mech-kpi__value">{value}</div>
        <div className={`admin-mech-kpi__delta ${deltaColor === 'green' ? 'is-green' : deltaColor === 'blue' ? 'is-blue' : 'is-red'}`}>
            {delta}
        </div>
    </div>
);

const MechRosterRow = ({ name, email, phone, speciality, status, statusColor, onDelete }) => (
    <tr className="admin-mechanics-row">
        <td>
            <div className="admin-mechanics-row__person">
                <div className="admin-mechanics-row__avatar">
                    {name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                    <span className="admin-mechanics-row__online-dot"></span>
                </div>
                <div className="admin-mechanics-row__person-meta">
                    <div className="admin-mechanics-row__name">{name}</div>
                    <div className="admin-mechanics-row__email">{email}</div>
                </div>
            </div>
        </td>
        <td className="admin-mechanics-row__speciality">{speciality}</td>
        <td className="admin-mechanics-row__phone">{phone || '—'}</td>
        <td>
            <span className={`admin-mechanics-row__status ${statusColor === 'green' ? 'is-green' : 'is-orange'}`}>
                <span></span>
                {status}
            </span>
        </td>
        <td className="admin-mechanics-row__actions">
            <button onClick={onDelete} className="admin-mechanics-row__delete-btn">Delete</button>
        </td>
    </tr>
);

export default AdminMechanics;

