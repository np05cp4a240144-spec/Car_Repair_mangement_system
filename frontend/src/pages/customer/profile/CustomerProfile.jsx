import './CustomerProfile.css';
import { useState, useEffect } from 'react';
import api from '../../../api/axios';

const CustomerProfile = () => {
    const [activeTab, setActiveTab] = useState('personal');
    const [profile, setProfile] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [stats, setStats] = useState({ services: 0, spent: 0, rating: "0.0" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // New vehicle form state
    const [newVehicle, setNewVehicle] = useState({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        plate: '',
        color: '',
        mileage: ''
    });

    // Form state for personal info
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/customer/profile');
            const { user, vehicles, stats } = response.data;

            setProfile(user);
            setVehicles(vehicles);
            setStats(stats);

            // Split name into first and last
            const nameParts = (user.name || '').split(' ');
            setFormData({
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                phone: user.phone || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            await api.put('/customer/profile', {
                name: fullName,
                phone: formData.phone
            });
            await fetchProfile(); // Refresh data
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveVehicle = async (id) => {
        if (!window.confirm('Are you sure you want to remove this vehicle?')) return;

        try {
            await api.delete(`/vehicles/${id}`);
            setVehicles(vehicles.filter(v => v.id !== id));
        } catch (error) {
            console.error('Error removing vehicle:', error);
            alert('Failed to remove vehicle.');
        }
    };

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const response = await api.post('/vehicles', newVehicle);
            setVehicles([...vehicles, response.data]);
            setShowAddModal(false);
            setNewVehicle({
                make: '',
                model: '',
                year: new Date().getFullYear(),
                plate: '',
                color: '',
                mileage: ''
            });
            alert('Vehicle added successfully!');
        } catch (error) {
            console.error('Error adding vehicle:', error);
            alert(error.response?.data?.error || 'Failed to add vehicle.');
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0].substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="customer-profile-loading">
                <div className="customer-profile-spinner"></div>
            </div>
        );
    }

    return (
        <div className="customer-profile-page">
            <div className="customer-profile-shell">
                <div className="customer-profile-hero">
                    <div className="customer-profile-hero-overlay"></div>

                    <div className="customer-profile-hero-head">
                        <div className="customer-profile-avatar">
                            {getInitials(profile?.name)}
                        </div>
                        <div className="customer-profile-identity">
                            <h1 className="customer-profile-name">{profile?.name || 'Customer'}</h1>
                            <div className="customer-profile-email">{profile?.email}</div>
                            <div className="customer-profile-tag-row">
                                <span className="customer-profile-tag">
                                    ⭐ Member since {new Date(profile?.createdAt).getFullYear()}
                                </span>
                                <span className="customer-profile-tag">
                                    🚗 {vehicles.length} vehicles
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="customer-profile-stats-row">
                        <PHStat val={stats.services} label="Services" />
                        <div className="customer-profile-stats-divider"></div>
                        <PHStat val={`$${stats.spent}`} label="Spent" />
                        <div className="customer-profile-stats-divider"></div>
                        <PHStat val={`${stats.rating}★`} label="Rating" />
                    </div>
                </div>

                <div className="customer-profile-tabbar">
                    <ProfileTab label="👤 Personal" active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} />
                    <ProfileTab label="🚗 Vehicles" active={activeTab === 'vehicles'} onClick={() => setActiveTab('vehicles')} />
                </div>

                <div className="customer-profile-panel">
                    <div className="customer-profile-panel-rail">
                        <div className={`customer-profile-panel-rail-fill ${activeTab === 'personal' ? 'is-personal' : 'is-vehicles'}`}></div>
                    </div>

                    {activeTab === 'personal' && (
                        <div className="customer-profile-pane">
                            <div className="customer-profile-form-grid">
                                <InputGroup
                                    label="First Name"
                                    val={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                                <InputGroup
                                    label="Last Name"
                                    val={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                            <div className="customer-profile-input-group">
                                <label className="customer-profile-input-label">Email</label>
                                <input
                                    className="customer-profile-email-input"
                                    value={profile?.email}
                                    disabled
                                />
                            </div>
                            <InputGroup
                                label="Phone"
                                val={formData.phone}
                                className="mb-10"
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="customer-profile-save-button"
                            >
                                {saving ? 'Saving...' : 'Save Profile Changes'}
                            </button>
                        </div>
                    )}

                    {activeTab === 'vehicles' && (
                        <div className="customer-profile-pane">
                            {vehicles.length === 0 ? (
                                <div className="customer-profile-vehicles-empty">No vehicles found. Add your first vehicle below.</div>
                            ) : (
                                <div className="customer-profile-vehicle-list">
                                    {vehicles.map(vehicle => (
                                        <div key={vehicle.id} className="customer-profile-vehicle-card">
                                            <div className="customer-profile-vehicle-icon">🚗</div>
                                            <div className="customer-profile-vehicle-copy">
                                                <div className="customer-profile-vehicle-title">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                                                <div className="customer-profile-vehicle-meta">
                                                    {vehicle.plate} · {vehicle.color || 'Unknown Color'} · {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : 'N/A mi'}
                                                </div>
                                            </div>
                                            <div className="customer-profile-vehicle-actions">
                                                <button onClick={() => handleRemoveVehicle(vehicle.id)} className="customer-profile-remove-button">Remove</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="customer-profile-add-vehicle-button"
                            >
                                + Add New Vehicle
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* ADD VEHICLE MODAL */}
            {showAddModal && (
                <div className="customer-profile-modal-backdrop">
                    <div className="customer-profile-modal-card">
                        <div className="customer-profile-modal-head">
                            <div>
                                <h2 className="customer-profile-modal-title">Add New Vehicle</h2>
                                <p className="customer-profile-modal-subtitle">Garage Management</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="customer-profile-modal-close">✕</button>
                        </div>

                        <form onSubmit={handleAddVehicle} className="customer-profile-modal-form">
                            <div className="customer-profile-modal-grid">
                                <InputGroup
                                    label="Make"
                                    val={newVehicle.make}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                                    required
                                />
                                <InputGroup
                                    label="Model"
                                    val={newVehicle.model}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="customer-profile-modal-grid">
                                <InputGroup
                                    label="Year"
                                    type="number"
                                    val={newVehicle.year}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                                    required
                                />
                                <InputGroup
                                    label="License Plate"
                                    val={newVehicle.plate}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="customer-profile-modal-grid">
                                <InputGroup
                                    label="Color"
                                    val={newVehicle.color}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                                />
                                <InputGroup
                                    label="Mileage"
                                    type="number"
                                    val={newVehicle.mileage}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, mileage: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="customer-profile-modal-submit"
                            >
                                {saving ? 'Adding to Garage...' : 'Add Vehicle to Garage'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const PHStat = ({ val, label }) => (
    <div className="customer-profile-stat-item">
        <div className="customer-profile-stat-value">{val}</div>
        <div className="customer-profile-stat-label">{label}</div>
    </div>
);

const ProfileTab = ({ label, active, onClick }) => (
    <button
        className={`customer-profile-tab ${active ? 'is-active' : ''}`}
        onClick={onClick}
    >
        {label}
    </button>
);

const InputGroup = ({ label, val, onChange, className = '', type = 'text', ...props }) => (
    <div className={`customer-profile-input-group ${className}`.trim()}>
        <label className="customer-profile-input-label">{label}</label>
        <input
            type={type}
            className="customer-profile-input"
            value={val}
            onChange={onChange}
            {...props}
        />
    </div>
);

export default CustomerProfile;





