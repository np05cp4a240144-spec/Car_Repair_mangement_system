import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axios';
import './AdminSettings.css';

const STORAGE_KEYS = {
    garage: 'autoassist_admin_settings_garage',
    hours: 'autoassist_admin_settings_hours',
    billing: 'autoassist_admin_settings_billing',
    notifications: 'autoassist_admin_notification_prefs',
    security: 'autoassist_admin_settings_security'
};

const DEFAULT_GARAGE = {
    garageName: "Reid's Auto Centre",
    phone: '+1 (555) 800-1234',
    email: 'contact@reidsauto.com',
    address: 'Patan, Lalitpur, Nepal',
    taxId: 'ABN 12 345 678 901',
    currency: 'NPR - Nepalese Rupee'
};

const DEFAULT_HOURS = {
    monFriOpen: '08:00',
    monFriClose: '17:30',
    satOpen: '09:00',
    satClose: '14:00',
    sundayOpen: false,
    publicHolidayClosures: true
};

const DEFAULT_BILLING = {
    taxRate: '8',
    invoicePrefix: 'INV-',
    paymentTerms: 'Due on completion',
    autoSendInvoices: true,
    acceptOnlinePayments: true,
    loyaltyDiscounts: true
};

const DEFAULT_NOTIFICATION_PREFS = {
    newBookingAlerts: true,
    cancellationAlerts: true,
    lowStockAlerts: true,
    paymentConfirmations: true,
    dailyDigest: false
};

const DEFAULT_SECURITY = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorAuth: true,
    sessionTimeout: false
};

const getStoredJSON = (key, fallback) => {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return { ...fallback, ...parsed };
    } catch {
        return fallback;
    }
};

const saveStoredJSON = (key, value) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
};

const AdminSettings = () => {
    const [activeTab, setActiveTab] = useState('garage');
    const [saveMessage, setSaveMessage] = useState('');

    const tabs = [
        { id: 'garage', label: 'Garage Info', icon: '🏪' },
        { id: 'hours', label: 'Hours', icon: '🕐' },
        { id: 'billing', label: 'Billing', icon: '💳' },
        { id: 'notifs', label: 'Notifications', icon: '🔔' },
        { id: 'users', label: 'Users & Roles', icon: '👥' },
        { id: 'security', label: 'Security', icon: '🔒' }
    ];

    const showSaved = (text) => {
        setSaveMessage(text);
        setTimeout(() => setSaveMessage(''), 2200);
    };

    return (
        <div className="admin-settings">
            <div className="admin-settings__sidebar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`admin-settings__tab ${activeTab === tab.id ? 'admin-settings__tab--active' : ''}`}
                    >
                        <span className="admin-settings__tab-icon">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="admin-settings__content">
                <div className="admin-settings__content-inner">
                    {saveMessage && <div className="admin-settings__save-msg">{saveMessage}</div>}
                    {activeTab === 'garage' && <GarageSettings onSaved={showSaved} />}
                    {activeTab === 'hours' && <HoursSettings onSaved={showSaved} />}
                    {activeTab === 'billing' && <BillingSettings onSaved={showSaved} />}
                    {activeTab === 'notifs' && <NotificationSettings onSaved={showSaved} />}
                    {activeTab === 'users' && <UserRolesSettings onSaved={showSaved} />}
                    {activeTab === 'security' && <SecuritySettings onSaved={showSaved} />}
                </div>
            </div>
        </div>
    );
};

const GarageSettings = ({ onSaved }) => {
    const [form, setForm] = useState(() => getStoredJSON(STORAGE_KEYS.garage, DEFAULT_GARAGE));

    const handleChange = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
    const handleSave = () => {
        saveStoredJSON(STORAGE_KEYS.garage, form);
        onSaved('Garage settings saved');
    };

    return (
        <div className="admin-settings__panel">
            <div>
                <h2 className="admin-settings__title">Garage Information</h2>
                <p className="admin-settings__subtitle">Business details shown on invoices and customer communications.</p>
            </div>
            <div className="admin-settings__stack">
                <FormGroup label="Garage Name" name="garageName" value={form.garageName} onChange={handleChange} />
                <div className="admin-settings__grid admin-settings__grid--2">
                    <FormGroup label="Phone" name="phone" value={form.phone} onChange={handleChange} />
                    <FormGroup label="Email" name="email" value={form.email} onChange={handleChange} />
                </div>
                <FormGroup label="Address" name="address" value={form.address} onChange={handleChange} />
                <div className="admin-settings__grid admin-settings__grid--2">
                    <FormGroup label="ABN / Tax ID" name="taxId" value={form.taxId} onChange={handleChange} isMono />
                    <FormGroup
                        label="Currency"
                        name="currency"
                        type="select"
                        value={form.currency}
                        onChange={handleChange}
                        options={['NPR - Nepalese Rupee', 'USD - US Dollar']}
                    />
                </div>
            </div>
            <button type="button" className="admin-settings__primary-btn" onClick={handleSave}>Save Changes</button>
        </div>
    );
};

const HoursSettings = ({ onSaved }) => {
    const [form, setForm] = useState(() => getStoredJSON(STORAGE_KEYS.hours, DEFAULT_HOURS));

    const handleChange = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
    const handleSave = () => {
        saveStoredJSON(STORAGE_KEYS.hours, form);
        onSaved('Operating hours saved');
    };

    return (
        <div className="admin-settings__panel">
            <div>
                <h2 className="admin-settings__title">Operating Hours</h2>
                <p className="admin-settings__subtitle">Set when your garage is open for bookings.</p>
            </div>
            <div className="admin-settings__stack">
                <div className="admin-settings__grid admin-settings__grid--2">
                    <FormGroup label="Monday-Friday Open" name="monFriOpen" type="time" value={form.monFriOpen} onChange={handleChange} />
                    <FormGroup label="Monday-Friday Close" name="monFriClose" type="time" value={form.monFriClose} onChange={handleChange} />
                </div>
                <div className="admin-settings__grid admin-settings__grid--2">
                    <FormGroup label="Saturday Open" name="satOpen" type="time" value={form.satOpen} onChange={handleChange} />
                    <FormGroup label="Saturday Close" name="satClose" type="time" value={form.satClose} onChange={handleChange} />
                </div>
                <div className="admin-settings__toggle-wrap">
                    <ToggleRow title="Open on Sundays" detail="Accept bookings on Sundays" checked={form.sundayOpen} onChange={(value) => handleChange('sundayOpen', value)} />
                    <ToggleRow title="Public Holiday Closures" detail="Auto-block bookings on public holidays" checked={form.publicHolidayClosures} onChange={(value) => handleChange('publicHolidayClosures', value)} />
                </div>
            </div>
            <button type="button" className="admin-settings__primary-btn" onClick={handleSave}>Save Hours</button>
        </div>
    );
};


const BillingSettings = ({ onSaved }) => {
    const [form, setForm] = useState(() => getStoredJSON(STORAGE_KEYS.billing, DEFAULT_BILLING));
    const [saving, setSaving] = useState(false);

    const handleChange = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));


    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                taxRate: parseFloat(form.taxRate),
                invoicePrefix: form.invoicePrefix,
                paymentTerms: form.paymentTerms,
                autoSendInvoices: !!form.autoSendInvoices,
                acceptOnlinePayments: !!form.acceptOnlinePayments,
                loyaltyDiscounts: !!form.loyaltyDiscounts
            };
            await api.put('/settings', payload);
            saveStoredJSON(STORAGE_KEYS.billing, form);
            onSaved('Billing settings saved');
        } catch (err) {
            onSaved('Failed to save billing settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-settings__panel">
            <div>
                <h2 className="admin-settings__title">Billing Settings</h2>
                <p className="admin-settings__subtitle">Invoice and payment configuration.</p>
            </div>
            <div className="admin-settings__stack">
                <FormGroup label="Default Tax Rate (%)" name="taxRate" type="number" value={form.taxRate} onChange={handleChange} />
                <FormGroup label="Invoice Prefix" name="invoicePrefix" value={form.invoicePrefix} onChange={handleChange} isMono />
                <FormGroup
                    label="Payment Terms"
                    name="paymentTerms"
                    type="select"
                    value={form.paymentTerms}
                    onChange={handleChange}
                    options={['Due on completion', 'Net 7', 'Net 14', 'Net 30']}
                />
                <div className="admin-settings__toggle-wrap">
                    <ToggleRow title="Auto-send invoices" detail="Email invoice to customer after job completion" checked={form.autoSendInvoices} onChange={(value) => handleChange('autoSendInvoices', value)} />
                    <ToggleRow title="Accept online payments" detail="Enable Stripe payment link on invoices" checked={form.acceptOnlinePayments} onChange={(value) => handleChange('acceptOnlinePayments', value)} />
                    <ToggleRow title="Loyalty discounts" detail="10% off for customers with 5+ visits" checked={form.loyaltyDiscounts} onChange={(value) => handleChange('loyaltyDiscounts', value)} />
                </div>
            </div>
            <button type="button" className="admin-settings__primary-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Billing'}
            </button>
        </div>
    );
};

const NotificationSettings = ({ onSaved }) => {
    const [prefs, setPrefs] = useState(() => getStoredJSON(STORAGE_KEYS.notifications, DEFAULT_NOTIFICATION_PREFS));

    const setToggle = (name, value) => setPrefs((prev) => ({ ...prev, [name]: value }));
    const handleSave = () => {
        saveStoredJSON(STORAGE_KEYS.notifications, prefs);
        onSaved('Notification preferences saved');
    };

    return (
        <div className="admin-settings__panel">
            <div>
                <h2 className="admin-settings__title">Notifications</h2>
                <p className="admin-settings__subtitle">Choose what alerts reach you and your team.</p>
            </div>
            <div className="admin-settings__divider-list">
                <ToggleRow title="New Booking Alerts" detail="Email + push when a new appointment is made" checked={prefs.newBookingAlerts} onChange={(value) => setToggle('newBookingAlerts', value)} noBorder />
                <ToggleRow title="Cancellation Alerts" detail="Notify when customer cancels" checked={prefs.cancellationAlerts} onChange={(value) => setToggle('cancellationAlerts', value)} noBorder />
                <ToggleRow title="Low Stock Alerts" detail="Alert when parts drop below threshold" checked={prefs.lowStockAlerts} onChange={(value) => setToggle('lowStockAlerts', value)} noBorder />
                <ToggleRow title="Payment Confirmations" detail="Notify on every successful payment" checked={prefs.paymentConfirmations} onChange={(value) => setToggle('paymentConfirmations', value)} noBorder />
                <ToggleRow title="Daily Digest" detail="End-of-day summary email" checked={prefs.dailyDigest} onChange={(value) => setToggle('dailyDigest', value)} noBorder />
            </div>
            <button type="button" className="admin-settings__primary-btn" onClick={handleSave}>Save Preferences</button>
        </div>
    );
};

const UserRolesSettings = ({ onSaved }) => {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [usersError, setUsersError] = useState('');
    const [editingUserId, setEditingUserId] = useState(null);
    const [roleDraft, setRoleDraft] = useState('USER');
    const [savingRole, setSavingRole] = useState(false);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            setUsersError('');
            const res = await api.get('/auth/users');
            setUsers(res.data || []);
        } catch (error) {
            setUsersError(error?.response?.data?.error || 'Failed to load users.');
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const roleLabel = (role) => {
        if (role === 'ADMIN') return 'Super Admin';
        if (role === 'MECHANIC') return 'Mechanic';
        return 'Customer';
    };

    const roleColor = (role) => (role === 'ADMIN' ? 'orange' : 'blue');

    const startEdit = (user) => {
        setEditingUserId(user.id);
        setRoleDraft(user.role || 'USER');
    };

    const cancelEdit = () => {
        setEditingUserId(null);
        setRoleDraft('USER');
    };

    const saveRole = async () => {
        if (!editingUserId) return;

        try {
            setSavingRole(true);
            setUsersError('');

            const res = await api.put(`/auth/users/${editingUserId}/role`, {
                role: roleDraft
            });

            const updatedUser = res.data;
            setUsers((prev) =>
                prev.map((user) => (user.id === editingUserId ? { ...user, ...updatedUser } : user))
            );

            onSaved('User role updated');
            cancelEdit();
        } catch (error) {
            setUsersError(error?.response?.data?.error || 'Failed to update user role.');
        } finally {
            setSavingRole(false);
        }
    };

    return (
        <div className="admin-settings__panel">
            <div>
                <h2 className="admin-settings__title">Users & Roles</h2>
                <p className="admin-settings__subtitle">Manage staff access and permissions.</p>
            </div>

            {usersError && <div className="admin-settings__error-msg">{usersError}</div>}

            <div className="admin-settings__table-wrap">
                <table className="admin-settings__table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingUsers ? (
                            <>
                                <tr>
                                    <td colSpan="4" className="admin-settings__table-empty">Loading users...</td>
                                </tr>
                            </>
                        ) : users.length === 0 ? (
                            <>
                                <tr>
                                    <td colSpan="4" className="admin-settings__table-empty">No users found.</td>
                                </tr>
                            </>
                        ) : (
                            <>
                                {users.map((user) => {
                                    const isEditing = editingUserId === user.id;
                                    return (
                                        <tr className="admin-settings__user-row" key={user.id}>
                                            <td>
                                                <div className="admin-settings__user-name">{user.name || user.email || `User #${user.id}`}</div>
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <select className="admin-settings__role-select" value={roleDraft} onChange={(e) => setRoleDraft(e.target.value)}>
                                                        <option value="MECHANIC">Mechanic</option>
                                                        <option value="USER">Customer</option>
                                                    </select>
                                                ) : (
                                                    <span className={`admin-settings__role-badge ${roleColor(user.role) === 'orange' ? 'admin-settings__role-badge--orange' : 'admin-settings__role-badge--blue'}`}>
                                                        {roleLabel(user.role)}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="admin-settings__status">
                                                    <span className="admin-settings__status-dot"></span>
                                                    Active
                                                </span>
                                            </td>
                                            <td className="admin-settings__actions-cell">
                                                {isEditing ? (
                                                    <div className="admin-settings__row-actions">
                                                        <button type="button" className="admin-settings__edit-btn" onClick={saveRole} disabled={savingRole}>
                                                            {savingRole ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button type="button" className="admin-settings__edit-btn" onClick={cancelEdit} disabled={savingRole}>Cancel</button>
                                                    </div>
                                                ) : (
                                                    <button type="button" className="admin-settings__edit-btn" onClick={() => startEdit(user)}>Edit</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            <button
                type="button"
                className="admin-settings__secondary-btn"
                onClick={() => onSaved('Use Mechanics page to add team members')}
            >
                <span>+</span> Invite Team Member
            </button>
        </div>
    );
};

const SecuritySettings = ({ onSaved }) => {
    const stored = useMemo(() => getStoredJSON(STORAGE_KEYS.security, DEFAULT_SECURITY), []);
    const [form, setForm] = useState(stored);
    const [error, setError] = useState('');

    const handleChange = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

    const handleSave = () => {
        setError('');
        if (form.newPassword && form.newPassword.length < 8) {
            setError('New password must be at least 8 characters.');
            return;
        }
        if (form.newPassword !== form.confirmPassword) {
            setError('New password and confirm password do not match.');
            return;
        }

        saveStoredJSON(STORAGE_KEYS.security, {
            twoFactorAuth: form.twoFactorAuth,
            sessionTimeout: form.sessionTimeout
        });

        setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        onSaved('Security settings updated');
    };

    return (
        <div className="admin-settings__panel">
            <div>
                <h2 className="admin-settings__title">Security</h2>
                <p className="admin-settings__subtitle">Password and access management.</p>
            </div>
            <div className="admin-settings__stack">
                <FormGroup label="Current Password" name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} placeholder="********" />
                <FormGroup label="New Password" name="newPassword" type="password" value={form.newPassword} onChange={handleChange} placeholder="Min. 8 characters" />
                <FormGroup label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat new password" />
                {error && <div className="admin-settings__error-msg">{error}</div>}
                <div className="admin-settings__toggle-wrap">
                    <ToggleRow title="Two-Factor Authentication" detail="Require 2FA for all admin logins" checked={form.twoFactorAuth} onChange={(value) => handleChange('twoFactorAuth', value)} />
                    <ToggleRow title="Session Timeout" detail="Auto log out after 30 minutes of inactivity" checked={form.sessionTimeout} onChange={(value) => handleChange('sessionTimeout', value)} />
                </div>
            </div>
            <button type="button" className="admin-settings__primary-btn" onClick={handleSave}>Update Security</button>
        </div>
    );
};

const FormGroup = ({ label, name, type = 'text', value, placeholder, isMono, options = [], onChange }) => (
    <div className="admin-settings__form-group">
        <label>{label}</label>
        {type === 'select' ? (
            <select
                className="admin-settings__input admin-settings__input--select"
                value={value}
                onChange={(e) => onChange(name, e.target.value)}
            >
                {options.map(opt => <option key={opt}>{opt}</option>)}
            </select>
        ) : (
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                className={`admin-settings__input ${isMono ? 'admin-settings__input--mono' : ''}`}
                onChange={(e) => onChange(name, e.target.value)}
            />
        )}
    </div>
);

const ToggleRow = ({ title, detail, checked, onChange, noBorder }) => (
    <div className={`admin-settings__toggle-row ${!noBorder ? 'admin-settings__toggle-row--border' : ''}`}>
        <div>
            <h5>{title}</h5>
            <p>{detail}</p>
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`admin-settings__switch ${checked ? 'admin-settings__switch--on' : ''}`}
        >
            <div className={`admin-settings__switch-thumb ${checked ? 'admin-settings__switch-thumb--on' : ''}`}></div>
        </button>
    </div>
);

export default AdminSettings;


