// lib/cart/CartContext.tsx
// Context و Provider سبد خرید
// Client Component چون از useState، useReducer و useEffect استفاده می‌کند

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import {
  CART_STORAGE_KEY,
  MAX_QUANTITY,
  type CartItem,
} from '@/lib/cart/types';

// ==========================================
// تایپ‌های Context
// ==========================================

// شکل مقداری که در Context ذخیره می‌شود
interface CartContextValue {
  // لیست آیتم‌های سبد
  items: CartItem[];

  // آیا از localStorage بارگذاری شده؟
  // برای جلوگیری از hydration mismatch
  hydrated: boolean;

  // افزودن آیتم به سبد (اگر وجود داشت، تعداد را زیاد می‌کند)
  addItem: (
    item: Omit<CartItem, 'quantity'>,
    quantity?: number
  ) => void;

  // حذف کامل یک آیتم از سبد
  removeItem: (variantId: number) => void;

  // تغییر تعداد یک آیتم
  updateQuantity: (variantId: number, quantity: number) => void;

  // خالی کردن کل سبد
  clearCart: () => void;

  // تعداد کل آیتم‌ها (جمع quantity ها)
  totalCount: number;

  // قیمت کل (جمع price × quantity)
  totalPrice: number;
}

// Context با مقدار اولیه null
// در useCart بررسی می‌کنیم که null نباشد
const CartContext = createContext<CartContextValue | null>(null);

// ==========================================
// Reducer
// ==========================================

// انواع اکشن‌ها
type Action =
  | { type: 'HYDRATE'; payload: CartItem[] }
  | {
      type: 'ADD';
      payload: { item: Omit<CartItem, 'quantity'>; quantity: number };
    }
  | { type: 'REMOVE'; payload: { variantId: number } }
  | {
      type: 'UPDATE_QTY';
      payload: { variantId: number; quantity: number };
    }
  | { type: 'CLEAR' };

function cartReducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    // بارگذاری از localStorage
    case 'HYDRATE':
      return action.payload;

    // افزودن آیتم
    case 'ADD': {
      const { item, quantity } = action.payload;
      const index = state.findIndex(
        (i) => i.variantId === item.variantId
      );

      // اگر آیتم جدید است، اضافه کن
      if (index === -1) {
        return [
          ...state,
          {
            ...item,
            quantity: Math.min(Math.max(1, quantity), MAX_QUANTITY),
          },
        ];
      }

      // اگر وجود داشت، تعداد را زیاد کن
      const next = [...state];
      next[index] = {
        ...next[index],
        quantity: Math.min(
          next[index].quantity + quantity,
          MAX_QUANTITY
        ),
      };
      return next;
    }

    // حذف آیتم
    case 'REMOVE':
      return state.filter(
        (i) => i.variantId !== action.payload.variantId
      );

    // تغییر تعداد
    case 'UPDATE_QTY': {
      const safeQty = Math.min(
        Math.max(1, action.payload.quantity),
        MAX_QUANTITY
      );
      return state.map((i) =>
        i.variantId === action.payload.variantId
          ? { ...i, quantity: safeQty }
          : i
      );
    }

    // خالی کردن
    case 'CLEAR':
      return [];
  }
}

// ==========================================
// Provider
// ==========================================

interface ProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: ProviderProps) {
  // state سبد با useReducer
  const [items, dispatch] = useReducer(cartReducer, []);

  // آیا از localStorage بارگذاری شده؟
  // ابتدا false، پس از اولین useEffect true می‌شود
  const [hydrated, setHydrated] = useState(false);

  // مرحله ۱: در اولین mount، از localStorage بخوان
  // این effect فقط یک بار اجرا می‌شود (آرایه وابستگی خالی)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        // بررسی ساختار ساده: باید آرایه باشد
        if (Array.isArray(parsed)) {
          dispatch({ type: 'HYDRATE', payload: parsed as CartItem[] });
        }
      }
    } catch {
      // اگر JSON نامعتبر بود، نادیده بگیر
      // localStorage را پاک کن تا بار بعد خطا ندهد
      try {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      } catch {
        // نادیده بگیر
      }
    }
    setHydrated(true);
  }, []);

  // مرحله ۲: هر بار items عوض شد، در localStorage ذخیره کن
  // ولی فقط بعد از hydrate شدن
  // تا وقتی که hydrated=false است، در localStorage نمی‌نویسیم
  // (وگرنه سبد خالی روی داده قبلی می‌نویسد)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch {
      // اگر حافظه پر بود یا حالت private بود، نادیده بگیر
    }
  }, [items, hydrated]);

  // ==========================================
  // توابع کمکی
  // ==========================================

  const addItem: CartContextValue['addItem'] = (item, quantity = 1) => {
    dispatch({ type: 'ADD', payload: { item, quantity } });
  };

  const removeItem: CartContextValue['removeItem'] = (variantId) => {
    dispatch({ type: 'REMOVE', payload: { variantId } });
  };

  const updateQuantity: CartContextValue['updateQuantity'] = (
    variantId,
    quantity
  ) => {
    dispatch({ type: 'UPDATE_QTY', payload: { variantId, quantity } });
  };

  const clearCart: CartContextValue['clearCart'] = () => {
    dispatch({ type: 'CLEAR' });
  };

  // ==========================================
  // مقادیر مشتق‌شده
  // ==========================================

  // جمع تعداد
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // جمع قیمت
  const totalPrice = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        hydrated,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ==========================================
// Hook استفاده از سبد
// ==========================================

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart باید داخل CartProvider استفاده شود');
  }
  return ctx;
}