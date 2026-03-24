import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import './MechanicProfile.css';

const MechanicProfile = () => {
    const [activeTab, setActiveTab] = useState('personal');
    const [profile, setProfile] = useState({
        id: '',
        name: '',
        email: '',
        phone: '',
        speciality: '',
        shiftStart: '08:00',
        shiftEnd: '17:00',
        workDays: 'Monday – Friday',
        notificationPrefs: {
            newJobAssigned: true,
            customerMessages: true,
            partsAlerts: true,
            dailySummary: false
        }
    });
    const [scheduleSaving, setScheduleSaving] = useState(false);
    const [notifSaving, setNotifSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Backend route is /api/mechanics/profile
                const res = await api.get('/mechanics/profile');
                setProfile(res.data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleScheduleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleNotifChange = (key, value) => {
        setProfile({
            ...profile,
            notificationPrefs: {
                ...profile.notificationPrefs,
                [key]: value
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ text: '', type: '' });
        try {
            const res = await api.put('/mechanics/profile', profile);
            if (res.data && res.data.mechanic) {
                setProfile(res.data.mechanic);
            } else if (res.data && res.data.id) {
                setProfile(res.data);
            }
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ text: 'Failed to update profile.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleScheduleSave = async () => {
        setScheduleSaving(true);
        setMessage({ text: '', type: '' });
        try {
            const res = await api.put('/mechanics/profile', {
                ...profile,
                // Only send schedule fields
                shiftStart: profile.shiftStart,
                shiftEnd: profile.shiftEnd,
                workDays: profile.workDays
            });
            if (res.data && res.data.mechanic) {
                setProfile(prev => ({ ...prev, ...res.data.mechanic }));
            }
            setMessage({ text: 'Schedule updated!', type: 'success' });
        } catch (error) {
            setMessage({ text: 'Failed to update schedule.', type: 'error' });
        } finally {
            setScheduleSaving(false);
        }
    };

    const handleNotifSave = async () => {
        setNotifSaving(true);
        setMessage({ text: '', type: '' });
        try {
            const res = await api.put('/mechanics/profile', {
                ...profile,
                notificationPrefs: profile.notificationPrefs
            });
            if (res.data && res.data.mechanic) {
                setProfile(prev => ({ ...prev, ...res.data.mechanic }));
            }
            setMessage({ text: 'Preferences updated!', type: 'success' });
        } catch (error) {
            setMessage({ text: 'Failed to update preferences.', type: 'error' });
        } finally {
            setNotifSaving(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0].substring(0, 2).toUpperCase();
    };

    const tabProgressClass = activeTab === 'personal'
        ? 'mechanic-profile__tab-progress-fill--personal'
        : activeTab === 'schedule'
            ? 'mechanic-profile__tab-progress-fill--schedule'
            : 'mechanic-profile__tab-progress-fill--notifs';

    if (loading) {
        return (
            <div className="mechanic-profile__loading-wrap">
                <div className="mechanic-profile__spinner"></div>
            </div>
        );
    }

    return (
        <div className="mechanic-profile">
            <div className="mechanic-profile__container">

                {/* Profile Hero */}
                <div className="mechanic-profile__hero">
                    <div className="mechanic-profile__hero-bg"></div>

                    <div className="mechanic-profile__hero-content">
                        <div className="mechanic-profile__avatar">
                            {getInitials(profile.name)}
                        </div>
                        <div className="mechanic-profile__hero-text">
                            <h1 className="mechanic-profile__name">{profile.name}</h1>
                            <div className="mechanic-profile__speciality">{profile.speciality || 'Specialist'}</div>
                        </div>
                        <div className="mechanic-profile__hero-stats">
                            <ProfileStat val="Active" label="Status" />
                            <ProfileStat val="4.8★" label="Rating" />
                            <ProfileStat val="New" label="Record" />
                        </div>
                    </div>
                </div>

                {/* Local Tabs */}
                <div className="mechanic-profile__tabs-wrap">
                    <TabButton label="Personal" active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} />
                    <TabButton label="Schedule" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
                    <TabButton label="Notifications" active={activeTab === 'notifs'} onClick={() => setActiveTab('notifs')} />
                </div>

                {/* Content Card */}
                <div className="mechanic-profile__content-card">
                    <div className="mechanic-profile__tab-progress-track">
                        <div className={`mechanic-profile__tab-progress-fill ${tabProgressClass}`}></div>
                    </div>

                    {message.text && (
                        <div className={`mechanic-profile__alert ${message.type === 'success' ? 'mechanic-profile__alert--success' : 'mechanic-profile__alert--error'}`}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'personal' && (
                        <div className="mechanic-profile__tab-pane">
                            <InputGroup label="Full Name" val={profile.name} name="name" onChange={handleChange} className="mb-6" />
                            <InputGroup label="Email" val={profile.email} name="email" onChange={handleChange} className="mb-6" />
                            <div className="mechanic-profile__two-col">
                                <InputGroup label="Phone" val={profile.phone} name="phone" onChange={handleChange} />
                                <InputGroup label="Employee ID" val={`EMP-${profile.id}`} isMono readOnly />
                            </div>
                            <div className="mechanic-profile__field-block">
                                <label className="mechanic-profile__label">Speciality</label>
                                <select
                                    name="speciality"
                                    value={profile.speciality || ''}
                                    onChange={handleChange}
                                    className="mechanic-profile__select"
                                >
                                    <option value="">Select Speciality</option>
                                    <option>Brakes & Suspension</option>
                                    <option>Engine Specialist</option>
                                    <option>General Mechanic</option>
                                    <option>Electrical / ECU</option>
                                    <option>Transmission</option>
                                </select>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="mechanic-profile__primary-btn"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="mechanic-profile__tab-pane">
                            <div className="mechanic-profile__two-col mechanic-profile__two-col--schedule">
                                <InputGroup label="Shift Start" type="time" name="shiftStart" val={profile.shiftStart || ''} onChange={handleScheduleChange} />
                                <InputGroup label="Shift End" type="time" name="shiftEnd" val={profile.shiftEnd || ''} onChange={handleScheduleChange} />
                            </div>
                            <div className="mechanic-profile__field-block">
                                <label className="mechanic-profile__label">Work Days</label>
                                <select name="workDays" value={profile.workDays || ''} onChange={handleScheduleChange} className="mechanic-profile__select">
                                    <option value="Monday – Friday">Monday – Friday</option>
                                    <option value="Monday – Saturday">Monday – Saturday</option>
                                    <option value="Custom Shift">Custom Shift</option>
                                </select>
                            </div>
                            <button className="mechanic-profile__primary-btn" onClick={handleScheduleSave} disabled={scheduleSaving}>
                                {scheduleSaving ? 'Saving...' : 'Update Schedule'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'notifs' && (
                        <div className="mechanic-profile__tab-pane mechanic-profile__tab-pane--divided">
                            <ToggleRow title="New Job Assigned" desc="Alert when added to your queue" on={profile.notificationPrefs?.newJobAssigned} onChange={v => handleNotifChange('newJobAssigned', v)} />
                            <ToggleRow title="Customer Messages" desc="Push when customer replies" on={profile.notificationPrefs?.customerMessages} onChange={v => handleNotifChange('customerMessages', v)} />
                            <ToggleRow title="Parts Alerts" desc="When requested parts arrive" on={profile.notificationPrefs?.partsAlerts} onChange={v => handleNotifChange('partsAlerts', v)} />
                            <ToggleRow title="Daily Summary" desc="End of day job report" on={profile.notificationPrefs?.dailySummary} onChange={v => handleNotifChange('dailySummary', v)} />
                            <div className="mechanic-profile__footer-action">
                                <button className="mechanic-profile__primary-btn" onClick={handleNotifSave} disabled={notifSaving}>
                                    {notifSaving ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Sub-components
const ProfileStat = ({ val, label }) => (
    <div className="mechanic-profile__stat">
        <div className="mechanic-profile__stat-val">{val}</div>
        <div className="mechanic-profile__stat-label">{label}</div>
    </div>
);

const TabButton = ({ label, active, onClick }) => (
    <button
        className={`mechanic-profile__tab-btn ${active ? 'mechanic-profile__tab-btn--active' : ''}`}
        onClick={onClick}
    >
        {label}
    </button>
);

const InputGroup = ({ label, name, val, onChange, type = "text", isMono = false, readOnly = false, className = "" }) => (
    <div className={`mechanic-profile__input-group ${className}`}>
        <label className="mechanic-profile__label">{label}</label>
        <input
            type={type}
            name={name}
            value={val}
            onChange={onChange}
            readOnly={readOnly}
            className={`mechanic-profile__input ${isMono ? 'mechanic-profile__input--mono' : ''} ${readOnly ? 'mechanic-profile__input--readonly' : ''}`}
        />
    </div>
);

const ToggleRow = ({ title, desc, on = false, onChange }) => {
    return (
        <div className="mechanic-profile__toggle-row">
            <div>
                <h5 className="mechanic-profile__toggle-title">{title}</h5>
                <p className="mechanic-profile__toggle-desc">{desc}</p>
            </div>
            <div
                className={`mechanic-profile__switch ${on ? 'mechanic-profile__switch--on' : ''}`}
                onClick={() => onChange && onChange(!on)}
            >
                <div className={`mechanic-profile__switch-knob ${on ? 'mechanic-profile__switch-knob--on' : ''}`}></div>
            </div>
        </div>
    );
};

export default MechanicProfile;


