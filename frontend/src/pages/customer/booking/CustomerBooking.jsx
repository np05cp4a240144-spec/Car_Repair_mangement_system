import './CustomerBooking.css';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api/axios';

const CustomerBooking = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [vehicles, setVehicles] = useState([]);

    const [selectedServices, setSelectedServices] = useState(['Oil & Filter Change']);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().getDate() + 1);
    const [selectedTime, setSelectedTime] = useState('9:00 AM');
    const hasInitializedReschedule = useRef(false);

    const rescheduleBooking = location.state?.rescheduleBooking || null;
    const isRescheduleMode = useMemo(() => Boolean(rescheduleBooking?.id), [rescheduleBooking]);

    const today = new Date();
    const currentMonth = today.toLocaleString('default', { month: 'long' });
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await api.get('/customer/profile');
                const userVehicles = response.data.vehicles || [];
                setVehicles(userVehicles);

                if (userVehicles.length > 0) {
                    if (isRescheduleMode && rescheduleBooking?.vehicleId) {
                        const matchingVehicle = userVehicles.find((v) => v.id === rescheduleBooking.vehicleId);
                        setSelectedVehicle(matchingVehicle || userVehicles[0]);
                    } else {
                        setSelectedVehicle(userVehicles[0]);
                    }
                }
            } catch (error) {
                console.error('Error fetching vehicles:', error);
            }
        };
        fetchVehicles();
    }, [isRescheduleMode, rescheduleBooking]);

    useEffect(() => {
        if (!isRescheduleMode || hasInitializedReschedule.current) return;

        const parsedServices = String(rescheduleBooking.service || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        if (parsedServices.length > 0) {
            setSelectedServices(parsedServices);
        }

        const [datePartRaw, timePartRaw] = String(rescheduleBooking.time || '').split('·').map((part) => part.trim());
        const parsedDate = datePartRaw ? new Date(datePartRaw) : null;
        if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
            setSelectedDate(parsedDate.getDate());
        }

        if (timePartRaw) {
            setSelectedTime(timePartRaw);
        }

        setStep(3);
        hasInitializedReschedule.current = true;
    }, [isRescheduleMode, rescheduleBooking]);

    const services = [
        { name: 'Full Service', icon: '🔧', desc: 'All major systems checked. Ideal for every 10,000 km' },
        { name: 'Brake Service', icon: '🛞', desc: 'Pads, rotors, calipers - full brake system' },
        { name: 'Oil & Filter Change', icon: '🛢️', desc: 'Synthetic or conventional. Quick and essential' },
        { name: 'Electrical & Diagnostics', icon: '⚡', desc: 'Battery, ECU scan, wiring faults' },
        { name: 'AC Service', icon: '❄️', desc: 'Refrigerant recharge, filter, compressor check' },
        { name: 'Custom Repair / Maintenance', icon: '📋', desc: 'General diagnostics or specific issue not listed' },
    ];

    const toggleSvc = (name) => {
        if (selectedServices.includes(name)) {
            if (selectedServices.length === 1) return;
            setSelectedServices(selectedServices.filter((s) => s !== name));
        } else {
            setSelectedServices([...selectedServices, name]);
        }
    };

    const calculateTotal = () => '0.00';

    const confirmBk = async () => {
        if (!selectedVehicle) {
            alert('Please select a vehicle first.');
            setStep(2);
            return;
        }

        try {
            setLoading(true);
            const bookingData = {
                service: selectedServices.join(', '),
                time: `${currentMonth} ${selectedDate < 10 ? `0${selectedDate}` : selectedDate}, ${currentYear} · ${selectedTime}`,
                vehicleId: selectedVehicle.id,
                amount: parseFloat(calculateTotal())
            };

            if (isRescheduleMode) {
                await api.put(`/bookings/${rescheduleBooking.id}`, bookingData);
                alert('Booking rescheduled successfully.');
                navigate('/customer/history');
            } else {
                await api.post('/bookings', bookingData);
                alert("Booking confirmed! We've assigned a specialist for your service.");
                navigate('/customer/tracking');
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert(error.response?.data?.error || `Failed to ${isRescheduleMode ? 'reschedule' : 'confirm'} booking. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 2 && !selectedVehicle && vehicles.length > 0) {
            alert('Please select a vehicle to continue.');
            return;
        }
        setStep(step + 1);
    };

    return (
        <div className="customer-booking-page">
            <div className="customer-booking-shell">
                <div className="customer-booking-step-track">
                    <BookStep num="1" label="Service" active={step === 1} done={step > 1} />
                    <div className={`customer-booking-step-connector ${step > 1 ? 'is-done' : ''}`}></div>
                    <BookStep num="2" label="Vehicle" active={step === 2} done={step > 2} />
                    <div className={`customer-booking-step-connector ${step > 2 ? 'is-done' : ''}`}></div>
                    <BookStep num="3" label="Time" active={step === 3} done={step > 3} />
                    <div className={`customer-booking-step-connector ${step > 3 ? 'is-done' : ''}`}></div>
                    <BookStep num="4" label="Review" active={step === 4} done={false} />
                </div>

                {step === 1 && (
                    <div className="customer-booking-step-panel">
                        <div className="customer-booking-section-title">What does your car need?</div>
                        <div className="customer-booking-service-list">
                            {services.map((s) => (
                                <div
                                    key={s.name}
                                    className={`customer-booking-service-card ${selectedServices.includes(s.name) ? 'is-selected' : ''}`}
                                    onClick={() => toggleSvc(s.name)}
                                >
                                    <div className="customer-booking-service-icon">{s.icon}</div>
                                    <div className="customer-booking-service-copy">
                                        <div className="customer-booking-service-name">{s.name}</div>
                                        <div className="customer-booking-service-desc">{s.desc}</div>
                                    </div>
                                    {selectedServices.includes(s.name) && <div className="customer-booking-service-check">✓</div>}
                                </div>
                            ))}
                        </div>
                        <button className="customer-booking-primary-button" onClick={nextStep}>Select Vehicle →</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="customer-booking-step-panel">
                        <div className="customer-booking-section-title">Select your vehicle</div>
                        {vehicles.length === 0 ? (
                            <div className="customer-booking-empty-vehicle-state">
                                <div className="customer-booking-empty-vehicle-icon">🚗</div>
                                <h3 className="customer-booking-empty-vehicle-title">No vehicles in your garage</h3>
                                <p className="customer-booking-empty-vehicle-text">You need to add a vehicle before booking a service.</p>
                                <button onClick={() => navigate('/customer/profile')} className="customer-booking-dark-button">Add Vehicle Now</button>
                            </div>
                        ) : (
                            <div className="customer-booking-vehicle-list">
                                {vehicles.map((v) => (
                                    <div
                                        key={v.id}
                                        onClick={() => setSelectedVehicle(v)}
                                        className={`customer-booking-vehicle-card ${selectedVehicle?.id === v.id ? 'is-selected' : ''}`}
                                    >
                                        <div className="customer-booking-vehicle-icon">🚗</div>
                                        <div className="customer-booking-vehicle-copy">
                                            <div className="customer-booking-vehicle-name">{v.year} {v.make} {v.model}</div>
                                            <div className="customer-booking-vehicle-meta">{v.plate} <span className="customer-booking-vehicle-dot">·</span> {v.color}</div>
                                        </div>
                                        {selectedVehicle?.id === v.id && <div className="customer-booking-vehicle-check">✓</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="customer-booking-action-row">
                            <button onClick={() => setStep(1)} className="customer-booking-secondary-button">← Back</button>
                            <button disabled={!selectedVehicle} className="customer-booking-primary-button customer-booking-flex-button" onClick={nextStep}>Choose Date & Time →</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="customer-booking-step-panel">
                        <div className="customer-booking-section-title">Pick a date</div>
                        <div className="customer-booking-calendar-card">
                            <div className="customer-booking-calendar-head">
                                <div className="customer-booking-calendar-month">{currentMonth} {currentYear}</div>
                            </div>
                            <div className="customer-booking-calendar-days-row">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                                    <div key={d} className="customer-booking-calendar-day-label">{d}</div>
                                ))}
                            </div>
                            <div className="customer-booking-calendar-grid">
                                {[...Array(daysInMonth)].map((_, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedDate(i + 1)}
                                        className={`customer-booking-calendar-date ${selectedDate === i + 1 ? 'is-selected' : ''}`}
                                    >
                                        {i + 1}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="customer-booking-section-title">Pick a time - <span className="customer-booking-time-caption-date">{currentMonth} {selectedDate < 10 ? `0${selectedDate}` : selectedDate}</span></div>
                        <div className="customer-booking-time-grid">
                            {['8:00 AM', '9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM'].map((t) => (
                                <div
                                    key={t}
                                    className={`customer-booking-time-slot ${selectedTime === t ? 'is-selected' : ''}`}
                                    onClick={() => setSelectedTime(t)}
                                >
                                    {t}
                                </div>
                            ))}
                        </div>

                        <div className="customer-booking-action-row">
                            <button onClick={() => setStep(2)} className="customer-booking-secondary-button">← Back</button>
                            <button className="customer-booking-primary-button customer-booking-flex-button" onClick={nextStep}>Review Booking →</button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="customer-booking-step-panel">
                        <div className="customer-booking-section-title">{isRescheduleMode ? 'Review your reschedule' : 'Review your booking'}</div>
                        <div className="customer-booking-review-card">
                            <div className="customer-booking-review-strip"></div>
                            <div className="customer-booking-review-list">
                                <ConfirmRow label="Vehicle" val={`${selectedVehicle?.year} ${selectedVehicle?.make} ${selectedVehicle?.model} (${selectedVehicle?.plate})`} />
                                <ConfirmRow label="Service" val={selectedServices.join(', ')} />
                                <ConfirmRow label="Date & Time" val={`${currentMonth} ${selectedDate < 10 ? `0${selectedDate}` : selectedDate}, ${currentYear} · ${selectedTime}`} />
                                <ConfirmRow label="Mechanic" val="Pro-assigned specialist (Automated)" />
                                <div className="customer-booking-review-total-row">
                                    <span className="customer-booking-review-total-label">Estimated total</span>
                                    <span className="customer-booking-review-total-value">Professional Quote</span>
                                </div>
                            </div>
                        </div>
                        <div className="customer-booking-note-box">
                            <span className="customer-booking-note-icon">💡</span>
                            <p className="customer-booking-note-text">
                                Pricing is determined after diagnostics. Your technician will add parts and labor costs as the repair progresses, which you can track in real-time.
                            </p>
                        </div>
                        <div className="customer-booking-action-row">
                            <button onClick={() => setStep(3)} className="customer-booking-secondary-button">← Edit</button>
                            <button disabled={loading} className="customer-booking-confirm-button" onClick={confirmBk}>
                                {loading ? (isRescheduleMode ? 'Saving...' : 'Confirming...') : (isRescheduleMode ? '✅ Save New Time' : '✅ Confirm Booking')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const BookStep = ({ num, label, active, done }) => (
    <div className="customer-booking-step-item">
        <div className={`customer-booking-step-dot ${active ? 'is-active' : done ? 'is-done' : ''}`}>
            {done ? '✓' : num}
        </div>
        <div className={`customer-booking-step-label ${active || done ? 'is-highlighted' : ''}`}>
            {label}
        </div>
    </div>
);

const ConfirmRow = ({ label, val }) => (
    <div className="customer-booking-confirm-row">
        <span className="customer-booking-confirm-label">{label}</span>
        <span className="customer-booking-confirm-value">{val}</span>
    </div>
);

export default CustomerBooking;





