import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { menuItems as menuPictureCatalog } from './data/menuItems.js';
import { loadCarts, saveCarts } from './utils/storage.js';
import { api, clearAuthToken, setAuthToken } from './utils/api.js';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import CartPage from './pages/CartPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import Navbar from './components/Navbar.jsx';
import ScrollMotion from './components/ScrollMotion.jsx';
import { LanguageProvider } from './components/LanguageContext.jsx';
import { getPaymentTimeRemaining } from './utils/orderHelpers.js';

const menuPicturesByName = new Map(menuPictureCatalog.map(({ name, picture }) => [name.toLowerCase(), picture]));
const withMenuPicture = (dish) => ({
  ...dish,
  picture: dish.picture || menuPicturesByName.get(dish.name.toLowerCase()) || '',
});
const normalizeOrder = (order) => ({ ...order, id: String(order.id) });

function ProtectedLayout({ user, cart, onLogout, storageWarning, notification, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return <>
    <Navbar user={user} cart={cart} onLogout={onLogout} />
    {storageWarning && <div className="storage-warning" role="alert">{storageWarning}</div>}
    {notification && <div key={notification} className="app-notification" role="status">{notification}</div>}
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <main className="page-shell" id="main-content" tabIndex="-1">{children}</main>
  </>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [carts, setCarts] = useState(loadCarts);
  const cart = user?.role === 'client' ? carts[user.id] || [] : [];
  const [storageWarning, setStorageWarning] = useState('');
  const [notification, setNotification] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    api.get('/api/menu')
      .then((items) => {
        if (!active) return;
        const nextMenu = items.map(withMenuPicture);
        const apiIdByLegacyId = new Map(menuPictureCatalog.map((dish) => [
          dish.id,
          nextMenu.find((item) => item.name.toLowerCase() === dish.name.toLowerCase())?.id,
        ]));
        setMenu(nextMenu);
        setCarts((current) => Object.fromEntries(Object.entries(current).map(([accountId, accountCart]) => [
          accountId,
          accountCart.map((cartItem) => ({
            ...cartItem,
            menuItemId: apiIdByLegacyId.get(cartItem.menuItemId) ?? cartItem.menuItemId,
          })),
        ])));
      })
      .catch((error) => {
        if (active) setMenuError(error.message || 'The menu could not be loaded. Please try again.');
      })
      .finally(() => {
        if (active) setMenuLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setOrdersError('');
      setOrdersLoading(false);
      return undefined;
    }
    let active = true;
    setOrders([]);
    setOrdersError('');
    setOrdersLoading(true);
    api.get('/api/orders')
      .then((items) => { if (active) setOrders(items.map(normalizeOrder)); })
      .catch((error) => {
        if (active) setOrdersError(error.message || 'Orders could not be loaded. Please try again.');
      })
      .finally(() => { if (active) setOrdersLoading(false); });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    if (['/orders', '/profile', '/menu'].includes(location.pathname)) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [location.pathname]);

  // Enforce the deadline while the app is open and when it is reopened.
  useEffect(() => {
    function cancelExpiredOrders() {
      const now = Date.now();
      setOrders((current) => {
        let changed = false;
        const updated = current.map((order) => {
          if (getPaymentTimeRemaining(order, now) !== 0) return order;
          changed = true;
          const changedAt = new Date(now).toISOString();
          return {
            ...order,
            status: 'Cancelled',
            cancellationReason: 'Payment window expired',
            statusHistory: [...(order.statusHistory || [{ status: order.status, changedAt: order.createdAt }]), {
              status: 'Cancelled', changedAt, changedBy: 'System',
            }],
          };
        });
        return changed ? updated : current;
      });
    }

    cancelExpiredOrders();
    const timer = window.setInterval(cancelExpiredOrders, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Keep the signed-in account in sync when its profile is edited.
  async function handleProfileUpdate(changes) {
    const updatedUser = await api.put(`/api/profile/${encodeURIComponent(user.id)}`, changes);
    setUser(updatedUser);
    return updatedUser;
  }

  async function toggleFavorite(menuItemId) {
    if (user?.role !== 'client') return;
    const favorites = user.favoriteMenuIds || [];
    const favoriteMenuIds = favorites.includes(menuItemId)
      ? favorites.filter((id) => id !== menuItemId)
      : [...favorites, menuItemId];
    await handleProfileUpdate({ favoriteMenuIds });
  }

  // Remove unavailable dishes from every account's saved cart.
  useEffect(() => {
    let anyRemoved = false;
    const removedByAccount = {};
    const nextCarts = Object.fromEntries(Object.entries(carts).map(([accountId, accountCart]) => {
      const removedItems = accountCart.filter((cartItem) =>
        !menu.some((dish) => dish.id === cartItem.menuItemId && dish.available),
      );
      if (removedItems.length === 0) return [accountId, accountCart];

      anyRemoved = true;
      removedByAccount[accountId] = removedItems.map((cartItem) =>
        menu.find((dish) => dish.id === cartItem.menuItemId)?.name || 'A removed dish',
      );
      return [accountId, accountCart.filter((cartItem) =>
        menu.some((dish) => dish.id === cartItem.menuItemId && dish.available),
      )];
    }));
    if (!anyRemoved) return;

    setCarts(nextCarts);
    const removedNames = user?.role === 'client'
      ? removedByAccount[user.id] || []
      : Object.values(removedByAccount).flat();
    if (removedNames.length === 0) return;
    const cartNotice = `${removedNames.join(', ')} ${removedNames.length === 1 ? 'was' : 'were'} removed from the cart because ${removedNames.length === 1 ? 'it is' : 'they are'} unavailable.`;
    if (user?.role === 'client') {
      setNotification(cartNotice);
      try { window.localStorage.removeItem('kuro-neko-cart-notice'); } catch { /* The in-page notice still works. */ }
    } else {
      // Keep the notice until a client signs in, since the administrator may be editing the menu.
      try { window.localStorage.setItem('kuro-neko-cart-notice', cartNotice); } catch { /* Storage warning covers browser save failures. */ }
    }
  }, [carts, menu, user]);

  useEffect(() => {
    if (user?.role !== 'client') return;
    try {
      const savedNotice = window.localStorage.getItem('kuro-neko-cart-notice');
      if (savedNotice) {
        setNotification(savedNotice);
        window.localStorage.removeItem('kuro-neko-cart-notice');
      }
    } catch {
      // A saved notice is optional; the cart remains usable if storage is unavailable.
    }
  }, [user]);

  // Clear notifications after a short time so they do not cover the page.
  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  // Preserve the cart locally because the API has no cart endpoint.
  useEffect(() => {
    const saved = saveCarts(carts);
    setStorageWarning(!saved
      ? 'Some changes could not be saved in this browser. Free browser storage space, then try again.'
      : '');
  }, [carts]);

  function handleLogin({ token, user: authenticatedUser }) {
    setAuthToken(token);
    setOrdersLoading(true);
    setOrdersError('');
    if (authenticatedUser.role === 'client') {
      setCarts((current) => current[String(authenticatedUser.id)]
        ? current
        : { ...current, [authenticatedUser.id]: current['client-1'] || [] });
    }
    setUser(authenticatedUser);
    navigate('/dashboard');
  }
  function handleLogout() {
    clearAuthToken();
    setUser(null);
    setNotification('');
    navigate('/login');
  }
  function updateCart(update) {
    if (!user || user.role !== 'client') return;
    setCarts((current) => {
      const currentCart = current[user.id] || [];
      const nextCart = typeof update === 'function' ? update(currentCart) : update;
      return { ...current, [user.id]: nextCart };
    });
  }
  function addToCart(menuItemId) {
    if (!user || user.role !== 'client') return;
    const dish = menu.find((item) => item.id === menuItemId);
    if (!dish || !dish.available) return;
    updateCart((current) => {
      const existing = current.find((item) => item.menuItemId === menuItemId);
      return existing
        ? current.map((item) => item.menuItemId === menuItemId ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { menuItemId, quantity: 1 }];
    });
  }
  function setCartQuantity(menuItemId, quantity) {
    if (quantity < 1) updateCart((current) => current.filter((item) => item.menuItemId !== menuItemId));
    else updateCart((current) => current.map((item) => item.menuItemId === menuItemId ? { ...item, quantity } : item));
  }
  async function saveMenuItem(menuItem) {
    const existing = menu.some((item) => item.id === menuItem.id);
    const { id, ...payload } = menuItem;
    const savedDish = existing
      ? await api.put(`/api/menu/${encodeURIComponent(id)}`, payload)
      : await api.post('/api/menu', payload);
    const updatedDish = withMenuPicture(savedDish);
    setMenuError('');
    setMenu((current) => existing
      ? current.map((item) => item.id === id ? updatedDish : item)
      : [...current, updatedDish]);
    return updatedDish;
  }
  async function removeMenuItem(menuItemId) {
    await api.delete(`/api/menu/${encodeURIComponent(menuItemId)}`);
    setMenuError('');
    setMenu((current) => current.filter((item) => item.id !== menuItemId));
  }
  async function addOrder(newOrder) {
    if (!user || user.role !== 'client') throw new Error('Only clients can place orders.');
    const savedOrder = normalizeOrder(await api.post('/api/orders', {
      items: newOrder.items,
      total: newOrder.total,
      serviceType: newOrder.serviceType,
      address: newOrder.address,
      notes: newOrder.notes,
    }));
    setOrdersError('');
    setOrders((current) => [savedOrder, ...current]);
    updateCart([]);
    return savedOrder;
  }

  async function cancelOrder(orderId) {
    const updatedOrder = normalizeOrder(await api.put(`/api/orders/${encodeURIComponent(orderId)}/cancel`));
    setOrdersError('');
    setOrders((current) => current.map((item) => item.id === updatedOrder.id ? updatedOrder : item));
    setNotification(`Order ${orderId} was cancelled.`);
  }

  async function updateOrderStatus(orderId, newStatus) {
    const updatedOrder = normalizeOrder(await api.put(`/api/orders/${encodeURIComponent(orderId)}/status`, { status: newStatus }));
    setOrdersError('');
    setOrders((current) => current.map((item) => item.id === updatedOrder.id ? updatedOrder : item));
    setNotification(`Order ${orderId} status updated to ${newStatus}.`);
  }

  async function completePayment(orderId, paymentDetails) {
    const updatedOrder = normalizeOrder(await api.put(`/api/orders/${encodeURIComponent(orderId)}/payment`, paymentDetails));
    setOrdersError('');
    setOrders((current) => current.map((item) => item.id === updatedOrder.id ? updatedOrder : item));
    setNotification(`Payment for order ${orderId} is complete.`);
  }

  return (
    <LanguageProvider>
    <ScrollMotion />
    <Routes>
      <Route
        path="/login"
        element={user
          ? <Navigate to="/dashboard" replace />
          : <LoginPage onLogin={handleLogin} />}
      />
      <Route path="/dashboard" element={
        <ProtectedLayout user={user} cart={cart} onLogout={handleLogout} storageWarning={storageWarning} notification={notification}>
          <DashboardPage
            user={user}
            orders={orders}
            ordersLoading={ordersLoading}
            ordersError={ordersError}
            menu={menu}
            onAddToCart={addToCart}
            onUpdateOrderStatus={updateOrderStatus}
            onCancelOrder={cancelOrder}
          />
        </ProtectedLayout>
      } />
      <Route path="/orders" element={
        <ProtectedLayout user={user} cart={cart} onLogout={handleLogout} storageWarning={storageWarning} notification={notification}>
        <OrdersPage user={user} orders={orders} ordersLoading={ordersLoading} ordersError={ordersError} onUpdateOrderStatus={updateOrderStatus} onCancelOrder={cancelOrder} />
        </ProtectedLayout>
      } />
      <Route path="/menu" element={
        <ProtectedLayout user={user} cart={cart} onLogout={handleLogout} storageWarning={storageWarning} notification={notification}>
          <MenuPage
            user={user}
            menu={menu}
            menuLoading={menuLoading}
            menuError={menuError}
            onAddToCart={addToCart}
            onToggleFavorite={toggleFavorite}
            onSaveMenuItem={saveMenuItem}
            onRemoveMenuItem={removeMenuItem}
          />
        </ProtectedLayout>
      } />
      <Route path="/cart" element={
        <ProtectedLayout user={user} cart={cart} onLogout={handleLogout} storageWarning={storageWarning} notification={notification}>
          <CartPage
            user={user}
            menu={menu}
            menuLoading={menuLoading}
            menuError={menuError}
            cart={cart}
            onChangeQuantity={setCartQuantity}
            onPlaceOrder={addOrder}
          />
        </ProtectedLayout>
      } />
      <Route path="/profile" element={
        <ProtectedLayout user={user} cart={cart} onLogout={handleLogout} storageWarning={storageWarning} notification={notification}>
          <ProfilePage
            user={user}
            onSave={handleProfileUpdate}
            onLogout={handleLogout}
            orders={orders}
            ordersError={ordersError}
            onCancelOrder={cancelOrder}
            menu={menu}
            onToggleFavorite={toggleFavorite}
            onAddToCart={addToCart}
          />
        </ProtectedLayout>
      } />
      <Route path="/order-confirmation" element={
        <ProtectedLayout user={user} cart={cart} onLogout={handleLogout} storageWarning={storageWarning} notification={notification}>
          <OrderConfirmationPage user={user} orders={orders} ordersLoading={ordersLoading} ordersError={ordersError} />
        </ProtectedLayout>
      } />
      <Route path="/payment" element={
        <ProtectedLayout user={user} cart={cart} onLogout={handleLogout} storageWarning={storageWarning} notification={notification}>
          <PaymentPage
            user={user}
            orders={orders}
            onCompletePayment={completePayment}
            ordersLoading={ordersLoading}
            ordersError={ordersError}
          />
        </ProtectedLayout>
      } />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
    </LanguageProvider>
  );
}
