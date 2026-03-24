import './CustomerRating.css';
import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { Star, MessageSquare, CheckCircle2, Users, Monitor } from 'lucide-react';

const StarPicker = ({ value, onChange }) => (
    <div className="cr-stars">
        {[1, 2, 3, 4, 5].map((n) => (
            <button
                key={n}
                type="button"
                className={`cr-star-btn ${n <= value ? 'cr-star-btn--active' : ''}`}
                onClick={() => onChange(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
            >
                <Star size={28} fill={n <= value ? 'currentColor' : 'none'} />
            </button>
        ))}
    </div>
);

const LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

const RatingCard = ({ type, icon, title, description, form, setForm, onSubmit, loading, submitted }) => {
    const key = type.toLowerCase();
    const score = form[key]?.score || 0;
    const comment = form[key]?.comment || '';

    return (
        <div className={`cr-card ${submitted[key] ? 'cr-card--submitted' : ''}`}>
            <div className="cr-card__header">
                <div className="cr-card__icon">{icon}</div>
                <div>
                    <h3 className="cr-card__title">{title}</h3>
                    <p className="cr-card__desc">{description}</p>
                </div>
            </div>

            {submitted[key] ? (
                <div className="cr-card__success">
                    <CheckCircle2 size={32} className="cr-card__success-icon" />
                    <p>Thank you! Your rating has been submitted.</p>
                </div>
            ) : (
                <form
                    className="cr-card__form"
                    onSubmit={(e) => { e.preventDefault(); onSubmit(type); }}
                >
                    <div className="cr-card__score-row">
                        <StarPicker
                            value={score}
                            onChange={(val) =>
                                setForm((prev) => ({ ...prev, [key]: { ...prev[key], score: val } }))
                            }
                        />
                        {score > 0 && (
                            <span className="cr-card__score-label">{LABELS[score]}</span>
                        )}
                    </div>

                    <textarea
                        className="cr-card__comment"
                        placeholder="Share your experience (optional)..."
                        value={comment}
                        rows={3}
                        maxLength={500}
                        onChange={(e) =>
                            setForm((prev) => ({ ...prev, [key]: { ...prev[key], comment: e.target.value } }))
                        }
                    />

                    <button
                        type="submit"
                        className="cr-card__submit"
                        disabled={score === 0 || loading[key]}
                    >
                        {loading[key] ? 'Submitting…' : 'Submit Rating'}
                    </button>
                </form>
            )}
        </div>
    );
};

const CustomerRating = () => {
    const [form, setForm] = useState({
        mechanic: { score: 0, comment: '' },
        system: { score: 0, comment: '' }
    });
    const [loading, setLoading] = useState({ mechanic: false, system: false });
    const [submitted, setSubmitted] = useState({ mechanic: false, system: false });
    const [pastRatings, setPastRatings] = useState([]);
    const [pastLoading, setPastLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const myRatingsRes = await api.get('/ratings/my');
                setPastRatings(myRatingsRes.data || []);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load ratings. Please refresh.');
            } finally {
                setPastLoading(false);
            }
        };
        fetchData();
    }, [submitted]);

    const handleSubmit = async (type) => {
        const key = type.toLowerCase();
        const { score, comment } = form[key] || {};
        if (score === 0) return;

        setError('');
        setLoading((prev) => ({ ...prev, [key]: true }));
        try {
            await api.post('/ratings', { ratingType: type, score, comment });
            setSubmitted((prev) => ({ ...prev, [key]: true }));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit rating. Please try again.');
        } finally {
            setLoading((prev) => ({ ...prev, [key]: false }));
        }
    };

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const renderStars = (score) =>
        [1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={14} fill={n <= score ? 'currentColor' : 'none'} className={n <= score ? 'cr-star--filled' : 'cr-star--empty'} />
        ));

    return (
        <div className="cr-page">
            <div className="cr-page__header">
                <h1 className="cr-page__title">Rate Your Experience</h1>
                <p className="cr-page__subtitle">
                    Your feedback helps us improve. Rate both mechanic service quality and the overall system.
                </p>
            </div>

            {error && <div className="cr-error">{error}</div>}

            <div className="cr-cards-grid">
                <RatingCard
                    type="MECHANIC"
                    icon={<Users size={22} />}
                    title="Mechanic Service"
                    description="Rate the mechanic’s workmanship, communication, and professionalism."
                    form={form}
                    setForm={setForm}
                    onSubmit={handleSubmit}
                    loading={loading}
                    submitted={submitted}
                />
                <RatingCard
                    type="SYSTEM"
                    icon={<Monitor size={22} />}
                    title="Overall System / Platform"
                    description="Rate booking flow, app usability, tracking, and overall platform experience."
                    form={form}
                    setForm={setForm}
                    onSubmit={handleSubmit}
                    loading={loading}
                    submitted={submitted}
                />
            </div>

            <div className="cr-history">
                <div className="cr-history__header">
                    <MessageSquare size={18} />
                    <h2 className="cr-history__title">My Past Ratings</h2>
                </div>

                {pastLoading ? (
                    <div className="cr-history__loading">Loading…</div>
                ) : pastRatings.length === 0 ? (
                    <div className="cr-history__empty">You haven't submitted any ratings yet.</div>
                ) : (
                    <div className="cr-history__list">
                        {pastRatings.map((r) => (
                            <div key={r.id} className="cr-history__item">
                                <div className="cr-history__item-left">
                                    <span className={`cr-history__badge cr-history__badge--${(r.ratingType || 'SYSTEM').toLowerCase()}`}>
                                        {(r.ratingType || 'SYSTEM') === 'MECHANIC' ? 'Mechanic' : 'System'}
                                    </span>
                                    <div className="cr-history__stars">{renderStars(r.score)}</div>
                                    <span className="cr-history__score-text">{LABELS[r.score]}</span>
                                </div>
                                <div className="cr-history__item-right">
                                    {r.comment && <p className="cr-history__comment">"{r.comment}"</p>}
                                    <span className="cr-history__date">{formatDate(r.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerRating;
