export const PAYMENT_WINDOW_MS = 15 * 60 * 1000;

// Count from the saved order time so the deadline survives a page refresh.
export function getPaymentTimeRemaining(order, now = Date.now()) {
  if (order?.paymentStatus !== 'Unpaid' || order.status === 'Cancelled') return null;
  const createdAt = Date.parse(order.createdAt);
  if (!Number.isFinite(createdAt)) return null;
  return Math.max(0, createdAt + PAYMENT_WINDOW_MS - now);
}

// Return matching orders in newest-first order for dashboard and history pages.
export function filterOrders(orders, options = {}) {
  const {
    clientId,
    status = 'All',
    fulfillment = 'All',
    fromDate = '',
    toDate = '',
    limit,
    hideUnpaid = false,
  } = options;

  const matchingOrders = (Array.isArray(orders) ? orders : [])
    .filter((order) => {
      if (clientId && order.clientId !== clientId) return false;
      if (hideUnpaid && order.paymentStatus === 'Unpaid') return false;

      const orderDate = typeof order.createdAt === 'string' ? order.createdAt.slice(0, 10) : '';
      const matchesStatus = status === 'All' || order.status === status;
      const matchesFulfillment = fulfillment === 'All' || order.serviceType === fulfillment;
      const matchesFromDate = !fromDate || orderDate >= fromDate;
      const matchesToDate = !toDate || orderDate <= toDate;
      return matchesStatus && matchesFulfillment && matchesFromDate && matchesToDate;
    })
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));

  return Number.isInteger(limit) ? matchingOrders.slice(0, limit) : matchingOrders;
}

// Orders still being prepared are the client's active orders.
export function getActiveOrders(orders, clientId) {
  return filterOrders(orders, { clientId })
    .filter((order) => !['Done', 'Cancelled'].includes(order.status));
}
