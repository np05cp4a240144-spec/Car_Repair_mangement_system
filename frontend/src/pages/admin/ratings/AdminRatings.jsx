import './AdminRatings.css';
import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { Star, Users, Monitor, BarChart3 } from 'lucide-react';

const LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

const StarDisplay = ({ score }) => (
    <div className="ar-stars">
        {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={13} fill={n <= score ? 'currentColor' : 'none'} className={n <= score ? 'ar-star--filled' : 'ar-star--empty'} />
        ))}
    </div>
);

const SummaryCard = ({ icon, label, average, count, color }) => (
    <div className={`ar-summary-card ar-summary-card--${color}`}>
        <div className="ar-summary-card__icon">{icon}</div>
        <div className="ar-summary-card__body">
            <div className="ar-summary-card__label">{label}</div>
            <div className="ar-summary-card__avg">
                {average > 0 ? (
                    <>
                        <span className="ar-summary-card__num">{average}</span>
                        <span className="ar-summary-card__of"> / 5</span>
                    </>
                ) : (
                    <span className="ar-summary-card__none">No ratings yet</span>
                )}
            </div>
            <div className="ar-summary-card__count">{count} rating{count !== 1 ? 's' : ''}</div>
        </div>
        {average > 0 && (
            <div className="ar-summary-card__bar-wrap">
                <div className="ar-summary-card__bar" style={{ width: `${(average / 5) * 100}%` }} />
            </div>
        )}
    </div>
);

const AdminRatings = () => {
    const [summary, setSummary] = useState({ mechanic: { average: 0, count: 0 }, system: { average: 0, count: 0 }, total: 0 });
    const [ratings, setRatings] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [summaryRes, ratingsRes] = await Promise.all([
                    api.get('/ratings/summary'),
                    api.get('/ratings')
                ]);
                setSummary(summaryRes.data);
                setRatings(ratingsRes.data || []);
            } catch (error) {
                console.error('Error loading ratings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filtered = filter === 'ALL' ? ratings : ratings.filter((r) => r.ratingType === filter);

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className="ar-loading">
                <div className="ar-loading__spinner" />
                <span>Loading ratings…</span>
            </div>
        );
    }

    return (
        <div className="ar-page">
            {/* Summary */}
            <div className="ar-summary-grid">
                <SummaryCard
                    icon={<Users size={20} />}
                    label="Mechanic Rating"
                    average={summary.mechanic?.average || 0}
                    count={summary.mechanic?.count || 0}
                    color="blue"
                />
                <SummaryCard
                    icon={<Monitor size={20} />}
                    label="System Rating"
                    average={summary.system?.average || 0}
                    count={summary.system?.count || 0}
                    color="purple"
                />
                <SummaryCard
                    icon={<BarChart3 size={20} />}
                    label="Overall Average"
                    average={
                        summary.total > 0
                            ? parseFloat(
                                (
                                    (summary.mechanic.average * summary.mechanic.count +
                                        summary.system.average * summary.system.count) /
                                    summary.total
                                ).toFixed(1)
                            )
                            : 0
                    }
                    count={summary.total}
                    color="green"
                />
            </div>

            {/* Filter */}
            <div className="ar-filter-row">
                {['ALL', 'MECHANIC', 'SYSTEM'].map((f) => (
                    <button
                        key={f}
                        className={`ar-filter-btn ${filter === f ? 'ar-filter-btn--active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'ALL' ? 'All Ratings' : f === 'MECHANIC' ? 'Mechanic' : 'System'}
                    </button>
                ))}
                <span className="ar-filter-count">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="ar-empty">No ratings found for this category.</div>
            ) : (
                <div className="ar-table-wrap">
                    <table className="ar-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Type</th>
                                <th>Score</th>
                                <th>Comment</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r) => (
                                <tr key={r.id}>
                                    <td>
                                        <div className="ar-customer-cell">
                                            <div className="ar-avatar">{getInitials(r.customer?.name)}</div>
                                            <div>
                                                <div className="ar-customer-name">{r.customer?.name || '—'}</div>
                                                <div className="ar-customer-email">{r.customer?.email || ''}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`ar-badge ar-badge--${(r.ratingType || 'SYSTEM').toLowerCase()}`}>
                                            {(r.ratingType || 'SYSTEM') === 'MECHANIC' ? 'Mechanic' : 'System'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="ar-score-cell">
                                            <StarDisplay score={r.score} />
                                            <span className="ar-score-label">{LABELS[r.score]}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="ar-comment-cell">
                                            {r.comment || <span className="ar-no-comment">—</span>}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="ar-date">{formatDate(r.createdAt)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminRatings;
