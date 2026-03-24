import './PaymentSuccess.css';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [details, setDetails] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const pidx = searchParams.get('pidx');
    const appointmentId = searchParams.get('appointmentId');
    const mode = searchParams.get('mode') || (appointmentId ? 'appointment' : 'appointment');

    const handleContactSupport = () => {
        const token = localStorage.getItem('token');
        if (token) {
            (async () => {
                try {
                    const res = await api.post('/messages/payment-support/start', {
                        pidx,
                        amount: details?.total_amount ? details.total_amount / 100 : undefined,
                        appointmentId,
                        mode
                    });

                    navigate('/customer/chat', {
                        state: {
                            supportMode: true,
                            supportUserId: res.data?.adminId
                        }
                    });
                    return;
                } catch (error) {
                    console.error('Failed to initialize support chat:', error);
                    navigate('/customer/chat');
                }
            })();
            return;
        }

        navigate('/login');
    };

    useEffect(() => {
        const verifyPayment = async () => {
            if (!pidx) {
                setStatus('error');
                return;
            }

            try {
                const verifyUrl = mode === 'parts'
                    ? `/payment/verify?pidx=${pidx}&mode=parts`
                    : `/payment/verify?pidx=${pidx}&appointmentId=${appointmentId}`;

                const response = await api.get(verifyUrl);
                if (response.data.success) {
                    setStatus('success');
                    setDetails(response.data.data);

                    if (mode === 'parts') {
                        localStorage.removeItem('autoassist_customer_parts_cart');
                    }
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Verification failed:', error);
                setErrorMessage(
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    'We could not verify your payment at this time.'
                );
                setStatus('error');
            }
        };

        verifyPayment();
    }, [pidx, appointmentId, mode]);

    return (
        <div className="payment-success-page">
            <div className="payment-success-card">
                {status === 'verifying' && (
                    <div className="payment-success-state payment-success-state--verifying">
                        <div className="payment-success-spinner"></div>
                        <h2 className="payment-success-title payment-success-title--sm">Verifying Payment</h2>
                        <p className="payment-success-text">Please wait while we confirm your transaction with Khalti...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="payment-success-state payment-success-state--ok">
                        <div className="payment-success-icon">OK</div>
                        <h2 className="payment-success-title">Payment Successful!</h2>
                        <p className="payment-success-text payment-success-text--lg payment-success-text--mb">
                            {mode === 'parts'
                                ? 'Thank you for your payment. Your parts order is confirmed and stock has been updated.'
                                : 'Thank you for your payment. Your appointment has been marked as paid. You can now return to your dashboard.'}
                        </p>

                        <div className="payment-success-summary">
                            <div className="payment-success-summary__row payment-success-summary__row--mb">
                                <span className="payment-success-summary__label">Reference ID</span>
                                <span className="payment-success-summary__value payment-success-summary__value--mono">{pidx?.substring(0, 12)}...</span>
                            </div>
                            <div className="payment-success-summary__row">
                                <span className="payment-success-summary__label">Amount Paid</span>
                                <span className="payment-success-summary__value payment-success-summary__value--amount">NPR {(details?.total_amount / 100).toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/customer')}
                            className="payment-success-btn payment-success-btn--primary"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="payment-success-state payment-success-state--error">
                        <div className="payment-success-icon">NO</div>
                        <h2 className="payment-success-title">Verification Failed</h2>
                        <p className="payment-success-text payment-success-text--lg payment-success-text--mb">
                            {errorMessage || "We couldn't verify your payment. If the amount was deducted from your wallet, please contact support with your Transaction ID."}
                        </p>
                        <div className="payment-success-actions">
                            <button
                                onClick={() => navigate(mode === 'parts' ? '/customer/inventory' : '/customer/payment')}
                                className="payment-success-btn payment-success-btn--outline"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={handleContactSupport}
                                className="payment-success-btn payment-success-btn--primary"
                            >
                                Contact Support
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <p className="payment-success-footer-note">
                Redirecting you back to Auto Assist secure environment.
            </p>
        </div>
    );
};

export default PaymentSuccess;





