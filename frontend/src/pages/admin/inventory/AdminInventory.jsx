import './AdminInventory.css';
import { useState, useEffect } from 'react';
import api from '../../../api/axios';

const AdminInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'logs'

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(null); // stores part object
    const [showUpdateModal, setShowUpdateModal] = useState(null); // stores part object
    const [showDetailModal, setShowDetailModal] = useState(null); // stores part id

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const [invRes, logsRes] = await Promise.all([
                api.get('/inventory'),
                api.get('/inventory/logs')
            ]);
            setInventory(invRes.data);
            setLogs(logsRes.data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleUpdateStock = async (id, amount, type, notes) => {
        try {
            await api.put(`/inventory/${id}/stock`, { amount, type, notes });
            setShowUpdateModal(null);
            fetchInventory();
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('Failed to update stock');
        }
    };

    const handleAddPart = async (partData) => {
        try {
            await api.post('/inventory', partData);
            setShowAddModal(false);
            fetchInventory();
        } catch (error) {
            console.error('Error adding part:', error);
            alert('Failed to add part');
        }
    };

    const handleEditPart = async (id, partData) => {
        try {
            await api.put(`/inventory/${id}`, partData);
            setShowEditModal(null);
            fetchInventory();
        } catch (error) {
            console.error('Error editing part:', error);
            alert('Failed to edit part');
        }
    };

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const attentionItems = inventory.filter(item => item.status !== 'OK').length;

    return (
        <div className="admin-inventory-page">
            <div className="admin-inventory-page__header">
                <div className="admin-inventory-page__tabs">
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`admin-inventory-page__tab ${activeTab === 'inventory' ? 'admin-inventory-page__tab--active' : ''}`}
                    >
                        Inventory List
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`admin-inventory-page__tab ${activeTab === 'logs' ? 'admin-inventory-page__tab--active' : ''}`}
                    >
                        History Logs
                    </button>
                </div>

                <div className="admin-inventory-page__actions">
                    {activeTab === 'inventory' && (
                        <>
                            <div className="admin-inventory-page__search-wrap">
                                <span className="admin-inventory-page__search-icon">🔍</span>
                                <input
                                    placeholder="Search parts..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="admin-inventory-page__search-input"
                                />
                            </div>
                            <button
                                className="admin-inventory-page__add-btn"
                                onClick={() => setShowAddModal(true)}
                            >
                                + Add Part
                            </button>
                        </>
                    )}
                </div>
            </div>

            {activeTab === 'inventory' ? (
                <>
                    <div className="admin-inventory-page__meta">
                        {inventory.length} items |{' '}
                        <span className="admin-inventory-page__attention">
                            {attentionItems} need attention
                        </span>
                    </div>
                    <div className="admin-inventory-table-wrap">
                        <div className="admin-inventory-table-wrap__scroll">
                            <table className="admin-inventory-table">
                                <thead>
                                    <tr className="admin-inventory-table__head-row">
                                        <th className="admin-inventory-table__head-cell">Part Name</th>
                                        <th className="admin-inventory-table__head-cell">SKU</th>
                                        <th className="admin-inventory-table__head-cell">Category</th>
                                        <th className="admin-inventory-table__head-cell">Price</th>
                                        <th className="admin-inventory-table__head-cell">Stock</th>
                                        <th className="admin-inventory-table__head-cell">Level</th>
                                        <th className="admin-inventory-table__head-cell">Unit</th>
                                        <th className="admin-inventory-table__head-cell">Status</th>
                                        <th className="admin-inventory-table__head-cell admin-inventory-table__head-cell--right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="9" className="admin-inventory-table__empty-cell">Loading inventory...</td>
                                        </tr>
                                    ) : filteredInventory.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="admin-inventory-table__empty-cell">No items found.</td>
                                        </tr>
                                    ) : (
                                        filteredInventory.map((item, index) => (
                                            <InvRow
                                                key={item.id}
                                                item={item}
                                                isLast={index === filteredInventory.length - 1}
                                                onEditOpen={(part) => setShowEditModal(part)}
                                                onUpdateOpen={(part) => setShowUpdateModal(part)}
                                                onDetailOpen={(id) => setShowDetailModal(id)}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="admin-inventory-table-wrap">
                    <div className="admin-inventory-table-wrap__scroll">
                        <table className="admin-inventory-table">
                            <thead>
                                <tr className="admin-inventory-table__head-row">
                                    <th className="admin-inventory-table__head-cell">Date</th>
                                    <th className="admin-inventory-table__head-cell">Part</th>
                                    <th className="admin-inventory-table__head-cell">Action</th>
                                    <th className="admin-inventory-table__head-cell">Amount</th>
                                    <th className="admin-inventory-table__head-cell">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="admin-inventory-table__empty-cell">Loading logs...</td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="admin-inventory-table__empty-cell">No logs recorded yet.</td>
                                    </tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id} className="admin-log-row">
                                        <td className="admin-log-row__date">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="admin-log-row__name">{log.part.name}</td>
                                        <td className="admin-log-row__action">
                                            <span className={`admin-log-row__badge ${
                                                log.type === 'Stock In'
                                                    ? 'admin-log-row__badge--in'
                                                    : log.type === 'Stock Out'
                                                        ? 'admin-log-row__badge--out'
                                                        : 'admin-log-row__badge--other'
                                            }`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="admin-log-row__amount">{log.amount}</td>
                                        <td className="admin-log-row__notes">{log.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showAddModal && <AddPartModal onClose={() => setShowAddModal(false)} onSubmit={handleAddPart} />}
            {showEditModal && <EditPartModal part={showEditModal} onClose={() => setShowEditModal(null)} onSubmit={handleEditPart} />}
            {showUpdateModal && <UpdateStockModal part={showUpdateModal} onClose={() => setShowUpdateModal(null)} onSubmit={handleUpdateStock} />}
            {showDetailModal && <PartDetailModal partId={showDetailModal} onClose={() => setShowDetailModal(null)} />}
        </div>
    );
};

const InvRow = ({ item, isLast, onEditOpen, onUpdateOpen, onDetailOpen }) => {
    const { id, name, sku, category, stock, maxStock, unit, status } = item;

    const pct = Math.min(Math.round((stock / maxStock) * 100), 100);
    const color = status === 'Critical' ? 'critical' : status === 'Low' ? 'low' : 'ok';
    const widthClassMap = {
        0: 'inv-row__fill--w0',
        5: 'inv-row__fill--w5',
        10: 'inv-row__fill--w10',
        15: 'inv-row__fill--w15',
        20: 'inv-row__fill--w20',
        25: 'inv-row__fill--w25',
        30: 'inv-row__fill--w30',
        35: 'inv-row__fill--w35',
        40: 'inv-row__fill--w40',
        45: 'inv-row__fill--w45',
        50: 'inv-row__fill--w50',
        55: 'inv-row__fill--w55',
        60: 'inv-row__fill--w60',
        65: 'inv-row__fill--w65',
        70: 'inv-row__fill--w70',
        75: 'inv-row__fill--w75',
        80: 'inv-row__fill--w80',
        85: 'inv-row__fill--w85',
        90: 'inv-row__fill--w90',
        95: 'inv-row__fill--w95',
        100: 'inv-row__fill--w100'
    };
    const roundedPct = Math.round(pct / 5) * 5;

    return (
        <tr className={`inv-row ${isLast ? 'inv-row--last' : ''}`}>
            <td className="inv-row__cell">
                <div className="inv-row__name" onClick={() => onDetailOpen(id)}>{name}</div>
            </td>
            <td className="inv-row__cell inv-row__sku">{sku}</td>
            <td className="inv-row__cell inv-row__category">{category}</td>
            <td className="inv-row__cell inv-row__price">
                Rs. {item.price?.toLocaleString() || '0.00'}
            </td>
            <td className={`inv-row__cell inv-row__stock inv-row__stock--${color}`}>
                {stock}
            </td>
            <td className="inv-row__cell">
                <div className="inv-row__bar">
                    <div className={`inv-row__fill ${widthClassMap[roundedPct] || 'inv-row__fill--w50'} inv-row__fill--${color}`}></div>
                </div>
            </td>
            <td className="inv-row__cell inv-row__unit">{unit}</td>
            <td className="inv-row__cell">
                <span className={`inv-row__status inv-row__status--${color}`}>
                    <span className="inv-row__status-dot"></span>
                    {status}
                </span>
            </td>
            <td className="inv-row__cell inv-row__cell--right">
                <div className="inv-row__actions">
                    <button
                        className="inv-row__action-btn"
                        onClick={() => onEditOpen(item)}
                    >
                        Edit
                    </button>
                    <button
                        className="inv-row__action-btn"
                        onClick={() => onUpdateOpen(item)}
                    >
                        Stock
                    </button>
                    <button
                        className="inv-row__action-btn"
                        onClick={() => onDetailOpen(id)}
                    >
                        Details
                    </button>
                </div>
            </td>
        </tr>
    );
};

// --- Sub-Modals ---

const EditPartModal = ({ part, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: part.name, sku: part.sku, category: part.category, minStock: part.minStock, maxStock: part.maxStock, unit: part.unit, price: part.price
    });

    const handleSumbit = (e) => {
        e.preventDefault();
        onSubmit(part.id, formData);
    };

    return (
        <div className="inventory-modal">
            <div className="inventory-modal__panel inventory-modal__panel--medium">
                <div className="inventory-modal__header">
                    <h3 className="inventory-modal__title">Edit Part: {part.sku}</h3>
                    <button onClick={onClose} className="inventory-modal__close">&times;</button>
                </div>
                <form onSubmit={handleSumbit} className="inventory-form">
                    <div className="inventory-form__grid">
                        <div className="inventory-form__field inventory-form__field--full">
                            <label className="inventory-form__label">Part Name</label>
                            <input required className="inventory-form__input"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="inventory-form__field">
                            <label className="inventory-form__label">SKU</label>
                            <input required className="inventory-form__input"
                                value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                        </div>
                        <div className="inventory-form__field">
                            <label className="inventory-form__label">Category</label>
                            <select className="inventory-form__input"
                                value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option>General</option>
                                <option>Engine</option>
                                <option>Brakes</option>
                                <option>Fluids</option>
                                <option>Filters</option>
                                <option>Body</option>
                            </select>
                        </div>
                        <div className="inventory-form__field">
                            <label className="inventory-form__label">Price (Rs.)</label>
                            <input type="number" step="0.01" className="inventory-form__input"
                                value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        </div>
                        <div className="inventory-form__field">
                            <label className="inventory-form__label">Unit</label>
                            <input className="inventory-form__input"
                                value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g. units, litres" />
                        </div>
                    </div>
                    <div className="inventory-form__actions">
                        <button type="button" onClick={onClose} className="inventory-form__btn inventory-form__btn--ghost">Cancel</button>
                        <button type="submit" className="inventory-form__btn inventory-form__btn--primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddPartModal = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '', sku: '', category: 'General', stock: 0, minStock: 5, maxStock: 50, unit: 'units', price: 0
    });

    const handleSumbit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="inventory-modal">
            <div className="inventory-modal__panel inventory-modal__panel--medium">
                <div className="inventory-modal__header">
                    <h3 className="inventory-modal__title">Add New Part</h3>
                    <button onClick={onClose} className="inventory-modal__close">&times;</button>
                </div>
                <form onSubmit={handleSumbit} className="inventory-form">
                    <div className="inventory-form__grid">
                        <div className="inventory-form__field inventory-form__field--full">
                            <label className="inventory-form__label">Part Name</label>
                            <input required className="inventory-form__input"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="inventory-form__field">
                            <label className="inventory-form__label">SKU</label>
                            <input required className="inventory-form__input"
                                value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                        </div>
                        <div className="inventory-form__field">
                            <label className="inventory-form__label">Category</label>
                            <select className="inventory-form__input"
                                value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option>General</option>
                                <option>Engine</option>
                                <option>Brakes</option>
                                <option>Fluids</option>
                                <option>Filters</option>
                                <option>Body</option>
                            </select>
                        </div>
                        <div className="inventory-form__field">
                            <label className="inventory-form__label">Price (Rs.)</label>
                            <input type="number" step="0.01" className="inventory-form__input"
                                value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        </div>
                        <div className="inventory-form__field">
                            <label className="inventory-form__label">Initial Stock</label>
                            <input type="number" className="inventory-form__input"
                                value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                        </div>
                        <div className="inventory-form__field">
                            <label className="inventory-form__label">Unit</label>
                            <input className="inventory-form__input"
                                value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g. units, litres" />
                        </div>
                    </div>
                    <div className="inventory-form__actions">
                        <button type="button" onClick={onClose} className="inventory-form__btn inventory-form__btn--ghost">Cancel</button>
                        <button type="submit" className="inventory-form__btn inventory-form__btn--primary">Add Part</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UpdateStockModal = ({ part, onClose, onSubmit }) => {
    const [type, setType] = useState('Stock In');
    const [amount, setAmount] = useState(1);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(part.id, amount, type, notes);
    };

    return (
        <div className="inventory-modal">
            <div className="inventory-modal__panel inventory-modal__panel--small">
                <div className="inventory-modal__header">
                    <div>
                        <h3 className="inventory-modal__title inventory-modal__title--sm">Update Stock</h3>
                        <p className="inventory-modal__subtitle">{part.name}</p>
                    </div>
                    <button onClick={onClose} className="inventory-modal__close">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="inventory-form inventory-form--spaced">
                    <div className="inventory-stock-toggle">
                        <button
                            type="button"
                            onClick={() => setType('Stock In')}
                            className={`inventory-stock-toggle__btn ${type === 'Stock In' ? 'inventory-stock-toggle__btn--active-in' : ''}`}
                        >
                            Stock In
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('Stock Out')}
                            className={`inventory-stock-toggle__btn ${type === 'Stock Out' ? 'inventory-stock-toggle__btn--active-out' : ''}`}
                        >
                            Stock Out
                        </button>
                    </div>
                    <div className="inventory-form__field">
                        <label className="inventory-form__label">Quantity ({part.unit})</label>
                        <input type="number" required min="1" className="inventory-form__input inventory-form__input--qty"
                            value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div className="inventory-form__field">
                        <label className="inventory-form__label">Notes (Optional)</label>
                        <textarea className="inventory-form__textarea"
                            placeholder="Reason for adjustment..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                    <div className="inventory-form__actions inventory-form__actions--compact">
                        <button type="button" onClick={onClose} className="inventory-form__btn inventory-form__btn--ghost">Cancel</button>
                        <button
                            type="submit"
                            className={`inventory-form__btn inventory-form__btn--confirm ${type === 'Stock In' ? 'inventory-form__btn--confirm-in' : 'inventory-form__btn--confirm-out'}`}
                        >
                            Confirm {type}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PartDetailModal = ({ partId, onClose }) => {
    const [part, setPart] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/inventory/${partId}`);
                setPart(res.data);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [partId]);

    if (loading) return null;
    if (!part) return null;

    return (
        <div className="inventory-modal">
            <div className="inventory-modal__panel inventory-modal__panel--large">
                <div className="inventory-modal__header inventory-modal__header--detail">
                    <div>
                        <h3 className="inventory-modal__title inventory-modal__title--lg">{part.name}</h3>
                        <p className="inventory-modal__meta">{part.sku} · {part.category.toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="inventory-modal__close inventory-modal__close--lg">&times;</button>
                </div>
                <div className="inventory-detail">
                    <div className="inventory-detail__stats">
                        <div className="inventory-detail__card">
                            <div className="inventory-detail__card-label">Price</div>
                            <div className="inventory-detail__card-value">Rs. {part.price?.toLocaleString()}</div>
                        </div>
                        <div className="inventory-detail__card">
                            <div className="inventory-detail__card-label">Current Stock</div>
                            <div className="inventory-detail__card-value">
                                {part.stock}
                                <span className="inventory-detail__unit">{part.unit}</span>
                            </div>
                        </div>
                        <div className="inventory-detail__card">
                            <div className="inventory-detail__card-label">Threshold</div>
                            <div className="inventory-detail__card-value inventory-detail__card-value--warn">
                                {part.minStock}
                                <span className="inventory-detail__unit">{part.unit}</span>
                            </div>
                        </div>
                    </div>

                    <h4 className="inventory-detail__section-title">Activity Log</h4>
                    <div className="inventory-detail__log-list">
                        {part.logs?.map(log => (
                            <div key={log.id} className="inventory-detail__log-item">
                                <div className={`inventory-detail__log-icon ${
                                    log.type === 'Stock In'
                                        ? 'inventory-detail__log-icon--in'
                                        : log.type === 'Stock Out'
                                            ? 'inventory-detail__log-icon--out'
                                            : 'inventory-detail__log-icon--other'
                                }`}>
                                    {log.type === 'Stock In' ? '↓' : '↑'}
                                </div>
                                <div className="inventory-detail__log-content">
                                    <div className="inventory-detail__log-top">
                                        <div className="inventory-detail__log-type">{log.type}</div>
                                        <div className="inventory-detail__log-date">{new Date(log.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="inventory-detail__log-notes">{log.notes || 'No description provided'}</div>
                                </div>
                                <div className="inventory-detail__log-amount">
                                    {log.type === 'Stock In' ? '+' : log.type === 'Stock Out' ? '-' : ''}{log.amount}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AdminInventory;





