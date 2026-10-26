import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { formatRupiah } from '../utils/format.js';
import { useLanguage } from '../components/LanguageContext.jsx';

const paymentMethods = ['Bank transfer (demo)', 'E-wallet (demo)'];

export default function PaymentPage({ user, orders, onSavePaymentDraft, onCompletePayment }) {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const order = useMemo(() => Array.isArray(orders)
    ? orders.find((item) => item.id === orderId && item.clientId === user.id)
    : null, [orders, orderId, user.id]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState(order?.paymentDraft?.method || 'Bank transfer (demo)');
  const [payerName, setPayerName] = useState(order?.paymentDraft?.payerName || user.displayName);
  const [submitting, setSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    setError('');
    const timer = window.setTimeout(() => {
      if (!Array.isArray(orders)) setError('Payment details could not be loaded. Please refresh and try again.');
      setLoading(false);
    }, 300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!draftSaved) return undefined;
    const timer = window.setTimeout(() => setDraftSaved(false), 3500);
    return () => window.clearTimeout(timer);
  }, [draftSaved]);

  if (user.role !== 'client') return <Navigate to="/dashboard" replace />;
  if (order?.paymentStatus === 'Paid') return <Navigate to={`/order-confirmation?orderId=${encodeURIComponent(order.id)}`} replace />;

  function saveDraft(changes) {
    const nextDraft = {
      method: changes.method ?? method,
      payerName: changes.payerName ?? payerName,
    };
    try {
      const saveError = onSavePaymentDraft(orderId, nextDraft);
      if (saveError) setError(saveError);
      else {
        setError('');
        setDraftSaved(true);
      }
    } catch {
      setDraftSaved(false);
      setError('Your payment details could not be saved. Please try again.');
    }
  }

  function submitPayment(event) {
    event.preventDefault();
    setError('');
    const cleanName = payerName.trim();
    if (!paymentMethods.includes(method)) {
      setError('Choose a payment method from the list.');
      return;
    }
    if (cleanName.length < 2 || cleanName.length > 60) {
      setError('Enter a payer name between 2 and 60 characters.');
      return;
    }

    setSubmitting(true);
    setDraftSaved(false);
    try {
      const paymentError = onCompletePayment(orderId, { method, payerName: cleanName });
      if (paymentError) {
        setError(paymentError);
        setSubmitting(false);
        return;
      }
    } catch {
      setError('Payment could not be completed. Your order is saved, so you can try again.');
      setSubmitting(false);
      return;
    }
    navigate(`/order-confirmation?orderId=${encodeURIComponent(orderId)}`);
  }

  return <section>
    <div className="page-heading">
      <div><p className="eyebrow">{t('Checkout step 2')}</p><h1>{t('Payment')}</h1><p className="muted">{t('Choose how you would like to pay for this order.')}</p></div>
    </div>
    {loading && <p className="message">{t('Loading payment details…')}</p>}
    {!loading && (!order || order.status === 'Cancelled') && <div className="message message-error" role="alert">
      <p>{error || (order?.status === 'Cancelled' ? 'Cancelled orders cannot be paid.' : 'This unpaid order could not be found in your account.')}</p>
      <Link className="text-link" to="/profile">Return to your orders</Link>
    </div>}
    {!loading && order && order.status !== 'Cancelled' && <div className="payment-layout">
      <form className="payment-card" onSubmit={submitPayment}>
        <p className="eyebrow">{t('Payment information')}</p>
        <label htmlFor="payment-method">{t('Payment method')}</label>
        <select id="payment-method" value={method} onChange={(event) => {
          setMethod(event.target.value);
          saveDraft({ method: event.target.value });
        }}>
          {paymentMethods.map((option) => <option key={option}>{option}</option>)}
        </select>
        <label htmlFor="payer-name">{t('Name for payment')}</label>
        <input id="payer-name" value={payerName} minLength="2" maxLength="60" autoComplete="name" required onChange={(event) => {
          setPayerName(event.target.value);
          saveDraft({ payerName: event.target.value });
        }} />
        <p className="payment-demo-note" role="note">{t('Demo payment only. No real payment is processed. Do not enter card numbers, passwords, or banking credentials.')}</p>
        {draftSaved && <div className="cart-toast payment-save-toast" role="status" aria-live="polite">{t('Payment details saved in this browser. You can leave and continue payment later.')}</div>}
        {error && <p className="message message-error" role="alert">{t(error)}</p>}
        <button className="button button-primary button-full" disabled={submitting} type="submit">{submitting ? t('Completing payment…') : t('Complete demo payment')}</button>
      </form>
      <aside className="payment-summary">
        <p className="eyebrow">{t('Order summary')}</p><h2>{t('Order ')}{order.id}</h2>
        <ul className="checkout-items">
          {order.items.map((item, index) => <li key={`${order.id}-${index}`}><span>{item.quantity} × {item.name}</span><span>{formatRupiah(item.price * item.quantity)}</span></li>)}
        </ul>
        <div className="checkout-total"><span>{t('Total due')}</span><strong>{formatRupiah(order.total)}</strong></div>
        <p className="muted small-text">{t('You can leave this page and resume payment from your profile orders.')}</p>
      </aside>
    </div>}
  </section>;
}
