import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import './CustomerCart.css';

const CART_STORAGE_KEY = 'autoassist_customer_parts_cart';

const CustomerCart = () => {
  const navigate = useNavigate();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [message, setMessage] = useState('');
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

  useEffect(() => {
    const fetchParts = async () => {
      try {
        setLoading(true);
        const res = await api.get('/inventory');
        setParts(res.data || []);
      } catch (error) {
        console.error('Error loading cart parts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, []);

  const cartItems = useMemo(() => {
    return cart
      .map((row) => {
        const part = parts.find((p) => p.id === row.partId);
        if (!part) return null;
        return {
          ...row,
          part,
          maxQty: part.stock || 0,
          lineTotal: (part.price || 0) * row.quantity
        };
      })
      .filter(Boolean);
  }, [cart, parts]);

  const subtotal = cartItems.reduce((sum, row) => sum + row.lineTotal, 0);

  const changeQty = (partId, nextQty, maxQty) => {
    setCart((prev) => {
      if (nextQty <= 0) return prev.filter((row) => row.partId !== partId);
      return prev.map((row) => {
        if (row.partId !== partId) return row;
        return { ...row, quantity: Math.min(nextQty, maxQty) };
      });
    });
  };

  const clearCart = () => {
    setCart([]);
    setMessage('Cart cleared.');
  };

  const checkout = async () => {
    if (cartItems.length === 0) return;

    try {
      setCheckoutBusy(true);
      setMessage('Initiating Khalti...');

      const payload = {
        mode: 'parts',
        items: cartItems.map((row) => ({
          partId: row.partId,
          quantity: row.quantity
        }))
      };

      const res = await api.post('/payment/initiate', payload);
      if (res.data?.payment_url) {
        window.location.href = res.data.payment_url;
        return;
      }

      throw new Error('Failed to get payment URL');
    } catch (error) {
      const errText = error?.response?.data?.error || 'Checkout failed';
      setMessage(errText);
      setCheckoutBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="customer-cart__loading">
        <div className="customer-cart__spinner"></div>
      </div>
    );
  }

  return (
    <div className="customer-cart">
      <div className="customer-cart__header">
        <div>
          <h2>Shopping Cart</h2>
          <p>Review your selected parts and complete secure payment.</p>
        </div>
        <button className="customer-cart__back-btn" onClick={() => navigate('/customer/inventory')}>
          Back to Inventory
        </button>
      </div>

      {cartItems.length === 0 ? (
        <div className="customer-cart__empty">
          <h3>Your cart is empty</h3>
          <p>Add parts from inventory to continue.</p>
          <button className="customer-cart__shop-btn" onClick={() => navigate('/customer/inventory')}>
            Browse Parts
          </button>
        </div>
      ) : (
        <>
          <div className="customer-cart__list">
            {cartItems.map((row) => (
              <article key={row.partId} className="customer-cart__item">
                <div className="customer-cart__item-main">
                  <h4>{row.part.name}</h4>
                  <p>{row.part.sku} - {row.part.category || 'Part'}</p>
                  <span>Rs. {(row.part.price || 0).toLocaleString()} each</span>
                </div>

                <div className="customer-cart__item-controls">
                  <div className="customer-cart__qty-wrap">
                    <button onClick={() => changeQty(row.partId, row.quantity - 1, row.maxQty)}>-</button>
                    <strong>{row.quantity}</strong>
                    <button onClick={() => changeQty(row.partId, row.quantity + 1, row.maxQty)}>+</button>
                  </div>
                  <div className="customer-cart__line-total">Rs. {row.lineTotal.toLocaleString()}</div>
                </div>
              </article>
            ))}
          </div>

          <div className="customer-cart__summary">
            <div>
              <div className="customer-cart__summary-label">Total</div>
              <div className="customer-cart__summary-total">Rs. {subtotal.toLocaleString()}</div>
            </div>

            <div className="customer-cart__summary-actions">
              <button className="customer-cart__clear-btn" onClick={clearCart}>Clear Cart</button>
              <button className="customer-cart__checkout-btn" onClick={checkout} disabled={checkoutBusy}>
                {checkoutBusy ? 'Processing payment...' : 'Pay with Khalti'}
              </button>
            </div>
          </div>
        </>
      )}

      {message && <div className="customer-cart__message">{message}</div>}
    </div>
  );
};

export default CustomerCart;

