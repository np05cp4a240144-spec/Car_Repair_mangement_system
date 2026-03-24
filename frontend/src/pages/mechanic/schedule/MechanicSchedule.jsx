import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import './MechanicSchedule.css';

const MechanicSchedule = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(new Date().toDateString());

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get('/bookings/mechanic');
                setJobs(res.data);
            } catch (error) {
                console.error('Error fetching mechanic jobs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const days = [...new Set(jobs.map(j => new Date(j.createdAt).toDateString()))];
    if (days.length === 0) days.push(new Date().toDateString());

    const filteredJobs = jobs.filter(j => new Date(j.createdAt).toDateString() === selectedDay);

    const stats = [
        { label: 'Active', val: jobs.filter(j => j.status === 'In Progress').length.toString(), hi: true },
        { label: 'Completed', val: jobs.filter(j => j.status === 'Completed').length.toString() },
        { label: 'Pending', val: jobs.filter(j => j.status === 'Pending').length.toString() },
        { label: "Today's Revenue", val: `NRP ${filteredJobs.reduce((sum, j) => sum + (j.amount || 0), 0)}` },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'green';
            case 'In Progress': return 'orange';
            case 'Pending': return 'blue';
            case 'Cancelled': return 'gray';
            default: return 'yellow';
        }
    };

    const getStatusClass = (color) => {
        switch (color) {
            case 'green':
                return 'mechanic-schedule__status mechanic-schedule__status--green';
            case 'orange':
                return 'mechanic-schedule__status mechanic-schedule__status--orange';
            case 'blue':
                return 'mechanic-schedule__status mechanic-schedule__status--blue';
            case 'yellow':
                return 'mechanic-schedule__status mechanic-schedule__status--yellow';
            default:
                return 'mechanic-schedule__status mechanic-schedule__status--gray';
        }
    };

    const getAccentStyle = (color) => ({
        backgroundColor:
            color === 'green' ? '#16A34A' :
                color === 'orange' ? '#E85D04' :
                    color === 'blue' ? '#2563EB' :
                        color === 'yellow' ? '#D97706' : '#E2E2DE'
    });

    if (loading) {
        return (
            <div className="mechanic-schedule__loading-wrap">
                <div className="mechanic-schedule__spinner"></div>
            </div>
        );
    }

    return (
        <div className="mechanic-schedule">
            <div className="mechanic-schedule__container">

                {/* Day Selector */}
                <div className="mechanic-schedule__days">
                    {days.map(day => (
                        <button
                            key={day}
                            className={`mechanic-schedule__day-btn ${selectedDay === day ? 'mechanic-schedule__day-btn--active' : ''}`}
                            onClick={() => setSelectedDay(day)}
                        >
                            {day === new Date().toDateString() ? 'Today' : day.split(' ').slice(0, 3).join(' ')}
                        </button>
                    ))}
                </div>

                {/* Stats Grid */}
                <div className="mechanic-schedule__stats-grid">
                    {stats.map(s => (
                        <div key={s.label} className="mechanic-schedule__stat-card">
                            <div className={`mechanic-schedule__stat-value ${s.hi ? 'mechanic-schedule__stat-value--hi' : ''}`}>
                                {s.val}
                            </div>
                            <div className="mechanic-schedule__stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Schedule List */}
                <div className="mechanic-schedule__list-wrap">
                    <div className="mechanic-schedule__list">
                        {filteredJobs.length === 0 ? (
                            <div className="mechanic-schedule__empty">No jobs scheduled for this day.</div>
                        ) : (
                            filteredJobs.map((appt) => {
                                const color = getStatusColor(appt.status);
                                return (
                                    <div
                                        key={appt.id}
                                        className="mechanic-schedule__item"
                                        onClick={() => navigate('/mechanic')}
                                    >
                                        <div className="mechanic-schedule__time">
                                            {appt.time}
                                        </div>
                                        <div className="mechanic-schedule__accent" style={getAccentStyle(color)}></div>
                                        <div className="mechanic-schedule__meta">
                                            <div className="mechanic-schedule__vehicle">{appt.vehicle?.make} {appt.vehicle?.model}</div>
                                            <div className="mechanic-schedule__service">{appt.service}</div>
                                            <div className="mechanic-schedule__customer">Customer: {appt.user?.name} · {appt.status}</div>
                                        </div>
                                        <span className={getStatusClass(color)}>
                                            {appt.status}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MechanicSchedule;


