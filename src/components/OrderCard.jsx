import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatRupiah } from '../utils/format.js';
import { getPaymentTimeRemaining } from '../utils/orderHelpers.js';
import ConfirmationModal from './ConfirmationModal.jsx';
import { useLanguage } from './LanguageContext.jsx';

export default function OrderCard({ order, isAdmin = false, onUpdateOrderStatus, onCancelOrder, onResumePayment }) {
  const { t, language } = useLanguage();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [clock, setClock] = useState(Date.now());
  const paymentTimerActive = order.paymentStatus === 'Unpaid' && order.status !== 'Cancelled';
  const paymentRemaining = getPaymentTimeRemaining(order, clock);
  const visibleItems = order.items.slice(0, 2);
  const additionalItems = order.items.slice(2);

  useEffect(() => {
    if (!paymentTimerActive) return undefined;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [paymentTimerActive]);

  const remainingSeconds = paymentRemaining === null ? null : Math.ceil(paymentRemaining / 1000);
  const countdown = remainingSeconds === null ? '' : `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`;

  function changeStatus(event) {
    setActionError('');
    const result = onUpdateOrderStatus(order.id, event.target.value);
    if (result) setActionError(result);
  }

  function confirmCancellation() {
    setActionError('');
    const result = onCancelOrder(order.id);
    if (result) {
      setActionError(result);
      setCancelOpen(false);
      return;
    }
    setCancelOpen(false);
  }

  return <article className="order-card">
    {cancelOpen && <ConfirmationModal
      title="Cancel this order?"
      message={`Order ${order.id} will be cancelled. This action is available only while the order is pending.`}
      confirmLabel="Cancel order"
      onConfirm={confirmCancellation}
      onCancel={() => setCancelOpen(false)}
    />}
    <div className="order-card-header">
      <div className="order-card-meta">
        <p className="order-id">Order {order.id}</p>
        {isAdmin && <p className="small-text muted">{order.clientName || 'Customer'}</p>}
        <p className="muted small-text">{formatDate(order.createdAt, language)}</p>
      </div>
      <div className="order-status-row">
        {isAdmin && order.status !== 'Cancelled' ? (
          <select
            className="dashboard-status"
            value={order.status}
            aria-label={`Status for ${order.id}`}
            onChange={changeStatus}
          >
            <option value="Pending">{t('Pending')}</option>
            <option value="Preparing">{t('Preparing')}</option>
            <option value="Ready">{t('Ready')}</option>
            <option value="Done">{t('Done')}</option>
          </select>
        ) : (
          <span className={`status status-${order.status.toLowerCase()}`}>
            {t(order.status)}
          </span>
        )}
      </div>
    </div>
    <p className="fulfillment-detail">
      <span className={`fulfillment-badge ${order.serviceType === 'Delivery' ? 'fulfillment-delivery' : order.serviceType === 'Pickup' ? 'fulfillment-pickup' : ''}`}>
        {t(order.serviceType || 'Fulfillment not recorded')}
      </span>
      {order.serviceType === 'Delivery' && order.address && <span className="fulfillment-address">{order.address}</span>}
    </p>
    {!isAdmin && order.cancellationReason === 'Payment window expired' && <p className="payment-expired-note">{t('Cancelled because payment was not completed within 15 minutes.')}</p>}
    <div className="order-card-content">
      {order.paymentStatus && <div className="payment-state-row">
        <span className={`status payment-status payment-${order.paymentStatus.toLowerCase()}`}>{t('Payment {status}', { status: t(order.paymentStatus) })}</span>
        {order.paymentMethod && <span className="muted small-text">{order.paymentMethod}</span>}
        {paymentRemaining !== null && <span className="payment-countdown">{t('Auto-cancels in {time}', { time: countdown })}</span>}
      </div>}
      <ul className="order-items">
        {visibleItems.map((item, index) => (
          <li key={`${order.id}-${index}`}>
            <span>{item.quantity} × {item.name}</span>
            <span>{formatRupiah(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      {additionalItems.length > 0 && <details className="order-items-more">
        <summary>{t('Show {count} more dishes', { count: additionalItems.length })}</summary>
        <ul className="order-items order-items-scroll">
          {additionalItems.map((item, index) => (
            <li key={`${order.id}-additional-${index}`}>
              <span>{item.quantity} × {item.name}</span>
              <span>{formatRupiah(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </details>}
      <div className="order-total">
        <span>Total</span>
        <strong>{formatRupiah(order.total)}</strong>
      </div>
      {actionError && <p className="message message-error order-action-message" role="alert">{actionError}</p>}
    </div>
    {((!isAdmin && order.paymentStatus === 'Unpaid' && order.status !== 'Cancelled' && onResumePayment)
      || (!isAdmin && order.status === 'Pending' && order.paymentStatus !== 'Paid' && onCancelOrder)) && (
      <div className="order-card-actions">
        {!isAdmin && order.paymentStatus === 'Unpaid' && order.status !== 'Cancelled' && onResumePayment && (
          <Link className="button button-primary resume-payment" to={`/payment?orderId=${encodeURIComponent(order.id)}`}>Continue payment</Link>
        )}
        {!isAdmin && order.status === 'Pending' && order.paymentStatus !== 'Paid' && onCancelOrder && (
          <button
            className="button button-secondary order-cancel-button"
            type="button"
            onClick={() => { setActionError(''); setCancelOpen(true); }}
          >
            Cancel pending order
          </button>
        )}
      </div>
    )}
    <details className="order-history">
      <summary>Status history</summary>
      <ol>
        {(order.statusHistory?.length ? order.statusHistory : [{ status: order.status, changedAt: order.createdAt }])
          .map((entry, index) => <li key={`${entry.status}-${entry.changedAt}-${index}`}>
            <strong>{t(entry.status)}</strong>
            <time dateTime={entry.changedAt}>{formatDate(entry.changedAt, language)}</time>
            {entry.changedBy && <span>by {entry.changedBy}</span>}
          </li>)}
      </ol>
    </details>
  </article>;
}
