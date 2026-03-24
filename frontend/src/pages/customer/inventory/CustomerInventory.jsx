import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import './CustomerInventory.css';

const CART_STORAGE_KEY = 'autoassist_customer_parts_cart';

const CustomerInventory = () => {
    const navigate = useNavigate();
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [sortBy, setSortBy] = useState('featured');
    const [cart, setCart] = useState(() => {
        try {
            const raw = localStorage.getItem(CART_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }, [cart]);

    const fetchParts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/inventory');
            setParts(res.data || []);
        } catch (error) {
            console.error('Error loading parts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParts();
    }, []);

    const filteredParts = useMemo(() => {
        const filtered = parts.filter((part) => {
            const matchesSearch = [part.name, part.sku, part.category]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(search.toLowerCase());

            if (!matchesSearch) return false;

            if (status === 'available') return (part.stock || 0) > 0;
            if (status === 'low') return (part.stock || 0) > 0 && (part.stock || 0) <= (part.minStock || 5);
            if (status === 'out') return (part.stock || 0) <= 0;
            return true;
        });

        return [...filtered].sort((a, b) => {
            if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
            if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
            if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
            if (sortBy === 'stock-high') return (b.stock || 0) - (a.stock || 0);

            const aStock = a.stock || 0;
            const bStock = b.stock || 0;
            const aLow = aStock > 0 && aStock <= (a.minStock || 5);
            const bLow = bStock > 0 && bStock <= (b.minStock || 5);

            if (aStock > 0 && bStock <= 0) return -1;
            if (aStock <= 0 && bStock > 0) return 1;
            if (aLow && !bLow) return -1;
            if (!aLow && bLow) return 1;
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [parts, search, status, sortBy]);

    const getCartQty = (partId) => cart.find((c) => c.partId === partId)?.quantity || 0;

    const addToCart = (part) => {
        const stock = part.stock || 0;
        if (stock <= 0) return;

        setCart((prev) => {
            const found = prev.find((row) => row.partId === part.id);
            if (found) return prev;
            return [...prev, { partId: part.id, quantity: 1 }];
        });
    };

    const cartItemsCount = cart.reduce((sum, row) => sum + (row.quantity || 0), 0);
    const inStockCount = parts.filter((part) => (part.stock || 0) > 0).length;
    const lowStockCount = parts.filter((part) => (part.stock || 0) > 0 && (part.stock || 0) <= (part.minStock || 5)).length;

    if (loading) {
        return (
            <div className="customer-inventory__loading">
                <div className="customer-inventory__spinner"></div>
            </div>
        );
    }

    return (
        <div className="customer-inventory">
            <div className="customer-inventory__left">
                <div className="customer-inventory__header">
                    <div>
                        <h2 className="customer-inventory__title">Parts Marketplace</h2>
                        <p className="customer-inventory__subtitle">Buy original parts directly and pay securely from your cart.</p>
                    </div>
                    <div className="customer-inventory__stats">
                        <span>{inStockCount} In Stock</span>
                        <span>{lowStockCount} Low Stock</span>
                        <button
                            className="customer-inventory__cart-link"
                            onClick={() => navigate('/customer/cart')}
                        >
                            Cart ({cartItemsCount})
                        </button>
                    </div>
                </div>

                <div className="customer-inventory__toolbar">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search parts, SKU, or category..."
                        className="customer-inventory__search"
                    />
                    <div className="customer-inventory__controls">
                        <select className="customer-inventory__filter" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="available">Available</option>
                            <option value="low">Low Stock</option>
                            <option value="out">Out of Stock</option>
                        </select>
                        <select className="customer-inventory__filter" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="featured">Sort: Featured</option>
                            <option value="price-low">Sort: Price Low to High</option>
                            <option value="price-high">Sort: Price High to Low</option>
                            <option value="name-asc">Sort: Name A-Z</option>
                            <option value="name-desc">Sort: Name Z-A</option>
                            <option value="stock-high">Sort: Stock High to Low</option>
                        </select>
                    </div>
                </div>

                <div className="customer-inventory__grid">
                    {filteredParts.map((part) => {
                        const stock = part.stock || 0;
                        const inCart = getCartQty(part.id);
                        const canAdd = stock > inCart;

                        const isLowStock = stock > 0 && stock <= (part.minStock || 5);
                        return (
                            <article key={part.id} className={`customer-inventory__card ${isLowStock ? 'is-low-stock-alert' : ''}`}>
                                <div className="customer-inventory__card-head">
                                    <div className="customer-inventory__card-title-section">
                                        <h3>{part.name}</h3>
                                        {isLowStock && <span className="customer-inventory__warning-badge">⚠ Low Stock</span>}
                                    </div>
                                    <span className={`customer-inventory__status ${stock <= 0 ? 'is-out' : stock <= (part.minStock || 5) ? 'is-low' : 'is-ok'}`}>
                                        {stock <= 0 ? 'Out' : stock <= (part.minStock || 5) ? 'Low' : 'In Stock'}
                                    </span>
                                </div>
                                <p className="customer-inventory__meta">{part.sku} · {part.category || 'Part'}</p>
                                <p className="customer-inventory__price">Rs. {(part.price || 0).toLocaleString()}</p>
                                <p className="customer-inventory__stock">Stock: {stock} {part.unit || 'units'}</p>
                                <button
                                    className="customer-inventory__add-btn"
                                    onClick={() => {
                                        addToCart(part);
                                        navigate('/customer/cart');
                                    }}
                                    disabled={!canAdd}
                                >
                                    {canAdd ? 'Add to Cart' : 'Out of Stock'}
                                </button>
                            </article>
                        );
                    })}
                    {filteredParts.length === 0 && (
                        <div className="customer-inventory__empty">No parts found.</div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default CustomerInventory;

