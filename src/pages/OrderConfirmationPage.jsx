import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { formatDate, formatRupiah } from '../utils/format.js';
import { useLanguage } from '../components/LanguageContext.jsx';

export default function OrderConfirmationPage({ user, orders }) {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const receiptOrder = useMemo(() => {
    if (!Array.isArray(orders) || !orderId) return null;
    return orders.find((order) => order.id === orderId && order.clientId === user.id) || null;
  }, [orders, orderId, user.id]);

  useEffect(() => {
    setError('');
    const timer = window.setTimeout(() => {
      if (!Array.isArray(orders)) setError('Order information could not be loaded. Please refresh the page.');
      else if (!orderId || !receiptOrder) setError('This order receipt could not be found. Check your order history.');
      setLoading(false);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [orders, orderId, receiptOrder]);

  if (user.role !== 'client') return <Navigate to="/dashboard" replace />;

  function confirmationTitle(order) {
    if (order.paymentStatus === 'Unpaid') return 'Payment still needed';
    if (order.status === 'Cancelled') return 'Order cancelled';
    if (order.paymentStatus === 'Paid') return 'Payment received';
    return 'Your order is confirmed';
  }

  function confirmationMessage(order) {
    if (order.paymentStatus === 'Unpaid') return 'Your order is saved. Complete payment to send it to the kitchen.';
    if (order.status === 'Cancelled') return 'This order was cancelled. Contact the restaurant if you need help.';
    if (order.status === 'Done') return 'Your order is complete. Thank you for choosing Kuro Neko.';
    if (order.paymentStatus === 'Paid') return `Payment is complete. Your order is currently ${order.status.toLowerCase()}.`;
    return 'Keep this receipt to check your order details and status.';
  }

  const paymentReceived = receiptOrder?.paymentStatus === 'Paid';

  return <section className="order-confirmation-page">
    <div className={`order-confirmation-intro${paymentReceived ? ' payment-received-intro' : ''}`}>
      {paymentReceived && <svg className="payment-success-check" viewBox="0 0 72 72" role="img" aria-label="Payment successful">
        <circle className="payment-success-circle" cx="36" cy="36" r="31" />
        <path className="payment-success-tick" d="M20 37.5 30.5 48 52 25" />
      </svg>}
      {!paymentReceived && <h1>{receiptOrder ? confirmationTitle(receiptOrder) : 'Order details'}</h1>}
      {paymentReceived && <h1>Payment received</h1>}
      {receiptOrder && !paymentReceived && <p className="muted">{confirmationMessage(receiptOrder)}</p>}
      {!receiptOrder && <p className="muted">Keep this receipt to check your order details and status.</p>}
    </div>

    {loading && <p className="message">Preparing your receipt…</p>}
    {!loading && error && <div className="message message-error" role="alert">
      <p>{error}</p><Link className="text-link" to="/profile">Open your profile</Link>
    </div>}
    {!loading && !error && receiptOrder && <article className="receipt-card">
      <div className="receipt-heading">
        <div><p className="eyebrow">Receipt</p><h2>Order {receiptOrder.id}</h2></div>
        <span className={`status status-${receiptOrder.status.toLowerCase()}`}>{receiptOrder.status}</span>
      </div>
      <dl className="receipt-details">
        <div><dt>Placed</dt><dd>{formatDate(receiptOrder.createdAt, language)}</dd></div>
        <div><dt>Payment status</dt><dd>{receiptOrder.paymentStatus || 'Not recorded'}</dd></div>
        {receiptOrder.paymentMethod && <div><dt>Payment method</dt><dd>{receiptOrder.paymentMethod}</dd></div>}
        {receiptOrder.payerName && <div><dt>Paid by</dt><dd>{receiptOrder.payerName}</dd></div>}
        {receiptOrder.paidAt && <div><dt>Paid</dt><dd>{formatDate(receiptOrder.paidAt, language)}</dd></div>}
        <div><dt>Fulfillment</dt><dd>{receiptOrder.serviceType}</dd></div>
        {receiptOrder.serviceType === 'Delivery' && <div><dt>Delivery address</dt><dd>{receiptOrder.address || 'No address was saved'}</dd></div>}
        {receiptOrder.notes && <div><dt>Order notes</dt><dd>{receiptOrder.notes}</dd></div>}
      </dl>
      <details className="order-history" open>
        <summary>Status history</summary>
        <ol>
          {(receiptOrder.statusHistory?.length ? receiptOrder.statusHistory : [{ status: receiptOrder.status, changedAt: receiptOrder.createdAt }])
            .map((entry, index) => <li key={`${entry.status}-${entry.changedAt}-${index}`}>
              <strong>{entry.status}</strong>
              <time dateTime={entry.changedAt}>{formatDate(entry.changedAt, language)}</time>
              {entry.changedBy && <span>by {entry.changedBy}</span>}
            </li>)}
        </ol>
      </details>
      <h3>Items</h3>
      <ul className="receipt-items">
        {receiptOrder.items.map((item, index) => <li key={`${receiptOrder.id}-${index}`}>
          <span>{item.quantity} × {item.name}</span><span>{formatRupiah(item.price * item.quantity)}</span>
        </li>)}
      </ul>
      <div className="order-total"><span>Total</span><strong>{formatRupiah(receiptOrder.total)}</strong></div>
      <div className="receipt-actions">
        {receiptOrder.paymentStatus === 'Unpaid' && <Link className="button button-primary" to={`/payment?orderId=${encodeURIComponent(receiptOrder.id)}`}>Continue payment</Link>}
        <Link className="button button-primary" to="/orders">View order status</Link>
        <Link className="button button-secondary" to="/menu">Order more</Link>
      </div>
    </article>}
  </section>;
}
