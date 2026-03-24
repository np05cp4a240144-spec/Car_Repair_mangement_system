import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axios';
import './MechanicParts.css';

const MechanicParts = () => {
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [requestingIds, setRequestingIds] = useState(new Set());

    useEffect(() => {
        const fetchParts = async () => {
            try {
                const res = await api.get('/inventory');
                setParts(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error('Error fetching inventory parts:', error);
                setMessage('Failed to load inventory.');
            } finally {
                setLoading(false);
            }
        };

        fetchParts();
    }, []);

    const normalizeStatus = (p) => {
        const stock = Number(p?.stock || 0);
        const min = Number(p?.minStock || 0);
        if (stock <= 2) return 'Critical';
        if (stock <= min) return 'Low';
        return 'OK';
    };

    const lowStockParts = useMemo(() => parts.filter((p) => normalizeStatus(p) !== 'OK'), [parts]);

    const allParts = useMemo(() => parts, [parts]);

    const toProgress = (p) => {
        const stock = Number(p?.stock || 0);
        const max = Number(p?.maxStock || 0);
        if (max <= 0) return 0;
        return Math.max(0, Math.min(100, Math.round((stock / max) * 100)));
    };

    const requestRestock = async (part) => {
        setMessage('');
        setRequestingIds((prev) => new Set(prev).add(part.id));
        try {
            const amount = Math.max((Number(part.maxStock || 0) - Number(part.stock || 0)), 1);
            await api.post(`/inventory/${part.id}/request`, {
                amount,
                notes: `Mechanic requested restock for ${part.name} (${part.sku})`
            });
            setMessage(`Restock requested for ${part.name}.`);
        } catch (error) {
            console.error('Error requesting restock:', error);
            setMessage('Failed to submit restock request.');
        } finally {
            setRequestingIds((prev) => {
                const next = new Set(prev);
                next.delete(part.id);
                return next;
            });
        }
    };

    const requestAllLowStock = async () => {
        if (lowStockParts.length === 0) {
            setMessage('No low stock items to request.');
            return;
        }

        setMessage('');
        const ids = new Set(lowStockParts.map((p) => p.id));
        setRequestingIds(ids);

        try {
            await Promise.all(lowStockParts.map((part) => {
                const amount = Math.max((Number(part.maxStock || 0) - Number(part.stock || 0)), 1);
                return api.post(`/inventory/${part.id}/request`, {
                    amount,
                    notes: `Mechanic bulk restock request for ${part.name} (${part.sku})`
                });
            }));
            setMessage('Restock requests submitted for low stock items.');
        } catch (error) {
            console.error('Error requesting bulk restock:', error);
            setMessage('Some requests failed. Please try again.');
        } finally {
            setRequestingIds(new Set());
        }
    };

    if (loading) {
        return (
            <div className="mechanic-parts__loading-wrap">
                <div className="mechanic-parts__spinner"></div>
            </div>
        );
    }

    return (
        <div className="mechanic-parts">
            <div className="mechanic-parts__container">
                <div className="mechanic-parts__header">
                    <div>
                        <h2 className="mechanic-parts__title">Parts Inventory</h2>
                        <div className="mechanic-parts__subtitle">{lowStockParts.length} items need attention</div>
                    </div>
                    <button className="mechanic-parts__restock-btn" onClick={requestAllLowStock}>
                        + Request Restock
                    </button>
                </div>

                {message && <div className="mechanic-parts__feedback">{message}</div>}

                <div className="mechanic-parts__section-label">⚠ Low Stock</div>
                <div className="mechanic-parts__low-stock-grid">
                    {lowStockParts.length === 0 ? (
                        <div className="mechanic-parts__empty">No low stock parts right now.</div>
                    ) : (
                        lowStockParts.map((part) => {
                            const status = normalizeStatus(part);
                            return (
                                <InventoryCard
                                    key={part.id}
                                    name={part.name}
                                    sku={part.sku}
                                    count={String(part.stock)}
                                    unit={`${part.unit} left`}
                                    prog={toProgress(part)}
                                    status={status}
                                    requesting={requestingIds.has(part.id)}
                                    onRequest={() => requestRestock(part)}
                                />
                            );
                        })
                    )}
                </div>

                <div className="mechanic-parts__section-label">All Parts</div>
                <div className="mechanic-parts__all-grid">
                    {allParts.map((part) => {
                        const status = normalizeStatus(part);
                        return (
                            <InventoryCard
                                key={part.id}
                                name={part.name}
                                sku={part.sku}
                                count={String(part.stock)}
                                unit={part.unit}
                                prog={toProgress(part)}
                                status={status}
                                requesting={requestingIds.has(part.id)}
                                onRequest={() => requestRestock(part)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const InventoryCard = ({ name, sku, count, unit, prog, status, requesting, onRequest }) => {
    const widthMap = {
        0: 'mechanic-parts__progress-fill--w0',
        5: 'mechanic-parts__progress-fill--w5',
        10: 'mechanic-parts__progress-fill--w10',
        15: 'mechanic-parts__progress-fill--w15',
        20: 'mechanic-parts__progress-fill--w20',
        25: 'mechanic-parts__progress-fill--w25',
        30: 'mechanic-parts__progress-fill--w30',
        35: 'mechanic-parts__progress-fill--w35',
        40: 'mechanic-parts__progress-fill--w40',
        45: 'mechanic-parts__progress-fill--w45',
        50: 'mechanic-parts__progress-fill--w50',
        55: 'mechanic-parts__progress-fill--w55',
        60: 'mechanic-parts__progress-fill--w60',
        65: 'mechanic-parts__progress-fill--w65',
        70: 'mechanic-parts__progress-fill--w70',
        75: 'mechanic-parts__progress-fill--w75',
        80: 'mechanic-parts__progress-fill--w80',
        85: 'mechanic-parts__progress-fill--w85',
        90: 'mechanic-parts__progress-fill--w90',
        95: 'mechanic-parts__progress-fill--w95',
        100: 'mechanic-parts__progress-fill--w100'
    };
    const rounded = Math.max(0, Math.min(100, Math.round((prog || 0) / 5) * 5));

    return (
        <div className="mechanic-parts__card">
            <div className="mechanic-parts__card-title">{name}</div>
            <div className="mechanic-parts__card-sku">{sku}</div>
            <div className="mechanic-parts__progress-track">
                <div className={`mechanic-parts__progress-fill mechanic-parts__progress-fill--dynamic mechanic-parts__progress-fill--${status.toLowerCase()} ${widthMap[rounded] || 'mechanic-parts__progress-fill--w0'}`}></div>
            </div>
            <div className="mechanic-parts__card-bottom">
                <div>
                    <div className={`mechanic-parts__count mechanic-parts__count--${status.toLowerCase()}`}>{count}</div>
                    <div className="mechanic-parts__unit">{unit}</div>
                </div>
                <div className="mechanic-parts__actions">
                    {status === 'Critical' && <span className="mechanic-parts__tag mechanic-parts__tag--critical">Critical</span>}
                    {status === 'Low' && <span className="mechanic-parts__tag mechanic-parts__tag--low">Low</span>}
                    <button className="mechanic-parts__request-btn" onClick={onRequest} disabled={requesting}>
                        {requesting ? 'Sending...' : 'Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MechanicParts;

