import './CustomerTracking.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import InvoiceModal from '../../../components/InvoiceModal';
import {
    CheckCircle2,
    ClipboardList,
    Wrench,
    Search,
    Car
} from 'lucide-react';

const STAGES = ['Vehicle Checked In', 'Diagnostic', 'Parts Replacement', 'Quality Check', 'Ready for Pickup'];

const CustomerTracking = () => {
    const navigate = useNavigate();
    const [activeJob, setActiveJob] = useState(null);
    const [jobParts, setJobParts] = useState([]);
    const [jobUpdates, setJobUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    const fetchInvoice = async (jobId) => {
        try {
            const res = await api.get(`/invoices/${jobId}`);
            setInvoice(res.data);
        } catch (error) {
            console.error('Error fetching invoice:', error);
        }
    };

    const fetchActiveJob = useCallback(async () => {
        try {
            const res = await api.get('/bookings');
            const job =
                res.data.find((b) => b.status === 'In Progress') ||
                res.data.find((b) => b.status === 'Pending') ||
                res.data.find((b) => b.status === 'Completed' && b.stage === 'Ready for Pickup');

            if (job) {
                setActiveJob(job);
                const [partsRes, updatesRes] = await Promise.all([
                    api.get(`/bookings/${job.id}/parts`),
                    api.get(`/bookings/${job.id}/updates`)
                ]);
                setJobParts(partsRes.data || []);
                setJobUpdates(updatesRes.data || []);

                if (job.status === 'Completed') {
                    fetchInvoice(job.id);
                }
            }
        } catch (error) {
            console.error('Error fetching tracking data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveJob();
        const interval = setInterval(fetchActiveJob, 30000);
        return () => clearInterval(interval);
    }, [fetchActiveJob]);

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0].substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="customer-tracking-loading">
                <div className="customer-tracking-spinner"></div>
            </div>
        );
    }

    if (!activeJob) {
        return (
            <div className="customer-tracking-empty">
                <div className="customer-tracking-empty__icon">📍</div>
                <h2 className="customer-tracking-empty__title">No Active Tracking</h2>
                <p className="customer-tracking-empty__note">
                    You don't have any vehicles currently in service or scheduled for immediate repair.
                </p>
                <button
                    onClick={() => navigate('/customer/history')}
                    className="customer-tracking-empty__btn"
                >
                    View History
                </button>
            </div>
        );
    }

    const currentStage = activeJob.stage === 'Pending' ? 'Vehicle Checked In' : (activeJob.stage || 'Vehicle Checked In');
    const currentIndex = Math.max(0, STAGES.indexOf(currentStage));
    const progress = Math.max(0, Math.min(100, activeJob.progress || 0));

    return (
        <div className="customer-tracking-page">
            <div className="customer-tracking-shell">
                <section className="customer-tracking-status-card">
                    <div className="customer-tracking-status-card__head">
                        <div>
                            <div className="customer-tracking-status-card__title">
                                {activeJob.vehicle?.make} {activeJob.vehicle?.model} - {activeJob.service}
                            </div>
                            <div className="customer-tracking-status-card__subtitle">
                                Current Stage: <span>{activeJob.stage || 'Checked In'}</span> · Tracking since {new Date(activeJob.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="customer-tracking-status-card__actions">
                            {activeJob.status === 'Completed' && (
                                <button
                                    onClick={() => setShowInvoiceModal(true)}
                                    className="customer-tracking-status-card__invoice-btn"
                                >
                                    View Invoice
                                </button>
                            )}
                            <span className={`customer-tracking-status-pill ${activeJob.status === 'In Progress' ? 'is-progress' : 'is-other'}`}>
                                <span className="customer-tracking-status-pill__dot"></span>
                                {activeJob.status}
                            </span>
                        </div>
                    </div>
                    <div className="customer-tracking-progress-track">
                        <div className="customer-tracking-progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="customer-tracking-progress-value">{progress}%</div>
                </section>

                <div className="customer-tracking-stage-row scrollbar-hide">
                    <StepChip icon={<CheckCircle2 size={18} />} label="Check-In" done={currentIndex > 0} active={currentStage === 'Vehicle Checked In'} />
                    <StepChip icon={<ClipboardList size={18} />} label="Diagnosed" done={currentIndex > 1} active={currentStage === 'Diagnostic'} />
                    <StepChip icon={<Wrench size={18} />} label="Repairing" done={currentIndex > 2} active={currentStage === 'Parts Replacement'} />
                    <StepChip icon={<Search size={18} />} label="QA Check" done={currentIndex > 3} active={currentStage === 'Quality Check'} />
                    <StepChip icon={<Car size={18} />} label="Ready!" done={false} active={currentStage === 'Ready for Pickup'} />
                </div>

                <section className="customer-tracking-mech-card">
                    <div className="customer-tracking-mech-card__avatar">
                        {activeJob.mechanic?.name ? getInitials(activeJob.mechanic.name) : '??'}
                    </div>
                    <div className="customer-tracking-mech-card__meta">
                        <div className="customer-tracking-mech-card__name">{activeJob.mechanic?.name || 'Assigning Mechanic...'}</div>
                        <div className="customer-tracking-mech-card__spec">{activeJob.mechanic?.speciality || 'General Specialist'} · ⭐ 4.8</div>
                        <div className="customer-tracking-mech-card__online"><span></span>Online now</div>
                    </div>
                    {activeJob.mechanicId && (
                        <button
                            className="customer-tracking-mech-card__chat-btn"
                            onClick={() => navigate('/customer/chat', { state: { mechanicId: activeJob.mechanicId } })}
                        >
                            Send message
                        </button>
                    )}
                </section>

                <div className="customer-tracking-section-title">Live updates from shop</div>
                <section className="customer-tracking-feed-card">
                    {jobUpdates.length === 0 ? (
                        <div className="customer-tracking-empty-card">No live updates yet. The shop will post notes as work progresses.</div>
                    ) : (
                        jobUpdates.map((update, idx) => (
                            <LiveUpdateItem
                                key={update.id}
                                msg={update.content}
                                time={new Date(update.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                name={activeJob.mechanic?.name || 'Service Team'}
                                isNew={idx === 0}
                                isLast={idx === jobUpdates.length - 1}
                            />
                        ))
                    )}
                </section>

                <div className="customer-tracking-section-title">Parts logged for repair</div>
                <section className="customer-tracking-parts-card">
                    {jobParts.length === 0 ? (
                        <div className="customer-tracking-empty-card">No parts logged yet.</div>
                    ) : (
                        <>
                            <div className="customer-tracking-parts-list">
                                {jobParts.map((jp) => (
                                    <div key={jp.id} className="customer-tracking-part-row">
                                        <div>
                                            <div className="customer-tracking-part-row__name">{jp.part.name}</div>
                                            <div className="customer-tracking-part-row__meta">{jp.part.sku} · Rs. {jp.priceAtTime?.toFixed(2)} ea</div>
                                        </div>
                                        <div className="customer-tracking-part-row__right">
                                            <span className="customer-tracking-part-row__qty">x{jp.quantity}</span>
                                            <span className="customer-tracking-part-row__price">Rs. {(jp.quantity * (jp.priceAtTime || 0)).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="customer-tracking-parts-total">
                                <span>Total Parts Cost</span>
                                <span>
                                    Rs. {jobParts.reduce((acc, jp) => acc + (jp.quantity * (jp.priceAtTime || 0)), 0).toFixed(2)}
                                </span>
                            </div>
                        </>
                    )}
                </section>
            </div>

            <InvoiceModal
                isOpen={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                invoice={invoice}
            />
        </div>
    );
};

const StepChip = ({ icon, label, done = false, active = false }) => (
    <div className={`customer-tracking-step-chip ${done ? 'is-done' : active ? 'is-active' : ''}`}>
        <div className="customer-tracking-step-chip__icon">{icon}</div>
        <div className="customer-tracking-step-chip__label">{label}</div>
    </div>
);

const LiveUpdateItem = ({ msg, time, name, isNew = false, isLast = false }) => (
    <div className={`customer-tracking-update-item ${!isLast ? 'has-divider' : ''}`}>
        <div className="customer-tracking-update-item__icon">🔧</div>
        <div className="customer-tracking-update-item__copy">
            <div className="customer-tracking-update-item__msg">{msg}</div>
            <div className="customer-tracking-update-item__meta">{time} · {name}</div>
        </div>
        {isNew && <div className="customer-tracking-update-item__dot"></div>}
    </div>
);

export default CustomerTracking;

