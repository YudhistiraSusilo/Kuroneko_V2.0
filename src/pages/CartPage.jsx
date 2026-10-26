import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatRupiah } from '../utils/format.js';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import ImagePlaceholder from '../components/ImagePlaceholder.jsx';
import { useLanguage } from '../components/LanguageContext.jsx';

export default function CartPage({ user, menu, cart, onChangeQuantity, onPlaceOrder }) {
  const { t } = useLanguage();
  const initialSavedAddresses = Array.isArray(user.addresses) ? user.addresses : [];
  const initialMainAddress = initialSavedAddresses.find((item) => item.id === user.defaultAddressId)
    || initialSavedAddresses.find((item) => item.isDefault)
    || initialSavedAddresses[0];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressNotice, setAddressNotice] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [serviceType, setServiceType] = useState('Pickup');
  const [address, setAddress] = useState(() => initialMainAddress?.address || '');
  const [selectedAddressId, setSelectedAddressId] = useState(() => initialMainAddress?.id || 'custom');
  const [notes, setNotes] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const addressInput = useRef(null);
  const notesInput = useRef(null);
  const navigate = useNavigate();
  const cartDishes = useMemo(() => cart.map((cartItem) => ({
    ...cartItem,
    dish: menu.find((item) => item.id === cartItem.menuItemId),
  })).filter((item) => item.dish && item.dish.available), [cart, menu]);
  const total = cartDishes.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  const savedAddresses = Array.isArray(user.addresses) ? user.addresses : [];
  const mainAddressId = savedAddresses.find((item) => item.id === user.defaultAddressId)?.id
    || savedAddresses.find((item) => item.isDefault)?.id
    || savedAddresses[0]?.id;

  useEffect(() => {
    setError('');
    const timer = window.setTimeout(() => {
      if (!Array.isArray(cart) || !Array.isArray(menu)) setError('Your cart could not be loaded. Please try again.');
      setLoading(false);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [cart, menu]);

  // Let the delivery warning fade away without navigating or blocking checkout.
  useEffect(() => {
    if (!addressNotice) return undefined;
    const timer = window.setTimeout(() => setAddressNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [addressNotice]);

  useEffect(() => {
    const input = notesInput.current;
    if (!input) return;
    input.style.height = 'auto';
    const styles = window.getComputedStyle(input);
    const lineHeight = Number.parseFloat(styles.lineHeight) || 24;
    const padding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
    const maxHeight = lineHeight * 4 + padding;
    input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
    input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [notes]);

  function submitOrder(event) {
    event.preventDefault();
    setError('');
    setAddressNotice('');
    if (placingOrder) return;
    if (cartDishes.length === 0) {
      setError('Your cart is empty. Add an available dish from the menu first.');
      return;
    }
    if (cartDishes.some(({ dish, quantity }) => !Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(dish.price) || dish.price <= 0)) {
      setError('A dish quantity or price is invalid. Review the cart before placing your order.');
      return;
    }
    if (serviceType === 'Delivery' && !address.trim()) {
      setAddressNotice('Please enter a delivery address before continuing.');
      addressInput.current?.focus();
      return;
    }

    // Copy dish details into the order so later menu edits do not change old receipts.
    const order = {
      id: `KN-${Date.now()}`,
      clientId: user.id,
      clientName: user.displayName,
      items: cartDishes.map(({ dish, quantity }) => ({ name: dish.name, quantity, price: dish.price })),
      total,
      status: 'Pending',
      statusHistory: [{ status: 'Pending', changedAt: new Date().toISOString(), changedBy: user.displayName }],
      paymentStatus: 'Unpaid',
      paymentDraft: { method: 'Bank transfer (demo)', payerName: user.displayName },
      createdAt: new Date().toISOString(),
      serviceType,
      address: serviceType === 'Delivery' ? address.trim() : '',
      notes: notes.trim(),
    };
    setPlacingOrder(true);
    try {
      const savedOrder = onPlaceOrder(order);
      if (!savedOrder?.id) throw new Error('The order could not be saved. Your cart has been kept; please try again.');
      navigate(`/payment?orderId=${encodeURIComponent(savedOrder.id)}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The order could not be placed. Please try again.');
      setPlacingOrder(false);
    }
  }

  function removeCartItem(dish) {
    setPendingRemoval(dish);
  }

  function confirmCartRemoval() {
    onChangeQuantity(pendingRemoval.id, 0);
    setPendingRemoval(null);
  }

  if (user.role !== 'client') {
    return <div className="empty-state"><h3>{t('Client access only')}</h3><p className="muted">{t('The cart is available to client accounts.')}</p></div>;
  }

  return <section className="cart-page">
    {addressNotice && <div key={addressNotice} className="cart-toast cart-toast-error" role="alert" aria-live="assertive">{addressNotice}</div>}
    {pendingRemoval && <ConfirmationModal
      className="cart-removal-confirmation"
      title={t('Remove this dish from your cart?')}
      message={`${pendingRemoval.name} will be removed from your cart. You can add it again from the menu while it is available.`}
      confirmLabel={t('Remove from cart')}
      onConfirm={confirmCartRemoval}
      onCancel={() => setPendingRemoval(null)}
    />}
    {loading && <p className="message">{t('Loading your cart…')}</p>}
    {!loading && error && <p className="message message-error" role="alert">{error}</p>}
    {!loading && !error && cartDishes.length === 0 && <div className="empty-state cart-empty-state"><span className="empty-icon">お</span><h3>{t('Your cart is empty')}</h3><p className="muted">{t('Your cart is resting for now. Unavailable dishes have returned to the kitchen.')}</p><Link className="button button-primary" to="/menu">{t('Browse menu')}</Link></div>}
    {!loading && !error && cartDishes.length > 0 && <form className="cart-layout" onSubmit={submitOrder}>
      <div className="cart-items">
        {cartDishes.map(({ dish, quantity }) => <article className="cart-row" key={dish.id}>
          <ImagePlaceholder className="cart-picture" label={`${dish.name} image`} src={dish.picture} />
          <div className="cart-item-info"><span className="dish-category">{dish.category}</span><h2>{dish.name}</h2></div>
          <label className="quantity-input"><span>{t('Qty')}</span><input type="number" min="1" value={quantity} onChange={(event) => onChangeQuantity(dish.id, Math.max(1, Number(event.target.value) || 1))} /></label>
          <strong className="cart-line-total">{formatRupiah(dish.price * quantity)}</strong>
          <button className="button button-quiet danger-text" type="button" onClick={() => removeCartItem(dish)}>{t('Remove')}</button>
        </article>)}
      </div>
      <aside className="checkout-card">
        <p className="eyebrow">{t('Order details')}</p><h2>{t('Checkout')}</h2>
        <label>{t('Fulfillment')}<select value={serviceType} onChange={(event) => setServiceType(event.target.value)}><option>{t('Pickup')}</option><option>{t('Delivery')}</option></select></label>
        {serviceType === 'Delivery' && savedAddresses.length > 0 && <label>{t('Saved address')}<select value={selectedAddressId} onChange={(event) => {
          const nextId = event.target.value;
          setSelectedAddressId(nextId);
          const selectedAddress = savedAddresses.find((item) => item.id === nextId);
          setAddress(selectedAddress?.address || '');
        }}><option value="custom">{t('Enter a different address')}</option>{savedAddresses.map((item) => <option key={item.id} value={item.id}>{item.id === mainAddressId ? `${item.label} — ${t('Main address')} — ${item.address}` : `${item.label} — ${item.address}`}</option>)}</select></label>}
        {serviceType === 'Delivery' && savedAddresses.length === 0 && <span className="muted small-text">You can save addresses on your <Link className="text-link" to="/profile">profile</Link> for faster checkout.</span>}
        {serviceType === 'Delivery' && (selectedAddressId === 'custom' || !savedAddresses.some((item) => item.id === selectedAddressId)) && <label htmlFor="delivery-address">Delivery address<textarea ref={addressInput} id="delivery-address" rows="3" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street, building, and area" aria-describedby="delivery-address-hint" /></label>}
        {serviceType === 'Delivery' && selectedAddressId !== 'custom' && savedAddresses.find((item) => item.id === selectedAddressId) && <p className="saved-checkout-address"><strong>Delivering to:</strong> {savedAddresses.find((item) => item.id === selectedAddressId).address}</p>}
        {serviceType === 'Delivery' && <span id="delivery-address-hint" className="muted small-text">Enter the address where your order should be delivered.</span>}
        <div className="checkout-notes-field"><label className="checkout-notes-label" htmlFor="order-notes"><span>Order notes</span><span className="muted">(optional)</span></label><textarea ref={notesInput} id="order-notes" rows="1" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything the kitchen should know?" /></div>
        <div className="cart-price-section">
          <h3>{t('Dish totals')}</h3>
          <ul className="checkout-items cart-price-list" aria-label={t('Dish totals')}>
          {cartDishes.map(({ dish, quantity }) => <li key={dish.id}><span>{dish.name} <small>× {quantity}</small></span><span>{formatRupiah(dish.price * quantity)}</span></li>)}
          </ul>
        </div>
        <div className="checkout-total"><span>{t('Total')}</span><strong>{formatRupiah(total)}</strong></div>
        {error && <p className="message message-error" role="alert">{error}</p>}
        <button className="button button-primary button-full desktop-checkout-submit" disabled={placingOrder}>{placingOrder ? t('Placing order…') : t('Place order')}</button>
      </aside>
      <div className="mobile-checkout-bar">
        <div><span className="small-text">{t('Total')}</span><strong>{formatRupiah(total)}</strong></div>
        <button className="button button-primary" type="submit" disabled={placingOrder}>{placingOrder ? t('Placing…') : t('Place order')}</button>
      </div>
    </form>}
  </section>;
}
