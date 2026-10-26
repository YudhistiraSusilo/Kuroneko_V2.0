import { useEffect, useMemo, useState } from 'react';
import OrderCard from '../components/OrderCard.jsx';
import { useLanguage } from '../components/LanguageContext.jsx';
import { filterOrders } from '../utils/orderHelpers.js';

export default function OrdersPage({ user, orders, onUpdateOrderStatus, onCancelOrder }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const isAdmin = user.role === 'administrator';

  useEffect(() => {
    setError('');
    const timer = window.setTimeout(() => {
      if (!Array.isArray(orders)) setError('Orders could not be loaded. Please refresh the page.');
      setLoading(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredOrders = useMemo(() => filterOrders(orders, {
    clientId: isAdmin ? undefined : user.id,
    status: statusFilter,
    fulfillment: fulfillmentFilter,
    fromDate,
    toDate,
    hideUnpaid: isAdmin,
  }), [orders, statusFilter, fulfillmentFilter, fromDate, toDate, isAdmin, user.id]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const displayedPage = Math.min(currentPage, totalPages);
  const pageOrders = filteredOrders.slice((displayedPage - 1) * pageSize, displayedPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, fulfillmentFilter, fromDate, toDate]);

  return <section className="orders-page-layout">
    {!isAdmin && <div className="page-heading my-orders-heading"><h1>{t('My orders')}</h1></div>}
    <div className="order-filters">
      <label>{t('Status')}<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>{t('All')}</option><option>{t('Pending')}</option><option>{t('Preparing')}</option><option>{t('Ready')}</option><option>{t('Done')}</option><option>{t('Cancelled')}</option></select></label>
      <label>{t('Fulfillment')}<select value={fulfillmentFilter} onChange={(event) => setFulfillmentFilter(event.target.value)}><option value="All">{t('All')}</option><option value="Pickup">{t('Pickup')}</option><option value="Delivery">{t('Delivery')}</option></select></label>
      <label>{t('From date')}<input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} /></label>
      <label>{t('To date')}<input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} /></label>
      <button className="button button-quiet" type="button" onClick={() => { setStatusFilter('All'); setFulfillmentFilter('All'); setFromDate(''); setToDate(''); setCurrentPage(1); }}>{t('Clear filters')}</button>
    </div>
    <div className="section-heading"><h2>{t(isAdmin ? 'Order history' : 'All your orders')}</h2><span className="muted small-text">{filteredOrders.length} {t('orders')}</span></div>
    {loading && <p className="message">{t('Loading order history…')}</p>}
    {!loading && error && <p className="message message-error" role="alert">{t(error)}</p>}
    {!loading && !error && filteredOrders.length === 0 && <div className="empty-state"><h3>{t(isAdmin ? 'No orders found' : 'No orders yet')}</h3><p className="muted">{t(isAdmin ? 'Change or clear your filters to see more orders.' : 'Your orders will appear here after you place one.')}</p></div>}
    {!loading && !error && filteredOrders.length > 0 && <>
      <div className="orders-grid order-list-vertical">{pageOrders.map((order) => <OrderCard key={order.id} order={order} isAdmin={isAdmin} onUpdateOrderStatus={onUpdateOrderStatus} onCancelOrder={onCancelOrder} onResumePayment />)}</div>
      {totalPages > 1 && <nav className="menu-pagination" aria-label={t('Order pagination')}>
        <button className="button button-secondary" type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={displayedPage === 1}>{t('Previous')}</button>
        <span>{t('Page {current} of {total}', { current: displayedPage, total: totalPages })}</span>
        <button className="button button-secondary" type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={displayedPage === totalPages}>{t('Next')}</button>
      </nav>}
    </>}
  </section>;
}
