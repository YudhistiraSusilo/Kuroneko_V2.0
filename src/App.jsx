import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { startingOrders } from './data/orders.js';
import { users as startingUsers } from './data/users.js';
import { loadSavedCarts, loadSavedMenu, loadSavedUser, loadSavedValue, saveAppData } from './utils/storage.js';
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
  const [users, setUsers] = useState(() => loadSavedValue('kuro-neko-users', startingUsers));
  const [user, setUser] = useState(() => loadSavedUser(users));
  const [orders, setOrders] = useState(() => loadSavedValue('kuro-neko-orders', startingOrders));
  const [menu, setMenu] = useState(loadSavedMenu);
  const [carts, setCarts] = useState(loadSavedCarts);
  const cart = user?.role === 'client' ? carts[user.id] || [] : [];
  const [storageWarning, setStorageWarning] = useState('');
  const [notification, setNotification] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

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
  function handleProfileUpdate(changes) {
    const updatedUser = { ...user, ...changes };
    setUser(updatedUser);
    setUsers((current) => current.map((account) => account.id === user.id ? updatedUser : account));
  }

  function toggleFavorite(menuItemId) {
    if (user?.role !== 'client') return;
    const favorites = user.favoriteMenuIds || [];
    const favoriteMenuIds = favorites.includes(menuItemId)
      ? favorites.filter((id) => id !== menuItemId)
      : [...favorites, menuItemId];
    handleProfileUpdate({ favoriteMenuIds });
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

  // Keep the demo data in this browser so it survives closing and reopening the site.
  useEffect(() => {
    const failedSaves = saveAppData({ users, orders, menu, carts, user });

    setStorageWarning(failedSaves.length
      ? 'Some changes could not be saved in this browser. Free browser storage space, then try again.'
      : '');
  }, [users, orders, menu, carts, user]);

  function handleLogin(foundUser) {
    setUser(users.find((account) => account.id === foundUser.id) || foundUser);
    navigate('/dashboard');
  }
  function handleSignUp(newUser) {
    setUsers((current) => [...current, newUser]);
    setUser(newUser);
    navigate('/dashboard');
  }
  function handleLogout() {
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
  function saveMenuItem(menuItem) {
    setMenu((current) => current.some((item) => item.id === menuItem.id)
      ? current.map((item) => item.id === menuItem.id ? menuItem : item)
      : [...current, menuItem]);
  }
  function removeMenuItem(menuItemId) {
    setMenu((current) => current.filter((item) => item.id !== menuItemId));
  }
  function addOrder(newOrder) {
    if (!user || user.role !== 'client') throw new Error('Only clients can place orders.');
    const invalidItems = !Array.isArray(newOrder?.items) || newOrder.items.length === 0 || newOrder.items.some((item) =>
      !item.name || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price <= 0,
    );
    if (!newOrder?.id || invalidItems || !Number.isFinite(newOrder.total) || newOrder.total <= 0) {
      throw new Error('The order details are incomplete. Please review your cart.');
    }
    setOrders((current) => [newOrder, ...current]);
    updateCart([]);
    return newOrder;
  }

  function cancelOrder(orderId) {
    if (!user || user.role !== 'client') return 'Only clients can cancel an order.';
    const order = orders.find((item) => item.id === orderId);
    if (!order) return 'This order could not be found. Refresh the page and try again.';
    if (order.clientId !== user.id) return 'You can only cancel orders placed by your account.';
    if (order.status !== 'Pending') return 'Only pending orders can be cancelled.';
    if (order.paymentStatus === 'Paid') return 'Paid orders cannot be cancelled here. Please contact the restaurant about a refund.';

    setOrders((current) => current.map((item) => item.id === orderId ? {
      ...item,
      status: 'Cancelled',
      statusHistory: [...(item.statusHistory || [{ status: item.status, changedAt: item.createdAt }]), {
        status: 'Cancelled', changedAt: new Date().toISOString(), changedBy: user.displayName,
      }],
    } : item));
    setNotification(`Order ${orderId} was cancelled.`);
    return '';
  }

  function updateOrderStatus(orderId, newStatus) {
    if (!user || user.role !== 'administrator') return 'Only administrators can update order status.';
    const order = orders.find((item) => item.id === orderId);
    if (!order) return 'This order could not be found. Refresh the page and try again.';
    const validStatuses = ['Pending', 'Preparing', 'Ready', 'Done'];
    if (!validStatuses.includes(newStatus)) return 'Choose a valid order status.';
    if (order.status === 'Cancelled') return 'Cancelled orders cannot be changed.';
    if (order.paymentStatus === 'Unpaid') return 'This order must be paid before its kitchen status can change.';

    setOrders((current) => current.map((item) => item.id === orderId ? {
      ...item,
      status: newStatus,
      statusHistory: [...(item.statusHistory || [{ status: item.status, changedAt: item.createdAt }]), {
        status: newStatus, changedAt: new Date().toISOString(), changedBy: user.displayName,
      }],
    } : item));
    setNotification(`Order ${orderId} status updated to ${newStatus}.`);
    return '';
  }

  function savePaymentDraft(orderId, paymentDraft) {
    if (!user || user.role !== 'client') return 'Only clients can update payment details.';
    const order = orders.find((item) => item.id === orderId);
    if (!order || order.clientId !== user.id) return 'This order could not be found in your account.';
    if (order.paymentStatus === 'Paid') return 'This order has already been paid.';
    if (order.status === 'Cancelled') return 'Cancelled orders cannot be paid.';
    if (getPaymentTimeRemaining(order) === 0) return 'The 15-minute payment window has expired. This order is being cancelled.';
    if (!['Bank transfer (demo)', 'E-wallet (demo)'].includes(paymentDraft.method)) return 'Choose a valid payment method.';
    if (typeof paymentDraft.payerName !== 'string' || paymentDraft.payerName.length > 60) return 'Enter a valid payer name.';

    setOrders((current) => current.map((item) => item.id === orderId ? { ...item, paymentDraft } : item));
    return '';
  }

  function completePayment(orderId, paymentDetails) {
    const saveError = savePaymentDraft(orderId, paymentDetails);
    if (saveError) return saveError;
    if (paymentDetails.payerName.trim().length < 2) return 'Enter a payer name with at least 2 characters.';

    setOrders((current) => current.map((item) => item.id === orderId ? {
      ...item,
      paymentStatus: 'Paid',
      paymentMethod: paymentDetails.method,
      payerName: paymentDetails.payerName.trim(),
      paidAt: new Date().toISOString(),
      paymentDraft: null,
    } : item));
    setNotification(`Payment for order ${orderId} is complete.`);
    return '';
  }

  return (
    <LanguageProvider>
    <ScrollMotion />
    <Routes>
      <Route
        path="/login"
        element={user
          ? <Navigate to="/dashboard" replace />
          : <LoginPage users={users} onLogin={handleLogin} onSignUp={handleSignUp} />}
      />
      <Route path="/dashboard" element={
        <ProtectedLayout user={user} cart={cart} onLogout={handleLogout} storageWarning={storageWarning} notification={notification}>
          <DashboardPage
            user={user}
            orders={orders}
            menu={menu}
            onAddToCart={addToCart}
            onUpdateOrderStatus={updateOrderStatus}
            onCancelOrder={cancelOrder}
          />
        </ProtectedLayout>
      } />
      <Route path="/orders" element={
        <ProtectedLayout user={user} cart={cart} onLogout={handleLogout} storageWarning={storageWarning} notification={notification}>
          <OrdersPage user={user} orders={orders} onUpdateOrderStatus={updateOrderStatus} onCancelOrder={cancelOrder} />
        </ProtectedLayout>
      } />
      <Route path="/menu" element={
        <ProtectedLayout user={user} cart={cart} onLogout={handleLogout} storageWarning={storageWarning} notification={notification}>
          <MenuPage
            user={user}
            menu={menu}
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
            onCancelOrder={cancelOrder}
            menu={menu}
            onToggleFavorite={toggleFavorite}
            onAddToCart={addToCart}
          />
        </ProtectedLayout>
      } />
      <Route path="/order-confirmation" element={
        <ProtectedLayout user={user} cart={cart} onLogout={handleLogout} storageWarning={storageWarning} notification={notification}>
          <OrderConfirmationPage user={user} orders={orders} />
        </ProtectedLayout>
      } />
      <Route path="/payment" element={
        <ProtectedLayout user={user} cart={cart} onLogout={handleLogout} storageWarning={storageWarning} notification={notification}>
          <PaymentPage
            user={user}
            orders={orders}
            onSavePaymentDraft={savePaymentDraft}
            onCompletePayment={completePayment}
          />
        </ProtectedLayout>
      } />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
    </LanguageProvider>
  );
}
