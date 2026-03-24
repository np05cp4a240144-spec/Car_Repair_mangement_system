import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import './MechanicJobs.css';

const JOB_STAGES = [
    { name: 'Vehicle Checked In', progress: 10, desc: 'Vehicle received and assigned to you.' },
    { name: 'Diagnostic', progress: 30, desc: 'Initial inspection and diagnostics.' },
    { name: 'Parts Replacement', progress: 60, desc: 'Replacing necessary parts and components.' },
    { name: 'Quality Check', progress: 90, desc: 'Final testing and quality assurance.' },
    { name: 'Ready for Pickup', progress: 100, desc: 'Service complete. Customer notified.' }
];

const MechanicJobs = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [activeJob, setActiveJob] = useState(null);
    const [activeTab, setActiveTab] = useState('steps');
    const [loading, setLoading] = useState(true);

    // Dynamic data for active job
    const [jobParts, setJobParts] = useState([]);
    const [jobUpdates, setJobUpdates] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [partSearch, setPartSearch] = useState('');
    const [noteInput, setNoteInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [laborCost, setLaborCost] = useState(0);
    const [modalPartId, setModalPartId] = useState('');
    const [modalPartQty, setModalPartQty] = useState(1);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/bookings/mechanic');
            setJobs(res.data);
            if (res.data.length > 0 && !activeJob) {
                setActiveJob(res.data[0]);
            } else if (activeJob) {
                const updated = res.data.find(j => j.id === activeJob.id);
                if (updated) setActiveJob(updated);
            }
        } catch (error) {
            console.error('Error fetching mechanic jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobData = async () => {
        if (!activeJob) return;
        try {
            const [partsRes, updatesRes, invRes] = await Promise.all([
                api.get(`/bookings/${activeJob.id}/parts`),
                api.get(`/bookings/${activeJob.id}/updates`),
                api.get('/inventory')
            ]);
            setJobParts(partsRes.data);
            setJobUpdates(updatesRes.data);
            setInventory(invRes.data);
        } catch (error) {
            console.error('Error fetching job data:', error);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        if (activeJob) {
            fetchJobData();
        }
    }, [activeJob]);

    const updateJob = async (id, data) => {
        try {
            await api.put(`/bookings/${id}`, data);
            fetchJobs(); // Refresh
        } catch (error) {
            console.error('Error updating job:', error);
            alert('Failed to update job');
        }
    };

    const handleMarkDone = async () => {
        if (!activeJob) return;
        setShowInvoiceModal(true);
    };

    const finalizeJobWithInvoice = async () => {
        try {
            setIsSubmitting(true);
            // 1. Create Invoice
            await api.post(`/invoices/${activeJob.id}`, { laborCost: parseFloat(laborCost) });

            // 2. Update Job Status
            await updateJob(activeJob.id, { status: 'Completed', stage: 'Ready for Pickup', progress: 100 });

            setShowInvoiceModal(false);
            setLaborCost(0);
            alert('✅ Job finalized and invoice generated!');
        } catch (error) {
            console.error('Error finalizing job:', error);
            alert('Failed to generate invoice');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStartJob = () => {
        if (activeJob) updateJob(activeJob.id, { status: 'In Progress', stage: 'Vehicle Checked In', progress: 10 });
    };

    const handleNextStage = async () => {
        if (!activeJob) return;

        const currentIndex = JOB_STAGES.findIndex(s => s.name === (activeJob.stage || 'Pending'));
        const nextStage = JOB_STAGES[currentIndex + 1] || JOB_STAGES[0];

        // If next stage is the final one, don't auto-complete
        if (nextStage.name === 'Ready for Pickup') {
            alert('🏁 This is the final stage. Please use "Finalize Job" to set labor cost and complete the service.');
            return;
        }

        try {
            setIsSubmitting(true);
            await updateJob(activeJob.id, {
                status: 'In Progress',
                stage: nextStage.name,
                progress: nextStage.progress
            });
            alert(`✅ Next Stage: ${nextStage.name}`);
        } catch (error) {
            console.error('Error updating stage:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddPart = async (partId, quantity = 1) => {
        try {
            setIsSubmitting(true);
            await api.post(`/bookings/${activeJob.id}/parts`, { partId, quantity });
            await fetchJobData();
            setPartSearch('');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to add part');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModalAddPart = async () => {
        const selectedPart = inventory.find((p) => String(p.id) === String(modalPartId));
        if (!selectedPart) {
            alert('Please select a part first.');
            return;
        }

        const qty = Math.max(1, parseInt(modalPartQty) || 1);
        if (qty > (selectedPart.stock || 0)) {
            alert('Requested quantity exceeds available stock.');
            return;
        }

        await handleAddPart(selectedPart.id, qty);
        setModalPartId('');
        setModalPartQty(1);
    };

    const handleRemovePart = async (jobPartId) => {
        try {
            if (!window.confirm('Remove this part from job and restore stock?')) return;
            await api.delete(`/bookings/parts/${jobPartId}`);
            fetchJobData();
        } catch (error) {
            alert('Failed to remove part');
        }
    };

    const handlePostUpdate = async () => {
        if (!noteInput.trim()) return;
        try {
            setIsSubmitting(true);
            await api.post(`/bookings/${activeJob.id}/updates`, { content: noteInput });
            setNoteInput('');
            fetchJobData();
        } catch (error) {
            alert('Failed to post update');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && jobs.length === 0) {
        return (
            <div className="mechanic-jobs__loading-wrap">
                <div className="mechanic-jobs__spinner"></div>
            </div>
        );
    }

    const filteredInventory = inventory.filter(p =>
        p.name.toLowerCase().includes(partSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(partSearch.toLowerCase())
    ).slice(0, 5);

    const getJobListItemClass = (isActive) => `mechanic-jobs__list-item ${isActive ? 'mechanic-jobs__list-item--active' : ''}`;
    const getJobStatusClass = (status) => `mechanic-jobs__job-status ${status === 'In Progress' ? 'mechanic-jobs__job-status--in-progress' : 'mechanic-jobs__job-status--default'}`;
    const getHeaderStatusClass = (status) => `mechanic-jobs__detail-status ${status === 'In Progress' ? 'mechanic-jobs__detail-status--in-progress' : 'mechanic-jobs__detail-status--completed'}`;
    const getProgressClass = (progress) => {
        const clamped = Math.max(0, Math.min(100, Math.round((progress || 0) / 5) * 5));
        return `mechanic-jobs__progress-fill--${clamped}`;
    };

    const partsTotalForInvoice = jobParts.reduce((acc, jp) => acc + (jp.quantity * (jp.priceAtTime || 0)), 0);
    const laborCostForInvoice = parseFloat(laborCost || 0) || 0;
    const estimatedTotalForInvoice = partsTotalForInvoice + laborCostForInvoice;

    return (
        <div className="mechanic-jobs">
            {/* Job List Col - Student style */}
            <div className="mechanic-jobs__list-col">

                <div className="mechanic-jobs__list-header">
                    <span className="mechanic-jobs__list-title">MY LIST</span>
                    <span className="mechanic-jobs__list-count">{jobs.length} items</span>
                </div>

                <div className="mechanic-jobs__list-items">
                    {jobs.length === 0 ? (
                        <div className="mechanic-jobs__empty-list">Nothing assigned. Lucky you!</div>
                    ) : (
                        jobs.map((job) => (
                            <div
                                key={job.id}
                                className={getJobListItemClass(activeJob?.id === job.id)}
                                onClick={() => setActiveJob(job)}
                            >
                                <div className="mechanic-jobs__list-item-head">
                                    <span className="mechanic-jobs__id">ID: {job.id}</span>
                                    <span className={getJobStatusClass(job.status)}>
                                        {job.status}
                                    </span>
                                </div>
                                <div className="mechanic-jobs__vehicle">{job.vehicle?.make} {job.vehicle?.model}</div>
                                <div className="mechanic-jobs__service">{job.service}</div>
                                <div className="mechanic-jobs__meta">
                                    <span>TIME: {job.time}</span>
                                    <span className="mechanic-jobs__dot"></span>
                                    <span>{job.user?.name.split(' ')[0]}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Job Detail Col */}
            <div className="mechanic-jobs__detail-col">
                {!activeJob ? (
                    <div className="mechanic-jobs__empty-detail">
                        <div className="mechanic-jobs__empty-icon">🛠️</div>
                        <div className="mechanic-jobs__empty-text">Select a job to see details</div>
                    </div>
                ) : (
                    <div className="mechanic-jobs__detail-wrap">
                        <div className="mechanic-jobs__hero">
                            <div className="mechanic-jobs__hero-top">
                                <h2 className="mechanic-jobs__hero-title">{activeJob.vehicle?.make} {activeJob.vehicle?.model}</h2>
                                <span className={getHeaderStatusClass(activeJob.status)}>{activeJob.status}</span>
                            </div>
                            <div className="mechanic-jobs__hero-meta">
                                <span className="mechanic-jobs__plate">{activeJob.vehicle?.plate}</span>
                                <span>-</span>
                                <span className="mechanic-jobs__hero-service">{activeJob.service}</span>
                                <span className="mechanic-jobs__server-id">Server ID: {activeJob.id}</span>
                            </div>

                            <div className="mechanic-jobs__actions">
                                <button className="mechanic-jobs__chat-btn" onClick={() => navigate('/mechanic/chat', { state: { customerId: activeJob.userId } })}>
                                    CHAT WITH CUSTOMER
                                </button>
                                {activeJob.status === 'Pending' && (
                                    <button
                                        className="mechanic-jobs__start-btn"
                                        onClick={handleStartJob}
                                    >
                                        START JOB NOW
                                    </button>
                                )}
                                {activeJob.status === 'In Progress' && (
                                    <>
                                        <button
                                            className="mechanic-jobs__next-btn"
                                            onClick={handleNextStage}
                                            disabled={isSubmitting}
                                        >
                                            ⏭ Next Stage
                                        </button>
                                        <button
                                            className="mechanic-jobs__finalize-btn"
                                            onClick={handleMarkDone}
                                        >
                                            ✓ Finalize Job
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="mechanic-jobs__progress-track">
                                <div
                                    className={`mechanic-jobs__progress-fill ${getProgressClass(activeJob.progress)}`}
                                ></div>
                            </div>
                            <div className="mechanic-jobs__progress-meta">
                                <span>Current Stage: <span className="mechanic-jobs__stage-name">{activeJob.stage || 'Not Started'}</span></span>
                                <span>Progress: {activeJob.progress || 0}%</span>
                            </div>
                        </div>

                        {/* Sub-Tabs */}
                        <div className="mechanic-jobs__tabs">
                            <TabBtn label="Service Details" active={activeTab === 'steps'} onClick={() => setActiveTab('steps')} />
                            <TabBtn label="Parts" active={activeTab === 'parts'} onClick={() => setActiveTab('parts')} />
                            <TabBtn label="Updates" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
                            <TabBtn label="Customer" active={activeTab === 'customer'} onClick={() => setActiveTab('customer')} />
                        </div>

                        <div className="mechanic-jobs__tab-content">
                            {activeTab === 'steps' && (
                                <div className="mechanic-jobs__steps">
                                    {JOB_STAGES.map((s, idx) => {
                                        const currentIndex = JOB_STAGES.findIndex(stage => stage.name === (activeJob.stage || 'Pending'));
                                        const isDone = idx < currentIndex || activeJob.status === 'Completed';
                                        const isCurrent = idx === currentIndex && activeJob.status !== 'Completed';

                                        return (
                                            <StepItem
                                                key={s.name}
                                                num={idx + 1}
                                                title={s.name}
                                                desc={s.desc}
                                                done={isDone}
                                                current={isCurrent}
                                                time={isDone ? 'Completed' : isCurrent ? 'Active Now' : 'Upcoming'}
                                            />
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'parts' && (
                                <div className="mechanic-jobs__pane">
                                    <div className="mechanic-jobs__search-wrap">
                                        <div className="mechanic-jobs__search-row">
                                            <div className="mechanic-jobs__search-box">
                                                <input
                                                    type="text"
                                                    placeholder="Search parts by name or SKU..."
                                                    className="mechanic-jobs__input"
                                                    value={partSearch}
                                                    onChange={(e) => setPartSearch(e.target.value)}
                                                />
                                                {partSearch && filteredInventory.length > 0 && (
                                                    <div className="mechanic-jobs__search-results">
                                                        {filteredInventory.map(part => (
                                                            <div
                                                                key={part.id}
                                                                className="mechanic-jobs__search-item"
                                                                onClick={() => handleAddPart(part.id)}
                                                            >
                                                                <div>
                                                                    <div className="mechanic-jobs__search-name">{part.name}</div>
                                                                    <div className="mechanic-jobs__search-meta">{part.sku} · Stock: {part.stock} {part.unit} · Rs. {part.price?.toLocaleString()}</div>
                                                                </div>
                                                                <div className="mechanic-jobs__search-add">+</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mechanic-jobs__parts-list">
                                        {jobParts.length === 0 ? (
                                            <div className="mechanic-jobs__empty-pane">No parts added to this job yet.</div>
                                        ) : (
                                            jobParts.map(jp => (
                                                <div key={jp.id} className="mechanic-jobs__part-row">
                                                    <div className="mechanic-jobs__part-main">
                                                        <div className="mechanic-jobs__part-name">{jp.part.name}</div>
                                                        <div className="mechanic-jobs__part-meta">{jp.part.sku} · Rs. {jp.priceAtTime?.toLocaleString()} ea</div>
                                                    </div>
                                                    <div className="mechanic-jobs__part-actions">
                                                        <span className="mechanic-jobs__part-qty">Qty: {jp.quantity}</span>
                                                        <button
                                                            className="mechanic-jobs__remove-btn"
                                                            onClick={() => handleRemovePart(jp.id)}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="mechanic-jobs__pane">
                                    <div className="mechanic-jobs__notes-form">
                                        <input
                                            type="text"
                                            placeholder="Post an update visible to customer..."
                                            className="mechanic-jobs__input"
                                            value={noteInput}
                                            onChange={(e) => setNoteInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handlePostUpdate()}
                                        />
                                        <button
                                            className="mechanic-jobs__post-btn"
                                            onClick={handlePostUpdate}
                                            disabled={isSubmitting || !noteInput.trim()}
                                        >
                                            Post
                                        </button>
                                    </div>

                                    <div className="mechanic-jobs__updates-list">
                                        {jobUpdates.length === 0 ? (
                                            <div className="mechanic-jobs__empty-pane">No updates posted yet.</div>
                                        ) : (
                                            jobUpdates.map(update => (
                                                <div key={update.id} className="mechanic-jobs__update-row">
                                                    <div className="mechanic-jobs__update-dot"></div>
                                                    <div>
                                                        <p className="mechanic-jobs__update-text">{update.content}</p>
                                                        <div className="mechanic-jobs__update-meta">
                                                            {new Date(update.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Mike Ross
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'customer' && (
                                <div className="mechanic-jobs__pane mechanic-jobs__pane--divided">
                                    <InfoRow label="Customer" val={activeJob.user?.name} />
                                    <InfoRow label="Email" val={activeJob.user?.email} />
                                    <InfoRow label="Phone" val={activeJob.user?.phone || 'N/A'} />
                                    <InfoRow label="Vehicle" val={`${activeJob.vehicle?.year} ${activeJob.vehicle?.make} ${activeJob.vehicle?.model}`} />
                                    <InfoRow label="Plate" val={activeJob.vehicle?.plate} isMono />
                                    <InfoRow
                                        label="Job Value"
                                        val={activeJob.amount > 0 ? `Rs. ${activeJob.amount.toLocaleString()}` : 'TBD (Parts + Labor)'}
                                        color={activeJob.amount > 0 ? '#16A34A' : '#F06A00'}
                                    />
                                    <div className="mechanic-jobs__customer-action">
                                        <button className="mechanic-jobs__customer-btn" onClick={() => navigate('/mechanic/chat', { state: { customerId: activeJob.userId } })}>
                                            💬 Message {activeJob.user?.name}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {showInvoiceModal && (
                <div className="mechanic-jobs__modal-overlay">
                    <div className="mechanic-jobs__modal">
                        <div className="mechanic-jobs__modal-body">
                            <h3 className="mechanic-jobs__modal-title">Finalize Job</h3>
                            <p className="mechanic-jobs__modal-text">Enter the labor cost to generate the final invoice for the customer.</p>

                            <div className="mechanic-jobs__modal-stack">
                                <div>
                                    <label className="mechanic-jobs__modal-label">Labor Cost (Rs.)</label>
                                    <input
                                        type="number"
                                        className="mechanic-jobs__modal-input"
                                        placeholder="0.00"
                                        value={laborCost}
                                        onChange={(e) => setLaborCost(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="mechanic-jobs__modal-part-picker">
                                    <label className="mechanic-jobs__modal-label">Add Parts Used (Multiple)</label>
                                    <div className="mechanic-jobs__modal-part-row">
                                        <select
                                            className="mechanic-jobs__modal-input mechanic-jobs__modal-input--select"
                                            value={modalPartId}
                                            onChange={(e) => setModalPartId(e.target.value)}
                                        >
                                            <option value="">Select part</option>
                                            {inventory
                                                .filter((part) => (part.stock || 0) > 0)
                                                .map((part) => (
                                                    <option key={part.id} value={part.id}>
                                                        {part.name} ({part.sku}) - Stock: {part.stock}
                                                    </option>
                                                ))}
                                        </select>
                                        <input
                                            type="number"
                                            min="1"
                                            className="mechanic-jobs__modal-input mechanic-jobs__modal-input--qty"
                                            value={modalPartQty}
                                            onChange={(e) => setModalPartQty(e.target.value)}
                                        />
                                        <button
                                            className="mechanic-jobs__modal-add-btn"
                                            type="button"
                                            onClick={handleModalAddPart}
                                            disabled={isSubmitting}
                                        >
                                            Add
                                        </button>
                                    </div>

                                    <div className="mechanic-jobs__modal-parts-list">
                                        {jobParts.length === 0 ? (
                                            <div className="mechanic-jobs__modal-empty">No parts selected yet.</div>
                                        ) : (
                                            jobParts.map((jp) => (
                                                <div key={jp.id} className="mechanic-jobs__modal-part-item">
                                                    <div>
                                                        <div className="mechanic-jobs__modal-part-name">{jp.part.name}</div>
                                                        <div className="mechanic-jobs__modal-part-meta">Qty: {jp.quantity} · Rs. {(jp.priceAtTime || 0).toLocaleString()} each</div>
                                                    </div>
                                                    <button
                                                        className="mechanic-jobs__modal-remove-btn"
                                                        type="button"
                                                        onClick={() => handleRemovePart(jp.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="mechanic-jobs__estimate-box">
                                    <div className="mechanic-jobs__estimate-row">
                                        <span className="mechanic-jobs__estimate-label">Parts Total:</span>
                                        <span className="mechanic-jobs__estimate-value">Rs. {partsTotalForInvoice.toLocaleString()}</span>
                                    </div>
                                    <div className="mechanic-jobs__estimate-row">
                                        <span className="mechanic-jobs__estimate-label">Labor Cost:</span>
                                        <span className="mechanic-jobs__estimate-value">Rs. {laborCostForInvoice.toLocaleString()}</span>
                                    </div>
                                    <div className="mechanic-jobs__estimate-row mechanic-jobs__estimate-row--total">
                                        <span className="mechanic-jobs__estimate-total-label">Estimated Total:</span>
                                        <span className="mechanic-jobs__estimate-total">
                                            {estimatedTotalForInvoice.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mechanic-jobs__modal-actions">
                                <button
                                    className="mechanic-jobs__cancel-btn"
                                    onClick={() => setShowInvoiceModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="mechanic-jobs__invoice-btn"
                                    onClick={finalizeJobWithInvoice}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Finalizing...' : 'Finalize & Invoice'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-components
const TabBtn = ({ label, active, onClick }) => (
    <div
        className={`mechanic-jobs__tab-btn ${active ? 'mechanic-jobs__tab-btn--active' : ''}`}
        onClick={onClick}
    >
        {label}
    </div>
);

const StepItem = ({ num, title, desc, time, done = false, current = false }) => (
    <div className="mechanic-jobs__step-row">
        <div className={`mechanic-jobs__step-num ${done ? 'mechanic-jobs__step-num--done' : current ? 'mechanic-jobs__step-num--current' : ''}`}>
            {done ? '✓' : num}
        </div>
        <div>
            <div className="mechanic-jobs__step-title">{title}</div>
            <div className="mechanic-jobs__step-desc">{desc}</div>
            <div className="mechanic-jobs__step-time">{time}</div>
        </div>
    </div>
);

const InfoRow = ({ label, val, isMono = false, color = '#1C1C1A' }) => (
    <div className="mechanic-jobs__info-row">
        <div className="mechanic-jobs__info-label">{label}</div>
        <div className={`mechanic-jobs__info-value ${isMono ? 'mechanic-jobs__info-value--mono' : ''} ${color === '#16A34A' ? 'mechanic-jobs__info-value--green' : color === '#F06A00' ? 'mechanic-jobs__info-value--orange' : ''}`}>{val}</div>
    </div>
);

export default MechanicJobs;


