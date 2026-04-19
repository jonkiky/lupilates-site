export type CartItem = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  itemNotes: string;
};

export type QuoteCart = { items: CartItem[] };

export const CART_STORAGE_KEY = 'quote_cart';

export function createEmptyCart(): QuoteCart {
  return { items: [] };
}

export function addItem(cart: QuoteCart, input: Omit<CartItem, 'quantity' | 'itemNotes'>): QuoteCart {
  const existing = cart.items.find((item) => item.productId === input.productId);
  if (!existing) {
    return { items: [...cart.items, { ...input, quantity: 1, itemNotes: '' }] };
  }
  return {
    items: cart.items.map((item) =>
      item.productId === input.productId ? { ...item, quantity: item.quantity + 1 } : item,
    ),
  };
}

export function removeItem(cart: QuoteCart, productId: string): QuoteCart {
  return { items: cart.items.filter((item) => item.productId !== productId) };
}

export function updateQuantity(cart: QuoteCart, productId: string, quantity: number): QuoteCart {
  return {
    items: cart.items.map((item) =>
      item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item,
    ),
  };
}

export function updateNotes(cart: QuoteCart, productId: string, itemNotes: string): QuoteCart {
  return {
    items: cart.items.map((item) =>
      item.productId === productId ? { ...item, itemNotes } : item,
    ),
  };
}

export function loadCart(): QuoteCart {
  if (typeof window === 'undefined') return createEmptyCart();
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuoteCart) : createEmptyCart();
  } catch {
    return createEmptyCart();
  }
}

export function saveCart(cart: QuoteCart): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}
