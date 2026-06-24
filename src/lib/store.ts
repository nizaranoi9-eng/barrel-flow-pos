import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Store, Settings, CartItem, Category } from './types';

// Auth Store
interface AuthState {
  user: User | null;
  store: Store | null;
  settings: Settings | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setStore: (store: Store | null) => void;
  setSettings: (settings: Settings | null) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      store: null,
      settings: null,
      isAuthenticated: false,
      isInitialized: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setStore: (store) => set({ store }),
      setSettings: (settings) => set({ settings }),
      logout: () => set({ user: null, store: null, settings: null, isAuthenticated: false }),
      initialize: () => set({ isInitialized: true }),
    }),
    {
      name: 'retailflow-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        store: state.store,
        settings: state.settings,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Cart Store
interface CartState {
  items: CartItem[];
  discountType: 'flat' | 'percentage' | null;
  discountValue: number;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setDiscount: (type: 'flat' | 'percentage' | null, value: number) => void;
  setCustomerEmail: (email: string) => void;
  setCustomerPhone: (phone: string) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  discountType: null,
  discountValue: 0,
  customerEmail: '',
  customerPhone: '',
  notes: '',
  
  addItem: (item) => set((state) => {
    const existingIndex = state.items.findIndex((i) => i.productId === item.productId);
    if (existingIndex >= 0) {
      const newItems = [...state.items];
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newItems[existingIndex].quantity + item.quantity,
      };
      return { items: newItems };
    }
    return { items: [...state.items, item] };
  }),
  
  updateQuantity: (productId, quantity) => set((state) => {
    if (quantity <= 0) {
      return { items: state.items.filter((i) => i.productId !== productId) };
    }
    return {
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    };
  }),
  
  removeItem: (productId) => set((state) => ({
    items: state.items.filter((i) => i.productId !== productId),
  })),
  
  setDiscount: (type, value) => set({ discountType: type, discountValue: value }),
  
  setCustomerEmail: (email) => set({ customerEmail: email }),
  setCustomerPhone: (phone) => set({ customerPhone: phone }),
  setNotes: (notes) => set({ notes }),
  
  clearCart: () => set({
    items: [],
    discountType: null,
    discountValue: 0,
    customerEmail: '',
    customerPhone: '',
    notes: '',
  }),
  
  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  },
  
  getTaxAmount: () => {
    const { items } = get();
    return items.reduce((sum, item) => {
      const lineTotal = item.unitPrice * item.quantity;
      return sum + (lineTotal * item.taxRate) / 100;
    }, 0);
  },
  
  getDiscountAmount: () => {
    const { discountType, discountValue } = get();
    const subtotal = get().getSubtotal();
    if (!discountType || discountValue <= 0) return 0;
    if (discountType === 'flat') return discountValue;
    return (subtotal * discountValue) / 100;
  },
  
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const tax = get().getTaxAmount();
    const discount = get().getDiscountAmount();
    return Math.max(0, subtotal + tax - discount);
  },
}));

// UI Store
interface UIState {
  activeTab: string;
  sidebarOpen: boolean;
  isLoading: boolean;
  setActiveTab: (tab: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'pos',
  sidebarOpen: true,
  isLoading: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

// Categories Cache
interface CategoriesState {
  categories: Category[];
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  removeCategory: (id: string) => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (category) => set((state) => ({
    categories: [...state.categories, category],
  })),
  updateCategory: (id, data) => set((state) => ({
    categories: state.categories.map((c) =>
      c.id === id ? { ...c, ...data } : c
    ),
  })),
  removeCategory: (id) => set((state) => ({
    categories: state.categories.filter((c) => c.id !== id),
  })),
}));

// Products Cache (for offline support)
interface ProductsState {
  products: Map<string, import('./types').Product>;
  lastSync: number | null;
  setProducts: (products: import('./types').Product[]) => void;
  updateProduct: (id: string, product: import('./types').Product) => void;
  removeProduct: (id: string) => void;
  getProduct: (id: string) => import('./types').Product | undefined;
  getProductByBarcode: (barcode: string) => import('./types').Product | undefined;
}

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: new Map(),
      lastSync: null,
      
      setProducts: (products) => {
        const map = new Map<string, import('./types').Product>();
        products.forEach((p) => map.set(p.id, p));
        set({ products: map as unknown as Map<string, import('./types').Product>, lastSync: Date.now() });
      },
      
      updateProduct: (id, product) => set((state) => {
        const map = new Map(state.products as unknown as Map<string, import('./types').Product>);
        map.set(id, product);
        return { products: map as unknown as Map<string, import('./types').Product> };
      }),
      
      removeProduct: (id) => set((state) => {
        const map = new Map(state.products as unknown as Map<string, import('./types').Product>);
        map.delete(id);
        return { products: map as unknown as Map<string, import('./types').Product> };
      }),
      
      getProduct: (id) => {
        const state = get();
        return (state.products as unknown as Map<string, import('./types').Product>).get(id);
      },
      
      getProductByBarcode: (barcode) => {
        const state = get();
        const products = Array.from((state.products as unknown as Map<string, import('./types').Product>).values());
        return products.find((p) => p.barcode === barcode);
      },
    }),
    {
      name: 'retailflow-products',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        products: Array.from((state.products as unknown as Map<string, import('./types').Product>).entries()),
        lastSync: state.lastSync,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.products)) {
          (state as unknown as { products: Map<string, import('./types').Product> }).products = new Map(state.products as unknown as [string, import('./types').Product][]);
        }
      },
    }
  )
);

// Suspended Sale
interface SuspendedSale {
  id: string;
  name: string;
  items: CartItem[];
  discountType: 'flat' | 'percentage' | null;
  discountValue: number;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  createdAt: number;
}

// Offline Orders Store (for offline billing)
interface OfflineOrder {
  id: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  discountType: 'flat' | 'percentage' | null;
  discountValue: number;
  totalAmount: number;
  paymentMethod: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  createdAt: number;
  synced: boolean;
}

interface OfflineState {
  orders: OfflineOrder[];
  isOnline: boolean;
  addOrder: (order: OfflineOrder) => void;
  removeOrder: (id: string) => void;
  markSynced: (id: string) => void;
  setIsOnline: (online: boolean) => void;
  getUnsyncedOrders: () => OfflineOrder[];
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      orders: [],
      isOnline: true,
      
      addOrder: (order) => set((state) => ({
        orders: [...state.orders, order],
      })),
      
      removeOrder: (id) => set((state) => ({
        orders: state.orders.filter((o) => o.id !== id),
      })),
      
      markSynced: (id) => set((state) => ({
        orders: state.orders.map((o) =>
          o.id === id ? { ...o, synced: true } : o
        ),
      })),
      
      setIsOnline: (online) => set({ isOnline: online }),
      
      getUnsyncedOrders: () => {
        const state = get();
        return state.orders.filter((o) => !o.synced);
      },
    }),
    {
      name: 'retailflow-offline',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Suspended Sales Store
interface SuspendedSalesState {
  suspendedSales: SuspendedSale[];
  suspendSale: (name: string, items: CartItem[], discountType: 'flat' | 'percentage' | null, discountValue: number, customerEmail: string, customerPhone: string, notes: string) => void;
  resumeSale: (id: string) => SuspendedSale | null;
  removeSuspendedSale: (id: string) => void;
}

export const useSuspendedSalesStore = create<SuspendedSalesState>()(
  persist(
    (set, get) => ({
      suspendedSales: [],
      
      suspendSale: (name, items, discountType, discountValue, customerEmail, customerPhone, notes) => set((state) => ({
        suspendedSales: [...state.suspendedSales, {
          id: `suspended_${Date.now()}`,
          name,
          items,
          discountType,
          discountValue,
          customerEmail,
          customerPhone,
          notes,
          createdAt: Date.now(),
        }],
      })),
      
      resumeSale: (id) => {
        const state = get();
        const sale = state.suspendedSales.find((s) => s.id === id);
        if (sale) {
          set((state) => ({
            suspendedSales: state.suspendedSales.filter((s) => s.id !== id),
          }));
        }
        return sale || null;
      },
      
      removeSuspendedSale: (id) => set((state) => ({
        suspendedSales: state.suspendedSales.filter((s) => s.id !== id),
      })),
    }),
    {
      name: 'retailflow-suspended',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
