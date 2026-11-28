import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { formatRupiah } from '../utils/format.js';
import { useLanguage } from '../components/LanguageContext.jsx';

const paymentMethods = ['Bank transfer (demo)', 'E-wallet (demo)', 'Credit/Debit card (demo)'];
const CARD_METHOD = 'Credit/Debit card (demo)';

// A card is valid until the end of its printed month (MM/YY).
function cardExpiryIsValid(value) {
  const match = String(value || '').trim().match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return false;
  const monthAfterExpiry = new Date(2000 + Number(match[2]), month, 1);
  return monthAfterExpiry > new Date();
}

// Groups card-number digits as "1234 5678 9012 3456" (max 16 digits).
function formatCardNumber(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export default function PaymentPage({ user, orders, ordersLoading = false, ordersError = '', onCompletePayment }) {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const order = useMemo(() => Array.isArray(orders)
    ? orders.find((item) => String(item.id) === orderId && item.clientId === user.id)
    : null, [orders, orderId, user.id]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState(order?.paymentDraft?.method || 'Bank transfer (demo)');
  const [payerName, setPayerName] = useState(order?.paymentDraft?.payerName || user.displayName);
  const [submitting, setSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [declinedReason, setDeclinedReason] = useState('');

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

  function saveDraft() {
    setError('');
    setDraftSaved(true);
  }

  async function submitPayment(event) {
    event.preventDefault();
    setError('');
    setDeclinedReason('');
    const cleanName = payerName.trim();
    if (!paymentMethods.includes(method)) {
      setError('Choose a payment method from the list.');
      return;
    }
    if (cleanName.length < 2 || cleanName.length > 60) {
      setError('Enter a payer name between 2 and 60 characters.');
      return;
    }

    const payload = { method, payerName: cleanName };
    if (method === CARD_METHOD) {
      const digits = cardNumber.replace(/[\s-]/g, '');
      if (!/^\d{16}$/.test(digits)) {
        setError('Enter a 16-digit card number.');
        return;
      }
      if (!cardExpiryIsValid(cardExpiry)) {
        setError('Enter a valid future card expiry date (MM/YY).');
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvv.trim())) {
        setError('Enter a 3- or 4-digit security code (CVV).');
        return;
      }
      payload.cardNumber = digits;
      payload.cardExpiry = cardExpiry.trim();
      payload.cardCvv = cardCvv.trim();
    }

    setSubmitting(true);
    setDraftSaved(false);
    try {
      await onCompletePayment(orderId, payload);
    } catch (paymentError) {
      if (paymentError.status === 402) {
        setDeclinedReason(paymentError.message || 'Payment declined');
      } else {
        setError(paymentError.message || 'Payment could not be completed. Your order is saved, so you can try again.');
      }
      setSubmitting(false);
      return;
    }
    navigate(`/order-confirmation?orderId=${encodeURIComponent(orderId)}`);
  }

  return <section>
    <div className="page-heading">
      <div><p className="eyebrow">{t('Checkout step 2')}</p><h1>{t('Payment')}</h1><p className="muted">{t('Choose how you would like to pay for this order.')}</p></div>
    </div>
    {(loading || ordersLoading) && <p className="message">{t('Loading payment details…')}</p>}
    {!loading && !ordersLoading && (!order || order.status === 'Cancelled') && <div className="message message-error" role="alert">
      <p>{error || ordersError || (order?.status === 'Cancelled' ? 'Cancelled orders cannot be paid.' : 'This unpaid order could not be found in your account.')}</p>
      <Link className="text-link" to="/profile">Return to your orders</Link>
    </div>}
    {!loading && !ordersLoading && order && order.status !== 'Cancelled' && <div className="payment-layout">
      <form className="payment-card" onSubmit={submitPayment}>
        <p className="eyebrow">{t('Payment information')}</p>
        <label htmlFor="payment-method">{t('Payment method')}</label>
        <select id="payment-method" value={method} onChange={(event) => {
          setMethod(event.target.value);
          saveDraft();
        }}>
          {paymentMethods.map((option) => <option key={option}>{option}</option>)}
        </select>
        <label htmlFor="payer-name">{t('Name for payment')}</label>
        <input id="payer-name" value={payerName} minLength="2" maxLength="60" autoComplete="name" required onChange={(event) => {
          setPayerName(event.target.value);
          saveDraft();
        }} />
        {method === CARD_METHOD && <>
          <label htmlFor="card-number">{t('Card number')}</label>
          <input id="card-number" value={cardNumber} inputMode="numeric" autoComplete="off" placeholder="1234 5678 9012 3456" onChange={(event) => {
            setCardNumber(formatCardNumber(event.target.value));
            saveDraft();
          }} />
          <div className="payment-card-row">
            <div>
              <label htmlFor="card-expiry">{t('Card expiry (MM/YY)')}</label>
              <input id="card-expiry" value={cardExpiry} inputMode="numeric" autoComplete="off" placeholder="MM/YY" onChange={(event) => {
                setCardExpiry(event.target.value);
                saveDraft();
              }} />
            </div>
            <div>
              <label htmlFor="card-cvv">{t('Security code (CVV)')}</label>
              <input id="card-cvv" value={cardCvv} inputMode="numeric" autoComplete="off" maxLength="4" onChange={(event) => {
                setCardCvv(event.target.value);
                saveDraft();
              }} />
            </div>
          </div>
          <p className="payment-demo-note" role="note">{t('Use only the demo card numbers — never enter a real card.')}</p>
          <p className="payment-demo-note" role="note">{t('Demo card numbers: 4242 4242 4242 4242 (approved) · 4000 0000 0000 0002 (declined).')}</p>
        </>}
        <p className="payment-demo-note" role="note">{t('Demo payment only. No real payment is processed. Do not enter passwords or real banking credentials.')}</p>
        {declinedReason && <div className="payment-declined" role="alert">
          <p><strong>{t('Payment declined')}</strong> {t(declinedReason)}</p>
          <p className="muted small-text">{t('The order stays unpaid. Try another card before the 15-minute window closes.')}</p>
        </div>}
        {draftSaved && <div className="cart-toast payment-save-toast" role="status" aria-live="polite">{t('Your payment choices are ready. Complete payment to confirm the order.')}</div>}
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
