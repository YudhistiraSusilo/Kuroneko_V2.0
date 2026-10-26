import { Link } from 'react-router-dom';
import OrderCard from '../OrderCard.jsx';

export default function RecentOrderSection({ t, loading, error, orders, onCancelOrder }) {
  return <section className="account-section orders-section" id="order-history">
    <div className="account-section-heading"><div><span className="account-section-icon">▤</span><h2>Order History</h2></div><Link className="button button-primary profile-orders-history-link" to="/orders">View order history</Link></div>
    {loading && <p className="message">{t('Loading order history…')}</p>}
    {!loading && error && <p className="message message-error" role="alert">{error}</p>}
    {!loading && !error && orders.length === 0 && <div className="account-empty-state"><p>{t('No orders yet')}</p></div>}
    {!loading && !error && orders.length > 0 && <div className="profile-recent-order"><OrderCard order={orders[0]} onCancelOrder={onCancelOrder} onResumePayment /></div>}
  </section>;
}
