import { useState, useEffect, useMemo } from 'react';
import api from '../../../api/axios';
import './AdminCustomers.css';

const formatNpr = (value) => {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('en-NP', {
        style: 'currency',
        currency: 'NPR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number.isFinite(amount) ? amount : 0);
};

const AdminCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingCustomerId, setDeletingCustomerId] = useState(null);
    const [pendingDeleteCustomer, setPendingDeleteCustomer] = useState(null);
    const [deleteError, setDeleteError] = useState('');

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/customer/all');
            setCustomers(res.data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const totalSpent = useMemo(
        () => customers.reduce((sum, customer) => sum + (Number(customer.spent) || 0), 0),
        [customers]
    );

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0].substring(0, 2).toUpperCase();
    };

    const confirmDeleteCustomer = async () => {
        if (!pendingDeleteCustomer) return;
        try {
            setDeleteError('');
            setDeletingCustomerId(pendingDeleteCustomer.id);
            await api.delete(`/customer/${pendingDeleteCustomer.id}`);
            setCustomers((prev) => prev.filter((item) => item.id !== pendingDeleteCustomer.id));
            setPendingDeleteCustomer(null);
        } catch (error) {
            const message = error?.response?.data?.error || 'Failed to delete customer';
            setDeleteError(message);
        } finally {
            setDeletingCustomerId(null);
        }
    };

    if (loading) {
        return (
            <div className="admin-customers__loading">
                <div className="admin-customers__spinner"></div>
            </div>
        );
    }

    return (
        <div className="admin-customers">
            <div className="admin-customers__topbar">
                <div className="admin-customers__count">
                    {customers.length} total customers · Total spent: {formatNpr(totalSpent)}
                </div>
                <div className="admin-customers__search-group">
                    <div className="admin-customers__search-wrap">
                        <span className="admin-customers__search-icon">🔍</span>
                        <input placeholder="Search customers..." className="admin-customers__search-input" />
                    </div>
                </div>
            </div>

            {deleteError && <div className="admin-customers__delete-error">{deleteError}</div>}

            <div className="admin-customers__grid">
                {customers.length === 0 ? (
                    <div className="admin-customers__empty">No customers found.</div>
                ) : (
                    customers.map(customer => (
                        <div key={customer.id} className="admin-customers__card">
                            <div className="admin-customers__card-head">
                                <div className="admin-customers__avatar">{getInitials(customer.name)}</div>
                                <div className="admin-customers__identity">
                                    <div className="admin-customers__name">{customer.name}</div>
                                    <div className="admin-customers__email">{customer.email}</div>
                                </div>
                                <button
                                    type="button"
                                    className="admin-customers__delete-btn"
                                    onClick={() => {
                                        setDeleteError('');
                                        setPendingDeleteCustomer(customer);
                                    }}
                                    disabled={deletingCustomerId === customer.id}
                                >
                                    {deletingCustomerId === customer.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>

                            <div className="admin-customers__metrics">
                                <Metric label="Visits" value={customer.visits} />
                                <Metric label="Total Spent" value={formatNpr(customer.spent)} isLast />
                            </div>

                            <div className="admin-customers__tags">
                                {customer.vehicles.map(tag => (
                                    <span key={tag} className="admin-customers__tag">{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {pendingDeleteCustomer && (
                <div className="admin-customers__modal-overlay" role="dialog" aria-modal="true">
                    <div className="admin-customers__modal">
                        <div className="admin-customers__modal-title">Delete Customer</div>
                        <div className="admin-customers__modal-text">
                            Delete {pendingDeleteCustomer.name || 'this customer'}? This action cannot be undone.
                        </div>
                        <div className="admin-customers__modal-actions">
                            <button
                                type="button"
                                className="admin-customers__modal-btn admin-customers__modal-btn--cancel"
                                onClick={() => setPendingDeleteCustomer(null)}
                                disabled={deletingCustomerId === pendingDeleteCustomer.id}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="admin-customers__modal-btn admin-customers__modal-btn--danger"
                                onClick={confirmDeleteCustomer}
                                disabled={deletingCustomerId === pendingDeleteCustomer.id}
                            >
                                {deletingCustomerId === pendingDeleteCustomer.id ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Metric = ({ label, value, isLast }) => (
    <div className={`admin-customers__metric ${isLast ? '' : 'admin-customers__metric--divider'}`}>
        <div className="admin-customers__metric-value">{value}</div>
        <div className="admin-customers__metric-label">{label}</div>
    </div>
);

export default AdminCustomers;

