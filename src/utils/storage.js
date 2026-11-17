// Keep each client's cart separate. Move the old shared cart to the demo client once.
export function loadCarts() {
  try {
    const savedCarts = window.localStorage.getItem('kuro-neko-carts');
    if (savedCarts) {
      const parsedCarts = JSON.parse(savedCarts);
      if (parsedCarts && typeof parsedCarts === 'object' && !Array.isArray(parsedCarts)) return parsedCarts;
    }

    const legacyCart = JSON.parse(window.localStorage.getItem('kuro-neko-cart') || '[]');
    return Array.isArray(legacyCart) && legacyCart.length ? { 'client-1': legacyCart } : {};
  } catch {
    return {};
  }
}

export function saveCarts(carts) {
  try {
    window.localStorage.setItem('kuro-neko-carts', JSON.stringify(carts));
    return true;
  } catch {
    return false;
  }
}
