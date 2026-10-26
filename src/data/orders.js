// Starting sample orders. New orders are kept in App state during this visit.
export const startingOrders = [
  {
    id: 'KN-1001',
    clientId: 'client-1',
    clientName: 'Aiko Tanaka',
    items: [{ name: 'Shoyu Ramen', quantity: 2, price: 68000 }],
    total: 136000,
    status: 'Pending',
    serviceType: 'Pickup',
    createdAt: '2026-10-17T11:20:00',
  },
  {
    id: 'KN-1002',
    clientId: 'client-2',
    clientName: 'Ren Sato',
    items: [
      { name: 'Chicken Katsu Curry', quantity: 1, price: 72000 },
      { name: 'Gyoza (5 pcs)', quantity: 1, price: 32000 },
    ],
    total: 104000,
    status: 'Done',
    serviceType: 'Delivery',
    address: 'Jl. Melati No. 12, Jakarta',
    createdAt: '2026-10-16T18:05:00',
  },
];
