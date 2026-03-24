import './CustomerPayment.css';
import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import khalti from '../../../assets/khalti.webp';

const CustomerPayment = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState(null);
    const [activeInvoice, setActiveInvoice] = useState(null); // ✅ FIX: was undefined
    const [status, setStatus] = useState('Idle');

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/bookings');
            setBookings(res.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const pendingInvoices = bookings.filter(b => b.status === 'Completed' && !b.isPaid);
    const pastPayments = bookings.filter(b => b.isPaid);

    const calculateTotal = (booking) => {
        if (booking.invoice) {
            const partsTotal = booking.invoice.partsTotal || 0;
            const laborCost = booking.invoice.laborCost || 0;
            const tax = booking.invoice.tax || 0;
            return booking.invoice.totalAmount ?? (partsTotal + laborCost + tax);
        }
        if (booking.amount > 0) return booking.amount;
        const partsTotal = booking.parts?.reduce((sum, jp) =>
            sum + ((jp.part?.price || 0) * (jp.quantity || 1)), 0) || 0;
        return partsTotal;
    };

    const handlePay = async (inv) => {
        try {
            setPayingId(inv.id);
            setActiveInvoice(inv); // ✅ FIX: track which invoice is being paid
            setStatus('Initiating Khalti...');

            const response = await api.post('/payment/initiate', { appointmentId: inv.id });

            if (response.data.payment_url) {
                window.location.href = response.data.payment_url;
            } else {
                throw new Error('Failed to get payment URL from Khalti');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert(error.response?.data?.error || 'Payment initiation failed. Please try again.');
            setStatus('Idle');
            setPayingId(null);
            setActiveInvoice(null);
        }
    };

    if (loading) {
        return (
            <div className="customer-payment-loading">
                <div className="customer-payment-spinner"></div>
            </div>
        );
    }

    return (
        <div className="customer-payment-page">
            <div className="customer-payment-shell">
                <div className="customer-payment-section-label">Pending invoices</div>

                {pendingInvoices.length > 0 ? (
                    pendingInvoices.map((inv) => {
                        const totalToPay = calculateTotal(inv);
                        const partsBreakdown = (inv.parts || []).map((jp) => {
                            const qty = jp.quantity || 1;
                            const unitPrice = jp.priceAtTime || jp.part?.price || 0;
                            return {
                                id: jp.id,
                                name: jp.part?.name || 'Part',
                                qty,
                                lineTotal: qty * unitPrice
                            };
                        });
                        return (
                            <div key={inv.id} className="customer-payment-invoice-card">
                                <div className="customer-payment-card-head">
                                    <div className="customer-payment-head-glow"></div>
                                    <div className="customer-payment-head-row">
                                        <div>
                                            <div className="customer-payment-brand-row">
                                                <div className="customer-payment-brand-logo">A</div>
                                                <span className="customer-payment-brand-name">Auto Assist</span>
                                            </div>
                                            <div className="customer-payment-invoice-id">{inv.invoice?.invoiceNumber || `INV-${inv.id}`} · {new Date(inv.createdAt).toLocaleDateString()}</div>
                                        </div>
                                        <span className={`customer-payment-status-pill ${inv.isPaid ? 'is-paid' : 'is-due'}`}>
                                            {inv.isPaid ? 'Paid' : 'Due Now'}
                                        </span>
                                    </div>
                                    <div className="customer-payment-total">Rs. {totalToPay.toLocaleString()}</div>
                                </div>

                                <div className="customer-payment-card-body">
                                    <div className="customer-payment-meta-grid">
                                        <InvMeta label="Vehicle" val={`${inv.vehicle?.make} ${inv.vehicle?.model}`} />
                                        <InvMeta label="Mechanic" val={inv.mechanic?.name || 'Service Team'} />
                                        <InvMeta label="Service" val={inv.service} />
                                        <InvMeta label="Date" val={new Date(inv.createdAt).toLocaleDateString()} />
                                    </div>

                                    <div className="customer-payment-lines">
                                        <InvLine
                                            label="Parts Total"
                                            sub="All replaced components"
                                            price={`Rs. ${(inv.invoice?.partsTotal || inv.parts?.reduce((s, jp) => s + (jp.part?.price * jp.quantity), 0) || 0).toLocaleString()}`}
                                        />
                                        {partsBreakdown.length > 0 && (
                                            <div className="customer-payment-parts-breakdown">
                                                {partsBreakdown.map((part) => (
                                                    <div key={part.id} className="customer-payment-part-row">
                                                        <span className="customer-payment-part-name">{part.name} x {part.qty}</span>
                                                        <span className="customer-payment-part-value">Rs. {part.lineTotal.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <InvLine
                                            label="Labor Cost"
                                            sub="Professional technical service"
                                            price={inv.invoice ? `Rs. ${inv.invoice.laborCost.toLocaleString()}` : "TBD"}
                                        />
                                        {inv.invoice?.discountAmount > 0 && (
                                            <InvLine label="Discount" sub="Loyalty/Promo discount" price={`- Rs. ${inv.invoice.discountAmount.toLocaleString()}`} />
                                        )}
                                        {inv.invoice?.taxAmount > 0 && (
                                            <InvLine label="Tax" sub="Applicable taxes" price={`Rs. ${inv.invoice.taxAmount.toLocaleString()}`} />
                                        )}
                                    </div>

                                    <div className="customer-payment-summary">
                                        <div className="customer-payment-summary-rows">
                                            <TotalRow label="Subtotal" val={`Rs. ${(
                                                (inv.invoice?.partsTotal || 0) +
                                                (inv.invoice?.laborCost || 0)
                                            ).toLocaleString()}`} />
                                            {inv.invoice?.discountAmount > 0 && (
                                                <TotalRow label="Discount" val={`- Rs. ${inv.invoice.discountAmount.toLocaleString()}`} isGreen />
                                            )}
                                            {inv.invoice?.taxAmount > 0 && (
                                                <TotalRow label="Tax" val={`Rs. ${inv.invoice.taxAmount.toLocaleString()}`} />
                                            )}
                                            <div className="customer-payment-grand-total">
                                                <span className="customer-payment-grand-total-label">Total Due</span>
                                                <span className="customer-payment-grand-total-value">Rs. {totalToPay.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {!inv.isPaid && status === 'Idle' && (
                                        <div className="customer-payment-pay-panel">
                                            <div className="customer-payment-section-label">Pay now</div>
                                            <div className="customer-payment-method-card">
                                                <span className="customer-payment-method-icon"><img src={khalti} alt="" /></span>
                                                <div className="customer-payment-method-copy">
                                                    <div className="customer-payment-method-name">Khalti</div>
                                                    <div className="customer-payment-method-sub">Secure checkout</div>
                                                </div>
                                            </div>
                                            <button
                                                className="customer-payment-pay-button"
                                                onClick={() => handlePay(inv)} // ✅ FIX: pass full inv object
                                                disabled={payingId === inv.id && status !== 'Idle'}
                                            >
                                                {payingId === inv.id && status !== 'Idle' ? 'Processing...' : `Pay Rs. ${totalToPay.toLocaleString()} Securely`}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="customer-payment-empty-state">
                        <div className="customer-payment-empty-icon">✨</div>
                        <h3 className="customer-payment-empty-title">All caught up!</h3>
                        <p className="customer-payment-empty-note">You don't have any pending invoices at the moment.</p>
                    </div>
                )}

                {status === 'Processing...' && (
                    <button className="customer-payment-processing-button" disabled>⏳ Processing payment...</button>
                )}

                {status === 'Paid' && (
                    <div className="customer-payment-success-banner">
                        <div className="customer-payment-success-icon">✅</div>
                        <div className="customer-payment-success-title">Payment Successful!</div>
                        <div className="customer-payment-success-ref">Transaction Ref: AS-{activeInvoice?.id}98321</div>
                        <button
                            onClick={() => setStatus('Idle')}
                            className="customer-payment-success-link"
                        >
                            View other invoices
                        </button>
                    </div>
                )}

                <div className="customer-payment-section-label customer-payment-history-label">Past payments</div>
                <div className="customer-payment-history-list">
                    {pastPayments.length === 0 ? (
                        <div className="customer-payment-history-empty">No payment history yet.</div>
                    ) : (
                        pastPayments.map(payment => (
                            <div key={payment.id} className="customer-payment-history-card">
                                <div className="customer-payment-history-row">
                                    <div className="customer-payment-history-badge">✅</div>
                                    <div className="customer-payment-history-copy">
                                        <div className="customer-payment-history-title">{payment.service} · {payment.vehicle?.make} {payment.vehicle?.model}</div>
                                        <div className="customer-payment-history-meta">{new Date(payment.updatedAt).toLocaleDateString()} · INV-{payment.id}041</div>
                                    </div>
                                    <div className="customer-payment-history-amount">Rs. {calculateTotal(payment).toLocaleString()}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const InvMeta = ({ label, val }) => (
    <div className="customer-payment-meta-item">
        <div className="customer-payment-meta-label">{label}</div>
        <div className="customer-payment-meta-value">{val}</div>
    </div>
);

const InvLine = ({ label, sub, price, isFree = false }) => (
    <div className="customer-payment-line-item">
        <div className="customer-payment-line-copy">
            <div className="customer-payment-line-label">{label}</div>
            <div className="customer-payment-line-sub">{sub}</div>
        </div>
        <div className={`customer-payment-line-value ${isFree ? 'is-green' : ''}`}>{price}</div>
    </div>
);

const TotalRow = ({ label, val, isGreen = false }) => (
    <div className="customer-payment-total-row">
        <span className="customer-payment-total-row-label">{label}</span>
        <span className={`customer-payment-total-row-value ${isGreen ? 'is-green' : ''}`}>{val}</span>
    </div>
);

export default CustomerPayment;