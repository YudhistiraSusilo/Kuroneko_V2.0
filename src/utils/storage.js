import { menuItems as startingMenu } from '../data/menuItems.js';

// Read saved JSON safely and use the starter value if it is missing or invalid.
export function loadSavedValue(key, fallback) {
  try {
    const savedValue = window.localStorage.getItem(key);
    if (!savedValue) return fallback;

    const parsedValue = JSON.parse(savedValue);
    if (Array.isArray(fallback) && !Array.isArray(parsedValue)) return fallback;
    return parsedValue;
  } catch {
    return fallback;
  }
}

// Migrate older saved menu categories and add newer starter dishes once.
export function loadSavedMenu() {
  try {
    const savedMenu = window.localStorage.getItem('kuro-neko-menu');
    if (!savedMenu) return startingMenu;

    const parsedMenu = JSON.parse(savedMenu);
    if (!Array.isArray(parsedMenu)) return startingMenu;
    if (window.localStorage.getItem('kuro-neko-menu-version') === '2') return parsedMenu;

    const categoryNames = { Noodles: 'Ramen', Rice: 'Side dishes', Sides: 'Side dishes' };
    const existingMenu = parsedMenu.map((dish) => ({
      ...dish,
      category: categoryNames[dish.category] || dish.category,
    }));
    const oldStarterIds = new Set(['dish-1', 'dish-2', 'dish-3', 'dish-4']);
    const newStarterDishes = startingMenu.filter((dish) =>
      !oldStarterIds.has(dish.id) && !existingMenu.some((savedDish) => savedDish.id === dish.id),
    );
    return [...existingMenu, ...newStarterDishes];
  } catch {
    return startingMenu;
  }
}

// Restore the signed-in account only if it still exists in the saved users.
export function loadSavedUser(savedUsers) {
  try {
    const savedId = JSON.parse(window.localStorage.getItem('kuro-neko-active-user') || 'null');
    return savedUsers.find((account) => account.id === savedId) || null;
  } catch {
    return null;
  }
}

// Keep each client's cart separate. Move the old shared cart to the demo client once.
export function loadSavedCarts() {
  try {
    const savedCarts = window.localStorage.getItem('kuro-neko-carts');
    if (savedCarts) {
      const parsedCarts = JSON.parse(savedCarts);
      if (parsedCarts && typeof parsedCarts === 'object' && !Array.isArray(parsedCarts)) return parsedCarts;
    }

    const legacyCart = loadSavedValue('kuro-neko-cart', []);
    return legacyCart.length ? { 'client-1': legacyCart } : {};
  } catch {
    return {};
  }
}

// Save app state and return any keys the browser could not store.
export function saveAppData({ users, orders, menu, carts, user }) {
  const valuesToSave = [
    ['kuro-neko-users', users],
    ['kuro-neko-orders', orders],
    ['kuro-neko-menu', menu],
    ['kuro-neko-carts', carts],
    ['kuro-neko-active-user', user?.id || null],
  ];
  const failedSaves = [];

  valuesToSave.forEach(([key, value]) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      failedSaves.push(key);
    }
  });

  try {
    window.localStorage.setItem('kuro-neko-menu-version', '2');
  } catch {
    failedSaves.push('kuro-neko-menu-version');
  }

  return failedSaves;
}
