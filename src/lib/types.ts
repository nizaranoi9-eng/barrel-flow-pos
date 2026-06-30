// Core types for RetailFlow POS

export type UserRole = 'admin' | 'cashier';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'mixed';

export type OrderStatus = 'completed' | 'refunded' | 'pending_sync';

export type DiscountType = 'flat' | 'percentage';

export type PlanType = 'free' | 'paid';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

// User type
export interface User {
  id: string;
  storeId: string;
  email: string;
  role: UserRole;
  employeePin: string | null;
  name: string;
  phone: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Store type
export interface Store {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Category type
export interface Category {
  id: string;
  storeId: string;
  name: string;
  taxRate: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    products: number;
  };
}

// Product type
export interface Product {
  id: string;
  storeId: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  costPrice: number;
  sellingPrice: number;
  // New inventory fields
  measurementUnit: string;
  packageType: string;
  packageSize: number;
  stockPackages: number;
  totalStockBaseUnit: number;
  // Liquor fields
  brand?: string | null;
  abv?: number;
  bottleSize?: string | null;
  mrp?: number;
  batchNumber?: string | null;
  expiryDate?: string | null;
  supplier?: string | null;
  // Legacy fields
  stockQuantity: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
}

// Order Item type
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
  product?: Product;
}

// Order type
export interface Order {
  id: string;
  storeId: string;
  cashierId: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  customerEmail: string | null;
  customerPhone: string | null;
  notes: string | null;
  createdAt: Date;
  syncedAt: Date | null;
  items: OrderItem[];
  payments: Payment[];
}

// Payment type
export interface Payment {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  createdAt: Date;
}

// Settings type
export interface Settings {
  id: string;
  storeId: string;
  defaultTaxRate: number;
  maxDiscountPercent: number;
  returnWindowHours: number;
  lowStockThreshold: number;
  receiptHeader: string | null;
  receiptFooter: string | null;
  currencySymbol: string;
  createdAt: Date;
  updatedAt: Date;
  accentColor?: string | null;
  enableAgeVerification?: boolean;
  minLegalAge?: number;
  requireDobBeforeCheckout?: boolean;
  cardThemeMode?: 'light' | 'dark' | null;
  categoriesInitialized?: boolean;
}

// Cart Item type (for POS)
export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  stockAvailable: number;
}

// Inventory Log type
export interface InventoryLog {
  id: string;
  productId: string;
  oldQuantity: number;
  newQuantity: number;
  reason: 'Sale' | 'Return' | 'Adjustment';
  orderId: string | null;
  createdBy: string;
  createdAt: Date;
}

// Subscription type
export interface Subscription {
  id: string;
  storeId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Usage type
export interface Usage {
  id: string;
  storeId: string;
  date: string;
  invoiceCount: number;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Report types
export interface DailySalesReport {
  date: string;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  totalProfit: number;
  transactionCount: number;
  averageBillValue: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface PaymentBreakdown {
  cash: number;
  card: number;
  upi: number;
}

export interface InventoryStatus {
  totalProducts: number;
  lowStockCount: number;
  totalStockValue: number;
  totalCostValue: number;
}

// Default categories for new stores
export const DEFAULT_CATEGORIES = [
  { name: 'Groceries', taxRate: 5.0 },
  { name: 'Dairy', taxRate: 5.0 },
  { name: 'Beverages', taxRate: 12.0 },
  { name: 'Snacks', taxRate: 12.0 },
  { name: 'Personal Care', taxRate: 18.0 },
  { name: 'Household', taxRate: 18.0 },
  { name: 'Electronics', taxRate: 18.0 },
  { name: 'Clothing', taxRate: 5.0 },
  { name: 'Stationery', taxRate: 18.0 },
  { name: 'Other', taxRate: 18.0 },
];

// Measurement Units - base units for inventory tracking
export const MEASUREMENT_UNITS = [
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'liter', label: 'Liter (L)' },
  { value: 'gram', label: 'Gram (g)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'piece', label: 'Piece' },
];

// Package Types - container/packaging types
export const PACKAGE_TYPES = [
  { value: 'bottle', label: 'Bottle' },
  { value: 'can', label: 'Can' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'bag', label: 'Bag' },
  { value: 'piece', label: 'Piece' },
];

// Legacy UNITS - kept for backwards compatibility
export const UNITS = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'g', label: 'Grams' },
  { value: 'l', label: 'Liters' },
  { value: 'ml', label: 'Milliliters' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'dozen', label: 'Dozen' },
];

// Helper function to format stock display
export function formatStockDisplay(
  stockPackages: number,
  packageType: string,
  packageSize: number,
  measurementUnit: string
): string {
  const total = stockPackages * packageSize;
  const unitLabel = MEASUREMENT_UNITS.find(u => u.value === measurementUnit)?.label.split(' ')[0] || measurementUnit;
  const pkgLabel = PACKAGE_TYPES.find(p => p.value === packageType)?.label || packageType;

  if (packageType === 'piece' && measurementUnit === 'piece') {
    return `${stockPackages} pieces`;
  }

  return `${stockPackages} ${pkgLabel}${stockPackages !== 1 ? 's' : ''} × ${packageSize} ${unitLabel} = ${total} ${unitLabel}`;
}

export interface LicenseDocument {
  id: string;
  name: string;
  type: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  notes: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileType: string | null;
  createdAt: string;
}
