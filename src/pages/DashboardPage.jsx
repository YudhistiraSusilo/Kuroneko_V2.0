import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import OrderCard from '../components/OrderCard.jsx';
import ClientHomePage from '../components/dashboard/ClientHomePage.jsx';
import { filterOrders, getActiveOrders } from '../utils/orderHelpers.js';
import { useLanguage } from '../components/LanguageContext.jsx';

export default function DashboardPage({ user, orders, menu = [], onAddToCart, onUpdateOrderStatus, onCancelOrder }) {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerMessage, setFooterMessage] = useState('');
  const [signatureToast, setSignatureToast] = useState('');
  const [pendingSection, setPendingSection] = useState('');
  const isAdmin = user.role === 'administrator';

  useEffect(() => {
    setError('');
    const timer = window.setTimeout(() => {
      if (!Array.isArray(orders) || !Array.isArray(menu)) setError('Page information could not be loaded. Please refresh the page.');
      setLoading(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, []);

  const adminOrders = useMemo(() => filterOrders(orders, { hideUnpaid: true }), [orders]);
  const visibleOrders = useMemo(() => filterOrders(adminOrders, { status: statusFilter, limit: 5 }), [adminOrders, statusFilter]);
  const activeOrders = getActiveOrders(orders, user.id).slice(0, 2);
  const signatureItems = Array.isArray(menu)
    ? menu.filter((item) => item.available && ['Sushi', 'Sashimi'].includes(item.category)).slice(0, 4)
    : [];
  const pendingCount = adminOrders.filter((order) => order.status === 'Pending').length;
  const doneCount = adminOrders.filter((order) => order.status === 'Done').length;

  useEffect(() => {
    if (!signatureToast) return undefined;
    const timer = window.setTimeout(() => setSignatureToast(''), 2500);
    return () => window.clearTimeout(timer);
  }, [signatureToast]);

  useEffect(() => {
    if (!footerMessage) return undefined;
    const timer = window.setTimeout(() => setFooterMessage(''), 3500);
    return () => window.clearTimeout(timer);
  }, [footerMessage]);

  function addSignatureDish(item) {
    onAddToCart(item.id);
    setSignatureToast(t('Dish added to your cart.', { dish: item.name }));
  }

  function handleFooterSignup(event) {
    event.preventDefault();
    const cleanEmail = footerEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFooterMessage(t('Enter a valid email address.'));
      return;
    }
    // This demo confirms the email locally; it does not submit to a server.
    setFooterMessage(t('Thanks for joining our updates.'));
    setFooterEmail('');
  }

  // Save the requested section so we can scroll after loading changes the page layout.
  useEffect(() => {
    if (isAdmin) return;
    const section = new URLSearchParams(location.search).get('section');
    if (['home', 'about', 'branches', 'contact'].includes(section)) setPendingSection(section);
  }, [isAdmin, location.search]);

  // Wait until the active-order area settles, then scroll to the selected section.
  useEffect(() => {
    if (isAdmin || loading || !pendingSection) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(pendingSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setPendingSection('');
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isAdmin, loading, pendingSection]);

  // Pick the last section heading above one steady viewport line to avoid observer-ratio flicker.
  useEffect(() => {
    if (isAdmin) return undefined;
    const sectionIds = ['home', 'about', 'branches', 'contact'];
    let frame = 0;
    let previousSection = '';
    function updateActiveSection() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const line = Math.min(window.innerHeight * 0.4, 360);
        const sections = sectionIds
          .map((id) => document.getElementById(id))
          .filter(Boolean);
        const passedSections = sections.filter((section) => section.getBoundingClientRect().top <= line);
        const activeSection = (passedSections.at(-1) || sections[0])?.id;
        if (!activeSection || activeSection === previousSection) return;
        previousSection = activeSection;
        window.dispatchEvent(new CustomEvent('kuroneko:home-section-change', { detail: activeSection }));
      });
    }

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return <ClientHomePage
      t={t} language={language} loading={loading} error={error}
      activeOrders={activeOrders} signatureItems={signatureItems}
      onCancelOrder={onCancelOrder} signatureToast={signatureToast}
      onAddSignatureDish={addSignatureDish} footerEmail={footerEmail}
      footerMessage={footerMessage} onFooterEmailChange={setFooterEmail}
      onFooterSignup={handleFooterSignup}
    />;
  }
  return <section className="admin-dashboard-layout">
    <div className="summary-grid">
      <div className="summary-card"><span>{t('All orders')}</span><strong>{adminOrders.length}</strong></div>
      <div className="summary-card"><span>{t('Pending')}</span><strong>{pendingCount}</strong></div>
      <div className="summary-card"><span>{t('Done')}</span><strong>{doneCount}</strong></div>
    </div>
    <div className="section-heading"><h2>{t('Recent orders')}</h2>
      <Link className="text-link" to="/orders">{t('View all orders')}</Link>
    </div>
    <div className="order-filters compact-filters"><label>{t('Status')}<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="All">{t('All')}</option><option value="Pending">{t('Pending')}</option><option value="Preparing">{t('Preparing')}</option><option value="Ready">{t('Ready')}</option><option value="Done">{t('Done')}</option><option value="Cancelled">{t('Cancelled')}</option></select></label></div>
    {loading && <p className="message">{t('Loading orders…')}</p>}
    {!loading && error && <p className="message message-error" role="alert">{t(error)}</p>}
    {!loading && !error && visibleOrders.length === 0 && <div className="empty-state"><span className="empty-icon">お</span><h3>{t('No recent orders match')}</h3><p className="muted">{t('Try another status or view the full order history.')}</p></div>}
    {!loading && !error && visibleOrders.length > 0 && <div className="orders-grid">{visibleOrders.map((order) => <OrderCard key={order.id} order={order} isAdmin onUpdateOrderStatus={onUpdateOrderStatus} />)}</div>}
  </section>;
}
