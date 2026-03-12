import './CustomerHistory.css';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api/axios';
import {
    Droplets,
    Disc,
    Wrench,
    ScrollText
} from 'lucide-react';
import InvoiceModal from '../../../components/InvoiceModal';

const CustomerHistory = () => {
    const navigate = useNavigate();
    const { bookingId } = useParams();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/bookings');
                setBookings(res.data);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        if (!bookingId || bookings.length === 0) return;

        const selectedBooking = bookings.find((b) => String(b.id) === String(bookingId));
        if (selectedBooking) {
            openDetailsModal(selectedBooking);
        }
    }, [bookingId, bookings]);

    const calculateTotal = (booking) => {
        if (booking.invoice?.totalAmount) return booking.invoice.totalAmount;
        if (booking.amount > 0) return booking.amount;
        const pts = booking.parts?.reduce((sum, jp) =>
            sum + ((jp.part?.price || 0) * (jp.quantity || 1)), 0) || 0;
        return pts;
    };

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0].substring(0, 2).toUpperCase();
    };

    const openInvoiceModal = (booking) => {
        const fallbackInvoice = {
            invoiceNumber: booking?.invoice?.invoiceNumber || `APP-${booking?.id || 'N/A'}`,
            partsTotal: booking?.invoice?.partsTotal || 0,
            laborCost: booking?.invoice?.laborCost || Math.max((booking?.amount || 0) - ((booking?.invoice?.partsTotal || 0)), 0),
            tax: booking?.invoice?.tax || 0,
            totalAmount: booking?.invoice?.totalAmount || calculateTotal(booking),
            parts: booking?.parts || booking?.invoice?.appointment?.parts || []
        };

        setSelectedInvoice(fallbackInvoice);
        setIsInvoiceModalOpen(true);
    };

    const openDetailsModal = (booking) => {
        setSelectedBooking(booking);
        setIsDetailsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="customer-history-loading">
                <div className="customer-history-spinner"></div>
            </div>
        );
    }

    return (
        <div className="customer-history-page">
            <div className="customer-history-shell">
                <div className="customer-history-header">
                    <h2 className="customer-history-title">My Service History</h2>
                    <p className="customer-history-subtitle">All your past repair records in one place.</p>
                </div>
                <div className="customer-history-toolbar">
                    <button className="customer-history-chip is-active">ALL JOBS</button>
                    <button className="customer-history-chip is-muted">DOWNLOAD PDF (SOON)</button>
                </div>

                {bookings.length === 0 ? (
                    <div className="customer-history-empty">
                        <div className="customer-history-empty-icon"><ScrollText size={48} /></div>
                        Your service history will appear here.
                    </div>
                ) : (
                    bookings.map(app => (
                        <HistoryEntry
                            key={app.id}
                            icon={app.service.toLowerCase().includes('oil') ? <Droplets size={22} color="#3B82F6" /> : app.service.toLowerCase().includes('brake') ? <Disc size={22} color="#F43F5E" /> : <Wrench size={22} color="#F59E0B" />}
                            title={`${app.vehicle?.make} ${app.vehicle?.model} — ${app.service}`}
                            date={`${new Date(app.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })} · ${app.time}`}
                            status={app.status === 'Completed' ? null : app.status}
                            amount={`Rs. ${calculateTotal(app).toLocaleString()}`}
                            tags={[app.service]}
                            isCancelled={app.status === 'Cancelled'}
                            invoice={app.invoice}
                            mech={{
                                name: app.status === 'Cancelled' ? 'Cancelled' : (app.mechanic?.name || 'Assigned'),
                                av: app.mechanic?.name ? getInitials(app.mechanic?.name) : '?',
                                color: '#D97706'
                            }}
                            action={app.status === 'In Progress' ? 'Track Live →' : app.status === 'Cancelled' ? 'Rebook →' : 'View Details'}
                            onAction={() => {
                                if (app.status === 'In Progress') {
                                    navigate('/customer/tracking');
                                    return;
                                }
                                if (app.status === 'Cancelled') {
                                    navigate('/customer/book');
                                    return;
                                }
                                navigate(`/customer/history/${app.id}`);
                            }}
                            onViewInvoice={() => openInvoiceModal(app)}
                        />
                    ))
                )}

                {isDetailsModalOpen && selectedBooking && (
                    <div className="customer-history-details-backdrop" onClick={() => {
                        setIsDetailsModalOpen(false);
                        if (bookingId) navigate('/customer/history');
                    }}>
                        <div className="customer-history-details-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="customer-history-details-head">
                                <h3>Service Details</h3>
                                <button
                                    className="customer-history-details-close"
                                    onClick={() => {
                                        setIsDetailsModalOpen(false);
                                        if (bookingId) navigate('/customer/history');
                                    }}
                                >
                                    x
                                </button>
                            </div>

                            <div className="customer-history-details-grid">
                                <div><span>Vehicle</span><strong>{selectedBooking.vehicle?.make} {selectedBooking.vehicle?.model}</strong></div>
                                <div><span>Service</span><strong>{selectedBooking.service}</strong></div>
                                <div><span>Status</span><strong>{selectedBooking.status}</strong></div>
                                <div><span>Date</span><strong>{new Date(selectedBooking.createdAt).toLocaleDateString()}</strong></div>
                                <div><span>Time</span><strong>{selectedBooking.time || 'N/A'}</strong></div>
                                <div><span>Mechanic</span><strong>{selectedBooking.mechanic?.name || 'Assigned'}</strong></div>
                                <div><span>Total</span><strong>Rs. {calculateTotal(selectedBooking).toLocaleString()}</strong></div>
                            </div>
                        </div>
                    </div>
                )}

                <InvoiceModal
                    isOpen={isInvoiceModalOpen}
                    onClose={() => {
                        setIsInvoiceModalOpen(false);
                    }}
                    invoice={selectedInvoice}
                />
            </div>
        </div>
    );
};

const HistoryEntry = ({ icon, title, date, status, amount, tags, mech, action, onViewInvoice, invoice, onAction, isCancelled = false }) => (
    <div className={`customer-history-entry ${isCancelled ? 'is-cancelled' : ''}`}>
        <div className="customer-history-entry-header">
            <div className="customer-history-entry-main">
                <div className="customer-history-entry-icon">{icon}</div>
                <div>
                    <div className="customer-history-entry-title">{title}</div>
                    <div className="customer-history-entry-date">{date}</div>
                </div>
            </div>
            {status ? (
                <span className="customer-history-entry-status">{status}</span>
            ) : (
                <div className="customer-history-entry-amount">{amount}</div>
            )}
        </div>
        <div className="customer-history-entry-tags">
            {tags.map(t => (
                <div key={t} className="customer-history-entry-tag">{t}</div>
            ))}
        </div>
        <div className="customer-history-entry-footer">
            <div className="customer-history-entry-mechanic">
                MECH: <span className="customer-history-entry-mechanic-name">{mech.name}</span>
            </div>
            <div className="customer-history-entry-actions">
                {invoice && (
                    <button
                        onClick={() => onViewInvoice(invoice)}
                        className="customer-history-invoice-button"
                    >
                        INVOICE
                    </button>
                )}
                <button
                    className="customer-history-action-button"
                    onClick={onAction}
                >
                    {action.toUpperCase()}
                </button>
            </div>
        </div>
    </div>
);

export default CustomerHistory;





