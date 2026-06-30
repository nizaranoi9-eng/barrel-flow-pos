import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DEFAULT_CATEGORIES } from './types';

// Types representing our local storage database schema
interface MockDB {
  store: any;
  settings: any;
  users: any[];
  categories: any[];
  products: any[];
  orders: any[];
  inventoryLogs: any[];
  customers: any[];
  documents?: any[];
}

const STORAGE_KEY = 'barrelflow_mock_db';
const SESSION_KEY = 'barrelflow_mock_session';
const AUTH_INDEX_KEY = 'barrelflow_auth_index';
const DB_VERSION = '10';

export const shouldEnableMockApi =
  process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true' ||
  (process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_MOCK_API !== 'false');

function emptyDB(): MockDB {
  return { store: {}, settings: {}, users: [], categories: [], products: [], orders: [], inventoryLogs: [], customers: [], documents: [] };
}

function scopedStorageKey(userId?: string | null) {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}

function versionStorageKey(storageKey: string) {
  return `${storageKey}:version`;
}

function getAuthIndex(): Record<string, { userId: string; storageKey: string }> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(AUTH_INDEX_KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
}

function saveAuthIndex(index: Record<string, { userId: string; storageKey: string }>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_INDEX_KEY, JSON.stringify(index));
}

function registerAuthIndex(email: string, userId: string, storageKey: string) {
  if (!email) return;
  const index = getAuthIndex();
  index[email.toLowerCase()] = { userId, storageKey };
  saveAuthIndex(index);
}

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    if (session.user?.id) return session.user.id;
  } catch (e) {}

  try {
    const authState = JSON.parse(localStorage.getItem('retailflow-auth') || '{}');
    if (authState.state?.isAuthenticated && authState.state?.user?.id) {
      return authState.state.user.id;
    }
  } catch (e) {}

  return null;
}

function getCurrentStorageKey(): string {
  if (typeof window === 'undefined') return STORAGE_KEY;

  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    if (session.dataStorageKey) return session.dataStorageKey;
    if (session.user?.id) return scopedStorageKey(session.user.id);
  } catch (e) {}

  try {
    const authState = JSON.parse(localStorage.getItem('retailflow-auth') || '{}');
    if (authState.state?.isAuthenticated && authState.state?.user?.id) {
      return scopedStorageKey(authState.state.user.id);
    }
  } catch (e) {}

  return STORAGE_KEY;
}

function normalizeStoreScopedData(db: MockDB, storeId: string): MockDB {
  return {
    ...db,
    store: { ...db.store, id: storeId },
    settings: { ...db.settings, storeId },
    users: db.users.map(user => ({ ...user, storeId })),
    categories: db.categories.map(category => ({ ...category, storeId })),
    products: db.products.map(product => ({ ...product, storeId })),
    orders: db.orders.map(order => ({ ...order, storeId })),
    customers: db.customers.map(customer => ({ ...customer, storeId })),
    documents: db.documents?.map(document => ({ ...document, storeId })) || [],
  };
}

function seedBlankUserDatabase(storageKey: string, storeId: string, userName?: string, email?: string): MockDB {
  const demo = seedMockDatabase(storageKey, storeId);
  const storeName = userName
    ? `${userName}'s Store`
    : email
      ? `${email.split('@')[0]}'s Store`
      : 'My Store';

  const db: MockDB = {
    ...demo,
    store: {
      ...demo.store,
      id: storeId,
      name: storeName,
      phone: null,
      address: null,
      logoUrl: null,
    },
    settings: {
      ...demo.settings,
      id: `settings_${storeId}`,
      storeId,
      receiptHeader: `${storeName}\nThank you for shopping with us!`,
      receiptFooter: 'Thank you. Please visit again.',
    },
    users: [],
    categories: [],
    products: [],
    orders: [],
    inventoryLogs: [],
    customers: [],
    documents: [],
  };

  saveDBToStorageKey(db, storageKey);
  return db;
}

// Helper to load db from local storage
// Helper to load db from local storage
function getDB(): MockDB {
  if (typeof window === 'undefined') return emptyDB();
  const currentUserId = getCurrentUserId();
  const storageKey = getCurrentStorageKey();
  const data = localStorage.getItem(storageKey);
  const dbVersion = localStorage.getItem(versionStorageKey(storageKey));
  if (!data || dbVersion !== DB_VERSION) {
    if (currentUserId?.startsWith('supabase_')) {
      return seedBlankUserDatabase(storageKey, `store_${currentUserId}`);
    }
    return seedMockDatabase(storageKey);
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    if (currentUserId?.startsWith('supabase_')) {
      return seedBlankUserDatabase(storageKey, `store_${currentUserId}`);
    }
    return seedMockDatabase(storageKey);
  }
}

// Helper to save db to local storage
function saveDBToStorageKey(db: MockDB, storageKey: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey, JSON.stringify(db));
  localStorage.setItem(versionStorageKey(storageKey), DB_VERSION);
}

function saveDB(db: MockDB) {
  saveDBToStorageKey(db, getCurrentStorageKey());
}

function loadDBFromStorageKey(storageKey: string): MockDB | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(storageKey);
  const dbVersion = localStorage.getItem(versionStorageKey(storageKey));
  if (!data || dbVersion !== DB_VERSION) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

function findAuthStorageByEmail(email: string): { userId: string; storageKey: string; hasPassword: boolean; itemCount: number } | null {
  if (typeof window === 'undefined' || !email) return null;
  const normalizedEmail = email.toLowerCase();
  const matches: { userId: string; storageKey: string; hasPassword: boolean; itemCount: number }[] = [];

  for (let index = 0; index < localStorage.length; index++) {
    const storageKey = localStorage.key(index);
    if (!storageKey || storageKey.endsWith(':version')) continue;
    if (storageKey !== STORAGE_KEY && !storageKey.startsWith(`${STORAGE_KEY}:`)) continue;

    const candidateDb = loadDBFromStorageKey(storageKey);
    const user = candidateDb?.users.find(u => u.email?.toLowerCase() === normalizedEmail && u.role === 'admin');
    if (!candidateDb || !user) continue;

    matches.push({
      userId: user.id,
      storageKey,
      hasPassword: Boolean(user.password),
      itemCount:
        (candidateDb.products?.length || 0) +
        (candidateDb.orders?.length || 0) +
        (candidateDb.customers?.length || 0) +
        (candidateDb.categories?.length || 0),
    });
  }

  return matches.sort((a, b) => Number(b.hasPassword) - Number(a.hasPassword) || b.itemCount - a.itemCount)[0] || null;
}

function publicUser<T extends Record<string, any>>(user: T | null | undefined) {
  if (!user) return user;
  const { password, ...rest } = user;
  return {
    ...rest,
    employeePin: null,
  };
}

function publicSession<T extends Record<string, any>>(session: T) {
  return {
    ...session,
    user: publicUser(session.user),
  };
}

// Seed BarrelFlow Mock Data
function seedMockDatabase(storageKey = STORAGE_KEY, storeId = 'store_barrelflow'): MockDB {
  console.log('Seeding local storage BarrelFlow liquor mock database (v5)...');
  const store = {
    id: 'store_barrelflow',
    name: 'BarrelFlow Spirits',
    phone: '+91 (555) 728-1928',
    address: 'Shop 12, Premium Retail Hub, Whiskey Row, Louisville Row',
    logoUrl: null,
  };

  const settings = {
    id: 'settings_barrelflow',
    storeId: 'store_barrelflow',
    defaultTaxRate: 18.0,
    maxDiscountPercent: 15.0,
    returnWindowHours: 0, // Alcohol sales are final
    lowStockThreshold: 15,
    currencySymbol: '₹',
    receiptHeader: 'BARRELFLOW SPIRITS & WINES\nPremium Wines & Fine Spirits Boutique\nThank you for choosing BarrelFlow!',
    receiptFooter: 'Please drink responsibly. Statutory warning: Alcohol is injurious to health.',
    accentColor: '#D97706',
    enableAgeVerification: true,
    minLegalAge: 21,
    requireDobBeforeCheckout: false,
    cardThemeMode: 'light',
  };

  const users = [
    {
      id: 'user_admin',
      storeId: 'store_barrelflow',
      email: 'admin@demo.com',
      name: 'Store Manager',
      role: 'admin',
      employeePin: null,
      isActive: true,
    },
    {
      id: 'user_cashier',
      storeId: 'store_barrelflow',
      email: 'cashier@demo.com',
      name: 'Jason Miller',
      role: 'cashier',
      employeePin: null,
      isActive: true,
    }
  ];

  const categoryIdsByName: Record<string, string> = {
    Whisky: 'cat_whisky',
    Rum: 'cat_rum',
    Vodka: 'cat_vodka',
    Gin: 'cat_gin',
    Brandy: 'cat_brandy',
    Tequila: 'cat_tequila',
    Wine: 'cat_wine',
    Beer: 'cat_beer',
    'Craft Beer': 'cat_craft_beer',
    'Imported Beer': 'cat_imported_beer',
    Liqueurs: 'cat_liqueurs',
    'Champagne & Sparkling Wine': 'cat_champagne_sparkling_wine',
    'Ready-to-Drink': 'cat_ready_to_drink',
    'Mixers & Soda': 'cat_mixers_soda',
    'Energy Drinks': 'cat_energy_drinks',
    'Water & Soft Drinks': 'cat_water_soft_drinks',
    'Tobacco & Cigarettes': 'cat_tobacco_cigarettes',
    'Bar Accessories': 'cat_bar_accessories',
    Snacks: 'cat_snacks',
    Other: 'cat_other',
  };

  const categories = DEFAULT_CATEGORIES.map((category) => ({
    id: categoryIdsByName[category.name],
    storeId: 'store_barrelflow',
    name: category.name,
    taxRate: category.taxRate,
  }));

  const products = [
    // Beer
    { id: 'prod_1', storeId: 'store_barrelflow', categoryId: 'cat_beer', name: 'Kingfisher Premium Lager', sku: 'BR-KFP-65', barcode: '8901234567001', costPrice: 90.0, sellingPrice: 150.0, stockQuantity: 120, unit: 'bottle', brand: 'Kingfisher', abv: 4.8, bottleSize: '650ml', mrp: 150.0, batchNumber: 'B-KF2601', expiryDate: '2026-12-31', supplier: 'United Breweries', stockPackages: 120, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },
    { id: 'prod_2', storeId: 'store_barrelflow', categoryId: 'cat_beer', name: 'Budweiser Premium', sku: 'BR-BDP-65', barcode: '8901234567002', costPrice: 110.0, sellingPrice: 180.0, stockQuantity: 95, unit: 'bottle', brand: 'Budweiser', abv: 5.0, bottleSize: '650ml', mrp: 180.0, batchNumber: 'B-BW9011', expiryDate: '2026-11-30', supplier: 'Anheuser-Busch', stockPackages: 95, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },
    { id: 'prod_3', storeId: 'store_barrelflow', categoryId: 'cat_beer', name: 'Corona Extra', sku: 'BR-CRE-33', barcode: '8901234567003', costPrice: 140.0, sellingPrice: 220.0, stockQuantity: 70, unit: 'bottle', brand: 'Corona', abv: 4.5, bottleSize: '330ml', mrp: 220.0, batchNumber: 'B-CR4052', expiryDate: '2027-01-15', supplier: 'AB InBev', stockPackages: 70, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },

    // Whisky
    { id: 'prod_4', storeId: 'store_barrelflow', categoryId: 'cat_whisky', name: 'Jack Daniel’s Tennessee Whiskey', sku: 'WY-JDN-75', barcode: '8901234567004', costPrice: 1800.0, sellingPrice: 2800.0, stockQuantity: 45, unit: 'bottle', brand: 'Jack Daniel’s', abv: 40.0, bottleSize: '750ml', mrp: 2800.0, batchNumber: 'B-JD9011', expiryDate: 'N/A', supplier: 'Brown-Forman', stockPackages: 45, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },
    { id: 'prod_5', storeId: 'store_barrelflow', categoryId: 'cat_whisky', name: 'Jameson Irish Whiskey', sku: 'WY-JMS-75', barcode: '8901234567005', costPrice: 2000.0, sellingPrice: 3200.0, stockQuantity: 30, unit: 'bottle', brand: 'Jameson', abv: 40.0, bottleSize: '750ml', mrp: 3200.0, batchNumber: 'B-JM4022', expiryDate: 'N/A', supplier: 'Pernod Ricard', stockPackages: 30, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },
    { id: 'prod_6', storeId: 'store_barrelflow', categoryId: 'cat_whisky', name: 'Black Dog Triple Gold Reserve', sku: 'WY-BDG-75', barcode: '8901234567006', costPrice: 2200.0, sellingPrice: 3500.0, stockQuantity: 18, unit: 'bottle', brand: 'Black Dog', abv: 42.8, bottleSize: '750ml', mrp: 3500.0, batchNumber: 'B-BD1109', expiryDate: 'N/A', supplier: 'United Spirits Ltd', stockPackages: 18, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },
    { id: 'prod_7', storeId: 'store_barrelflow', categoryId: 'cat_whisky', name: 'Chivas Regal 12 Year', sku: 'WY-CHR-12', barcode: '8901234567007', costPrice: 3800.0, sellingPrice: 5500.0, stockQuantity: 12, unit: 'bottle', brand: 'Chivas Regal', abv: 40.0, bottleSize: '750ml', mrp: 5500.0, batchNumber: 'B-CR9801', expiryDate: 'N/A', supplier: 'Pernod Ricard', stockPackages: 12, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },

    // Vodka
    { id: 'prod_8', storeId: 'store_barrelflow', categoryId: 'cat_vodka', name: 'Smirnoff Triple Distilled', sku: 'VD-SMN-75', barcode: '8901234567008', costPrice: 900.0, sellingPrice: 1400.0, stockQuantity: 55, unit: 'bottle', brand: 'Smirnoff', abv: 37.5, bottleSize: '750ml', mrp: 1400.0, batchNumber: 'B-SF1043', expiryDate: 'N/A', supplier: 'Diageo', stockPackages: 55, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },
    { id: 'prod_9', storeId: 'store_barrelflow', categoryId: 'cat_vodka', name: 'Absolut Vodka', sku: 'VD-ABV-75', barcode: '8901234567009', costPrice: 1500.0, sellingPrice: 2400.0, stockQuantity: 40, unit: 'bottle', brand: 'Absolut', abv: 40.0, bottleSize: '750ml', mrp: 2400.0, batchNumber: 'B-AB3201', expiryDate: 'N/A', supplier: 'Pernod Ricard', stockPackages: 40, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },
    { id: 'prod_10', storeId: 'store_barrelflow', categoryId: 'cat_vodka', name: 'Grey Goose Vodka', sku: 'VD-GGV-75', barcode: '8901234567010', costPrice: 2800.0, sellingPrice: 4200.0, stockQuantity: 22, unit: 'bottle', brand: 'Grey Goose', abv: 40.0, bottleSize: '750ml', mrp: 4200.0, batchNumber: 'B-GG5021', expiryDate: 'N/A', supplier: 'Bacardi', stockPackages: 22, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },

    // Rum
    { id: 'prod_11', storeId: 'store_barrelflow', categoryId: 'cat_rum', name: 'Bacardi Carta Blanca', sku: 'RM-BCB-75', barcode: '8901234567011', costPrice: 1100.0, sellingPrice: 1700.0, stockQuantity: 48, unit: 'bottle', brand: 'Bacardi', abv: 37.5, bottleSize: '750ml', mrp: 1700.0, batchNumber: 'B-BC2003', expiryDate: 'N/A', supplier: 'Bacardi', stockPackages: 48, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },
    { id: 'prod_12', storeId: 'store_barrelflow', categoryId: 'cat_rum', name: 'Old Monk Rum', sku: 'RM-OMR-75', barcode: '8901234567012', costPrice: 600.0, sellingPrice: 950.0, stockQuantity: 80, unit: 'bottle', brand: 'Old Monk', abv: 42.8, bottleSize: '750ml', mrp: 950.0, batchNumber: 'B-OM3311', expiryDate: 'N/A', supplier: 'Mohan Meakin', stockPackages: 80, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },

    // Wine
    { id: 'prod_13', storeId: 'store_barrelflow', categoryId: 'cat_wine', name: 'Sula Shiraz Cabernet', sku: 'WN-SLA-75', barcode: '8901234567013', costPrice: 500.0, sellingPrice: 850.0, stockQuantity: 35, unit: 'bottle', brand: 'Sula Vineyards', abv: 13.5, bottleSize: '750ml', mrp: 850.0, batchNumber: 'B-SL8041', expiryDate: '2029-12-31', supplier: 'Sula Vineyards', stockPackages: 35, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },
    
    // Gin
    { id: 'prod_14', storeId: 'store_barrelflow', categoryId: 'cat_gin', name: 'Bombay Sapphire Gin', sku: 'GN-BMS-75', barcode: '8901234567014', costPrice: 1800.0, sellingPrice: 2800.0, stockQuantity: 28, unit: 'bottle', brand: 'Bombay Sapphire', abv: 47.0, bottleSize: '750ml', mrp: 2800.0, batchNumber: 'B-BS4031', expiryDate: 'N/A', supplier: 'Bacardi', stockPackages: 28, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },

    // Tequila
    { id: 'prod_15', storeId: 'store_barrelflow', categoryId: 'cat_tequila', name: 'Patrón Silver Tequila', sku: 'TQ-PTS-75', barcode: '8901234567015', costPrice: 3200.0, sellingPrice: 4800.0, stockQuantity: 15, unit: 'bottle', brand: 'Patrón', abv: 40.0, bottleSize: '750ml', mrp: 4800.0, batchNumber: 'B-PT9042', expiryDate: 'N/A', supplier: 'Bacardi', stockPackages: 15, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },

    // Brandy
    { id: 'prod_16', storeId: 'store_barrelflow', categoryId: 'cat_brandy', name: 'Hennessy VS Cognac', sku: 'BD-HNS-75', barcode: '8901234567016', costPrice: 3500.0, sellingPrice: 5200.0, stockQuantity: 10, unit: 'bottle', brand: 'Hennessy', abv: 40.0, bottleSize: '750ml', mrp: 5200.0, batchNumber: 'B-HN8841', expiryDate: 'N/A', supplier: 'LVMH', stockPackages: 10, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true },

    // Tobacco & Cigarettes
    { id: 'prod_17', storeId: 'store_barrelflow', categoryId: 'cat_tobacco_cigarettes', name: 'Marlboro Gold Cigarettes', sku: 'CG-MBG-20', barcode: '8901234567017', costPrice: 280.0, sellingPrice: 380.0, stockQuantity: 150, unit: 'pack', brand: 'Marlboro', abv: 0.0, bottleSize: '20s Pack', mrp: 380.0, batchNumber: 'B-MB1011', expiryDate: '2028-06-30', supplier: 'Philip Morris International', stockPackages: 150, packageType: 'pack', packageSize: 1, measurementUnit: 'piece', isActive: true },

    // Snacks
    { id: 'prod_18', storeId: 'store_barrelflow', categoryId: 'cat_snacks', name: 'Lays Classic Salted Chips', sku: 'SN-LYS-01', barcode: '8901234567018', costPrice: 15.0, sellingPrice: 30.0, stockQuantity: 200, unit: 'pcs', brand: 'Lays', abv: 0.0, bottleSize: '50g', mrp: 30.0, batchNumber: 'B-LY4422', expiryDate: '2026-09-30', supplier: 'PepsiCo', stockPackages: 200, packageType: 'bag', packageSize: 1, measurementUnit: 'piece', isActive: true },

    // Mixers & Soda
    { id: 'prod_19', storeId: 'store_barrelflow', categoryId: 'cat_mixers_soda', name: 'Fever-Tree Tonic Water', sku: 'MX-FTT-20', barcode: '8901234567019', costPrice: 70.0, sellingPrice: 120.0, stockQuantity: 80, unit: 'bottle', brand: 'Fever-Tree', abv: 0.0, bottleSize: '200ml', mrp: 120.0, batchNumber: 'B-FT6021', expiryDate: '2027-03-31', supplier: 'Fever-Tree Ltd', stockPackages: 80, packageType: 'bottle', packageSize: 1, measurementUnit: 'ml', isActive: true }
  ];

  // Completed transactions
  const orders = [
    {
      id: 'ord_1',
      storeId: 'store_barrelflow',
      cashierId: 'user_cashier',
      invoiceNumber: 'INV-2026-0001',
      subtotal: 14000.0,
      taxAmount: 2520.0,
      discountAmount: 500.0,
      discountType: 'flat',
      discountValue: 500,
      totalAmount: 16020.0,
      paymentMethod: 'card',
      status: 'completed',
      customerEmail: 'cust1@example.com',
      customerPhone: '+91 98765 01001',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { productId: 'prod_4', productName: 'Jack Daniel’s Tennessee Whiskey', quantity: 2, unitPrice: 2800.0, taxRate: 18.0, lineTotal: 5600.0 },
        { productId: 'prod_10', productName: 'Grey Goose Vodka', quantity: 2, unitPrice: 4200.0, taxRate: 18.0, lineTotal: 8400.0 }
      ]
    },
    {
      id: 'ord_2',
      storeId: 'store_barrelflow',
      cashierId: 'user_cashier',
      invoiceNumber: 'INV-2026-0002',
      subtotal: 300.0,
      taxAmount: 54.0,
      discountAmount: 0.0,
      discountType: null,
      discountValue: 0,
      totalAmount: 354.0,
      paymentMethod: 'cash',
      status: 'completed',
      customerPhone: '+91 98765 01002',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { productId: 'prod_1', productName: 'Kingfisher Premium Lager', quantity: 2, unitPrice: 150.0, taxRate: 18.0, lineTotal: 300.0 }
      ]
    },
    {
      id: 'ord_3',
      storeId: 'store_barrelflow',
      cashierId: 'user_cashier',
      invoiceNumber: 'INV-2026-0003',
      subtotal: 5040.0,
      taxAmount: 892.8,
      discountAmount: 500.0,
      discountType: 'percentage',
      discountValue: 10,
      totalAmount: 5432.8,
      paymentMethod: 'upi',
      status: 'completed',
      createdAt: new Date().toISOString(),
      items: [
        { productId: 'prod_15', productName: 'Patrón Silver Tequila', quantity: 1, unitPrice: 4800.0, taxRate: 18.0, lineTotal: 4800.0 },
        { productId: 'prod_19', productName: 'Fever-Tree Tonic Water', quantity: 2, unitPrice: 120.0, taxRate: 12.0, lineTotal: 240.0 }
      ]
    }
  ];

  const customers = [
    {
      id: 'cust_1',
      name: 'Sarah Connor',
      phone: '+91 98765 01001',
      email: 'cust1@example.com',
      address: '123 Cyberdyne Way',
      totalOrders: 1,
      totalSpent: 16300.0,
      lastOrder: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'cust_2',
      name: 'John Doe',
      phone: '+91 98765 01002',
      email: 'cust2@example.com',
      address: '456 Elm Street',
      totalOrders: 1,
      totalSpent: 354.0,
      lastOrder: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  const documents = [
    {
      id: 'doc_liquor_lic',
      name: 'Excise Liquor License (L-2)',
      type: 'Liquor License',
      issuingAuthority: 'State Excise Department',
      issueDate: '2026-04-01',
      expiryDate: '2027-03-31',
      notes: 'Main retail sale license. Displayed at cash counter.',
      fileName: 'Excise_Liquor_License_2026_27.pdf',
      fileUrl: null,
      fileType: 'application/pdf',
      createdAt: new Date().toISOString()
    },
    {
      id: 'doc_gst',
      name: 'GSTIN Registration Certificate (REG-06)',
      type: 'GST Certificate',
      issuingAuthority: 'Goods and Services Tax Authority',
      issueDate: '2022-08-15',
      expiryDate: '2032-08-14',
      notes: 'GSTIN: 27AAAAA1111A1Z1. Required for tax filing and audits.',
      fileName: 'GST_Registration_Certificate.pdf',
      fileUrl: null,
      fileType: 'application/pdf',
      createdAt: new Date().toISOString()
    },
    {
      id: 'doc_trade',
      name: 'Annual Trade & Business License',
      type: 'Trade License',
      issuingAuthority: 'Municipal Corporation of Greater Mumbai',
      issueDate: '2025-06-15',
      expiryDate: '2026-06-12',
      notes: 'Annual renewal fee is due by June 10. Needs excise clearance certificate.',
      fileName: 'Trade_License_Municipal_2025_26.pdf',
      fileUrl: null,
      fileType: 'application/pdf',
      createdAt: new Date().toISOString()
    },
    {
      id: 'doc_fssai',
      name: 'Food Safety License (FSSAI State License)',
      type: 'FSSAI License',
      issuingAuthority: 'Food Safety and Standards Authority of India',
      issueDate: '2024-11-21',
      expiryDate: '2026-11-20',
      notes: 'Mandatory for selling packaged snacks and mixers.',
      fileName: 'FSSAI_Food_Safety_License.pdf',
      fileUrl: null,
      fileType: 'application/pdf',
      createdAt: new Date().toISOString()
    },
    {
      id: 'doc_fire',
      name: 'Fire Safety & NOC Certificate',
      type: 'Fire Safety Certificate',
      issuingAuthority: 'State Fire & Emergency Services',
      issueDate: '2025-05-23',
      expiryDate: '2026-05-22',
      notes: 'NOC expired on May 22. Inspection scheduled but pending inspector visit.',
      fileName: 'Fire_NOC_Certificate_2025.pdf',
      fileUrl: null,
      fileType: 'application/pdf',
      createdAt: new Date().toISOString()
    },
    {
      id: 'doc_shop',
      name: 'Shop & Establishment License (Gumasta)',
      type: 'Shop Registration',
      issuingAuthority: 'Department of Labour, State Govt',
      issueDate: '2023-09-16',
      expiryDate: '2028-09-15',
      notes: 'Shop Registration code: SR-449102-X.',
      fileName: 'Shop_Establishment_Registration.pdf',
      fileUrl: null,
      fileType: 'application/pdf',
      createdAt: new Date().toISOString()
    }
  ];

  const db = normalizeStoreScopedData({ store, settings, users, categories, products, orders, inventoryLogs: [], customers, documents }, storeId);
  localStorage.setItem(storageKey, JSON.stringify(db));
  localStorage.setItem('mock_db_initialized', 'true');
  localStorage.setItem(versionStorageKey(storageKey), DB_VERSION);
  return db;
}

// Intercept window.fetch
export function initMockFetch() {
  if (typeof window === 'undefined') return;
  if (!shouldEnableMockApi) return;
  if ((window as any).__mockFetchInitialized) return;
  (window as any).__mockFetchInitialized = true;

  console.log('Glamstitch client-side mock fetch router active. Version: 2');
  
  // Seed DB if not present
  getDB();

  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else {
      url = input.url;
    }

    const parsedUrl = new URL(url, window.location.origin);
    const pathname = parsedUrl.pathname;
    
    // Check if it's a local api call
    if (!pathname.startsWith('/api/')) {
      return originalFetch(input, init);
    }

    const method = (init?.method || 'GET').toUpperCase();
    let body: any = {};
    if (init?.body) {
      try {
        body = JSON.parse(String(init.body));
      } catch (e) {}
    }

    // Mock API Route Mapping
    try {
      const response = await routeRequest(pathname, method, body, parsedUrl.searchParams);
      if (response) return response;
    } catch (e: any) {
      console.error('Mock route processing error:', e);
      return new Response(JSON.stringify({ success: false, error: e.message || 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fallback
    return originalFetch(input, init);
  };
}

// Router handler to mock HTTP endpoints
async function routeRequest(pathname: string, method: string, body: any, query: URLSearchParams): Promise<Response | null> {
  let db = getDB();

  // Helper to send json response
  const jsonResponse = (data: any, status: number = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  // --- Auth Routes ---
  if (pathname === '/api/auth/login' && method === 'POST') {
    const { email, password } = body;
    const indexedUser = email ? getAuthIndex()[String(email).toLowerCase()] : null;
    const discoveredUser = email ? findAuthStorageByEmail(String(email)) : null;
    const authUser = discoveredUser?.hasPassword ? discoveredUser : indexedUser || discoveredUser;
    if (authUser) {
      db = loadDBFromStorageKey(authUser.storageKey) || db;
    }
    const user = db.users.find(u => u.email === email && u.role === 'admin');
    const userPassword = user?.password;
    if (user && userPassword && password === userPassword) {
      const session = {
        user,
        store: db.store,
        settings: db.settings,
        dataStorageKey: authUser?.storageKey || scopedStorageKey(user.id),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(publicSession(session)));
      registerAuthIndex(email, user.id, session.dataStorageKey);
      return jsonResponse({ success: true, data: publicSession(session) });
    }
    return jsonResponse({ success: false, error: 'Invalid email or password.' }, 401);
  }

  if (pathname === '/api/auth/verify-manager-pin' && method === 'POST') {
    const { pin } = body;
    const user = db.users.find(u => u.role === 'admin' && u.employeePin === pin);
    if (user) {
      return jsonResponse({ success: true, message: 'Manager override approved' });
    }
    return jsonResponse({ success: false, error: 'Invalid manager PIN. Access denied.' }, 401);
  }

  if (pathname === '/api/auth/pin-login' && method === 'POST') {
    const { pin } = body;
    const user = db.users.find(u => u.role === 'cashier' && u.employeePin === pin);
    if (user) {
      const session = { user, store: db.store, settings: db.settings, dataStorageKey: getCurrentStorageKey() };
      localStorage.setItem(SESSION_KEY, JSON.stringify(publicSession(session)));
      return jsonResponse({ success: true, data: publicSession(session) });
    }
    return jsonResponse({ success: false, error: 'Invalid PIN.' }, 401);
  }

  if (pathname === '/api/auth/signup' && method === 'POST') {
    const { email, password, name, storeName, storePhone, storeAddress } = body;
    const newStore = {
      id: 'store_' + Math.random().toString(36).substr(2, 9),
      name: storeName,
      phone: storePhone || null,
      address: storeAddress || null
    };
    const newUser = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      storeId: newStore.id,
      email,
      password,
      name,
      role: 'admin',
      isActive: true
    };
    db.store = newStore;
    db.users.push(newUser);
    db.users.push({
      id: 'user_cashier_' + Math.random().toString(36).substr(2, 9),
      storeId: newStore.id,
      email: 'cashier@' + email.split('@')[1],
      name: 'Cashier Staff',
      role: 'cashier',
      employeePin: null,
      isActive: true
    });
    const dataStorageKey = scopedStorageKey(newUser.id);
    saveDBToStorageKey(db, dataStorageKey);
    registerAuthIndex(email, newUser.id, dataStorageKey);
    
    const session = { user: newUser, store: newStore, settings: db.settings, dataStorageKey };
    localStorage.setItem(SESSION_KEY, JSON.stringify(publicSession(session)));
    return jsonResponse({ success: true, data: publicSession(session) });
  }

  if (pathname === '/api/auth/supabase-session' && method === 'POST') {
    const { id, email, name } = body;

    if (!id || !email) {
      return jsonResponse({ success: false, error: 'Missing Supabase user details' }, 400);
    }

    const supabaseUserId = 'supabase_' + String(id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const indexedUser = getAuthIndex()[String(email).toLowerCase()];
    const discoveredUser = findAuthStorageByEmail(String(email));
    const authUser = discoveredUser?.hasPassword ? discoveredUser : indexedUser || discoveredUser;
    const userStorageKey = authUser?.storageKey || scopedStorageKey(supabaseUserId);
    const userDbVersion = localStorage.getItem(versionStorageKey(userStorageKey));
    const userDb = localStorage.getItem(userStorageKey);
    const fallbackStoreId = `store_${supabaseUserId}`;
    db = userDb && userDbVersion === DB_VERSION
      ? JSON.parse(userDb)
      : seedBlankUserDatabase(userStorageKey, fallbackStoreId, name, email);

    const existingStoreId = db.store?.id || fallbackStoreId;
    let user = db.users.find(u => u.email?.toLowerCase() === String(email).toLowerCase() || u.id === authUser?.userId || u.id === supabaseUserId);
    const userId = user?.id || authUser?.userId || supabaseUserId;

    if (user) {
      user = {
        ...user,
        id: userId,
        email,
        name: name || user.name || email,
        role: user.role || 'admin',
        storeId: existingStoreId,
        employeePin: user.employeePin ?? null,
        isActive: true,
      };
      db.users = db.users.map(u => (u.id === user!.id || u.email === email ? user : u));
    } else {
      user = {
        id: userId,
        storeId: existingStoreId,
        email,
        name: name || email,
        role: 'admin',
        employeePin: null,
        isActive: true,
      };
      db.users.push(user);
    }

    db = normalizeStoreScopedData(db, existingStoreId);
    db.users = db.users.map(u => (u.id === user!.id || u.email === email ? { ...user, storeId: existingStoreId } : u));
    saveDBToStorageKey(db, userStorageKey);
    registerAuthIndex(email, user.id, userStorageKey);

    const session = { user, store: db.store, settings: db.settings, dataStorageKey: userStorageKey };
    localStorage.setItem(SESSION_KEY, JSON.stringify(publicSession(session)));
    return jsonResponse({ success: true, data: publicSession(session) });
  }

  if (pathname === '/api/auth/google-password-reset' && method === 'POST') {
    const { email, password } = body;
    if (!email || !password || String(password).length < 6) {
      return jsonResponse({ success: false, error: 'Email and a password of at least 6 characters are required' }, 400);
    }

    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
    if (session.user?.email?.toLowerCase() !== String(email).toLowerCase()) {
      return jsonResponse({ success: false, error: 'Google account does not match this reset request' }, 403);
    }

    const userId = session.user.id;
    const userStorageKey = session.dataStorageKey || scopedStorageKey(userId);
    db = loadDBFromStorageKey(userStorageKey) || db;
    const existingUser = db.users.find(u => u.id === userId || u.email?.toLowerCase() === String(email).toLowerCase());
    const updatedUser = {
      ...(existingUser || session.user),
      id: userId,
      email,
      password,
      role: 'admin',
      storeId: session.store?.id || db.store.id,
      isActive: true,
    };

    if (existingUser) {
      db.users = db.users.map(u => (u.id === existingUser.id || u.email === email ? updatedUser : u));
    } else {
      db.users.push(updatedUser);
    }

    saveDBToStorageKey(db, userStorageKey);
    registerAuthIndex(email, userId, userStorageKey);
    const nextSession = { ...session, user: updatedUser, store: db.store, settings: db.settings, dataStorageKey: userStorageKey };
    localStorage.setItem(SESSION_KEY, JSON.stringify(publicSession(nextSession)));
    return jsonResponse({ success: true, data: publicSession(nextSession) });
  }

  if (pathname === '/api/auth/logout' && method === 'POST') {
    localStorage.removeItem(SESSION_KEY);
    return jsonResponse({ success: true });
  }

  if (pathname === '/api/auth/session' && method === 'GET') {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      return jsonResponse({ success: true, data: publicSession(JSON.parse(session)) });
    }
    // Try retailflow-auth as fallback
    const authStateStr = localStorage.getItem('retailflow-auth');
    if (authStateStr) {
      try {
        const authState = JSON.parse(authStateStr);
        if (authState.state?.user && authState.state?.store) {
          const fallbackSession = {
            user: authState.state.user,
            store: authState.state.store,
            settings: authState.state.settings || db.settings,
            dataStorageKey: scopedStorageKey(authState.state.user.id),
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(publicSession(fallbackSession)));
          return jsonResponse({ success: true, data: publicSession(fallbackSession) });
        }
      } catch (e) {}
    }
    return jsonResponse({ success: false, error: 'Not authenticated' }, 401);
  }

  if (pathname === '/api/auth/update-credentials' && method === 'POST') {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) {
      return jsonResponse({ success: false, error: 'Not authenticated' }, 401);
    }
    const session = JSON.parse(sessionStr);
    
    // Update local DB user
    const dbUser = db.users.find(u => u.id === session.user.id);
    if (dbUser) {
      if (body.newName) dbUser.name = body.newName;
      if (body.newEmail) dbUser.email = body.newEmail;
      if (body.newPhone !== undefined) dbUser.phone = body.newPhone;
      if (body.newPassword) dbUser.password = body.newPassword;
      saveDB(db);
    }

    // Update active session
    if (body.newName) session.user.name = body.newName;
    if (body.newEmail) session.user.email = body.newEmail;
    if (body.newPhone !== undefined) session.user.phone = body.newPhone;
    localStorage.setItem(SESSION_KEY, JSON.stringify(publicSession(session)));
    registerAuthIndex(session.user.email, session.user.id, session.dataStorageKey || getCurrentStorageKey());

    return jsonResponse({
      success: true,
      message: 'Credentials updated successfully',
      user: publicUser(session.user)
    });
  }

  // --- Store & Settings Routes ---
  if (pathname === '/api/store') {
    if (method === 'GET') return jsonResponse({ success: true, data: db.store });
    if (method === 'POST' || method === 'PUT') {
      db.store = { ...db.store, ...body };
      saveDB(db);
      
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        session.store = db.store;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
      
      return jsonResponse({ success: true, data: db.store });
    }
  }

  if (pathname === '/api/settings') {
    if (method === 'GET') return jsonResponse({ success: true, data: db.settings });
    if (method === 'POST' || method === 'PUT') {
      db.settings = { ...db.settings, ...body };
      saveDB(db);
      
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        session.settings = db.settings;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
      
      return jsonResponse({ success: true, data: db.settings });
    }
  }

  // --- Customers Routes ---
  if (pathname === '/api/customers') {
    if (method === 'GET') {
      return jsonResponse({ success: true, data: db.customers || [] });
    }
    if (method === 'POST') {
      const newCustomer = {
        id: 'cust_' + Math.random().toString(36).substr(2, 9),
        name: body.name || 'Unknown Customer',
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: null,
        createdAt: new Date().toISOString()
      };
      if (!db.customers) db.customers = [];
      db.customers.push(newCustomer);
      saveDB(db);
      return jsonResponse({ success: true, data: newCustomer });
    }
  }

  const customerMatch = pathname.match(/^\/api\/customers\/([^\/]+)$/);
  if (customerMatch) {
    const customerId = customerMatch[1];
    if (method === 'PUT') {
      if (!db.customers) db.customers = [];
      const customer = db.customers.find(c => c.id === customerId);
      if (customer) {
        if (body.name !== undefined) customer.name = body.name;
        if (body.phone !== undefined) customer.phone = body.phone;
        if (body.email !== undefined) customer.email = body.email;
        if (body.address !== undefined) customer.address = body.address;
        saveDB(db);
        return jsonResponse({ success: true, data: customer });
      }
      return jsonResponse({ success: false, error: 'Customer not found' }, 404);
    }
    if (method === 'DELETE') {
      if (!db.customers) db.customers = [];
      db.customers = db.customers.filter(c => c.id !== customerId);
      saveDB(db);
      return jsonResponse({ success: true });
    }
  }

  // --- Categories Routes ---
  if (pathname === '/api/categories') {
    if (method === 'GET') {
      const categoriesWithCount = db.categories.map(c => ({
        ...c,
        _count: {
          products: db.products.filter(p => p.categoryId === c.id && p.isActive).length
        }
      }));
      return jsonResponse({ success: true, data: categoriesWithCount });
    }
    if (method === 'POST') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const existing = db.categories.find(c => c.name.trim().toLowerCase() === name.toLowerCase());
      if (!name) {
        return jsonResponse({ success: false, error: 'Category name is required.' }, 400);
      }
      if (existing) {
        return jsonResponse({ success: false, error: `Category "${existing.name}" already exists.` }, 409);
      }
      const newCat = {
        id: 'cat_' + Math.random().toString(36).substr(2, 9),
        storeId: db.store.id,
        name,
        taxRate: body.taxRate || 10.0
      };
      db.categories.push(newCat);
      saveDB(db);
      return jsonResponse({ success: true, data: newCat });
    }
  }

  // Category ID details
  const categoryMatch = pathname.match(/^\/api\/categories\/([^\/]+)$/);
  if (categoryMatch) {
    const catId = categoryMatch[1];
    if (method === 'PUT') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const duplicate = db.categories.find(c => c.id !== catId && c.name.trim().toLowerCase() === name.toLowerCase());
      if (!name) {
        return jsonResponse({ success: false, error: 'Category name is required.' }, 400);
      }
      if (duplicate) {
        db.products = db.products.map(p => p.categoryId === catId ? { ...p, categoryId: duplicate.id } : p);
        db.categories = db.categories
          .filter(c => c.id !== catId)
          .map(c => c.id === duplicate.id ? { ...c, taxRate: body.taxRate || c.taxRate } : c);
        saveDB(db);
        return jsonResponse({ success: true, data: db.categories.find(c => c.id === duplicate.id) });
      }
      db.categories = db.categories.map(c => c.id === catId ? { ...c, ...body, name } : c);
      saveDB(db);
      return jsonResponse({ success: true, data: db.categories.find(c => c.id === catId) });
    }
    if (method === 'DELETE') {
      db.categories = db.categories.filter(c => c.id !== catId);
      // Remove category reference from products
      db.products = db.products.map(p => p.categoryId === catId ? { ...p, categoryId: null } : p);
      saveDB(db);
      return jsonResponse({ success: true });
    }
  }

  // --- Products Routes ---
  if (pathname === '/api/products') {
    if (method === 'GET') {
      const activeProducts = db.products.filter(p => p.isActive)
        .map(p => ({
          ...p,
          category: db.categories.find(c => c.id === p.categoryId)
        }));
      return jsonResponse({ success: true, data: activeProducts });
    }
    if (method === 'POST') {
      const id = 'prod_' + Math.random().toString(36).substr(2, 9);
      const newProd = {
        id,
        storeId: db.store.id,
        isActive: true,
        ...body,
        stockQuantity: body.stockQuantity || body.stockPackages || 0
      };
      db.products.push(newProd);
      saveDB(db);
      return jsonResponse({ success: true, data: newProd });
    }
  }

  if (pathname === '/api/products/search') {
    const q = query.get('q')?.toLowerCase() || '';
    const filtered = db.products.filter(p => p.isActive && (p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.includes(q)))
      .map(p => ({
        ...p,
        category: db.categories.find(c => c.id === p.categoryId)
      }));
    return jsonResponse({ success: true, data: filtered });
  }

  if (pathname === '/api/products/bulk-delete' && method === 'POST') {
    console.log('Mock fetch bulk-delete called. Body:', body);
    const targetIds = body.productIds || body.ids || [];
    console.log('Target IDs parsed:', targetIds);
    db.products = db.products.map(p => targetIds.includes(p.id) ? { ...p, isActive: false } : p);
    saveDB(db);
    return jsonResponse({ success: true, data: { deletedCount: targetIds.length } });
  }

  const barcodeMatch = pathname.match(/^\/api\/products\/barcode\/([^\/]+)$/);
  if (barcodeMatch) {
    const barcode = barcodeMatch[1];
    const product = db.products.find(p => p.isActive && p.barcode === barcode);
    if (product) {
      return jsonResponse({
        success: true,
        data: {
          ...product,
          category: db.categories.find(c => c.id === product.categoryId)
        }
      });
    }
    return jsonResponse({ success: false, error: 'Product not found' }, 404);
  }

  const productMatch = pathname.match(/^\/api\/products\/([^\/]+)$/);
  if (productMatch) {
    const prodId = productMatch[1];
    if (method === 'GET') {
      const product = db.products.find(p => p.id === prodId);
      return jsonResponse({ success: true, data: product });
    }
    if (method === 'PUT') {
      db.products = db.products.map(p => p.id === prodId ? { ...p, ...body } : p);
      saveDB(db);
      return jsonResponse({ success: true, data: db.products.find(p => p.id === prodId) });
    }
    if (method === 'DELETE') {
      db.products = db.products.map(p => p.id === prodId ? { ...p, isActive: false } : p);
      saveDB(db);
      return jsonResponse({ success: true });
    }
  }

  // --- Orders Routes ---
  if (pathname === '/api/orders') {
    if (method === 'GET') {
      // Hydrate orders with cashier names
      const orders = db.orders.map(o => ({
        ...o,
        cashier: db.users.find(u => u.id === o.cashierId) || { name: 'Cashier Staff' }
      }));
      return jsonResponse({ success: true, data: orders });
    }
    if (method === 'POST') {
      let cashierId = 'user_cashier';
      try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
        if (session.user?.id) {
          cashierId = session.user.id;
        } else {
          const authStateStr = localStorage.getItem('retailflow-auth');
          if (authStateStr) {
            const authState = JSON.parse(authStateStr);
            if (authState.state?.user?.id) {
              cashierId = authState.state.user.id;
            }
          }
        }
      } catch (e) {}
      
      const invoiceNumber = 'INV-2026-' + String(db.orders.length + 1001);
      const newOrder = {
        id: 'ord_' + Math.random().toString(36).substr(2, 9),
        storeId: db.store.id,
        cashierId,
        invoiceNumber,
        subtotal: body.subtotal,
        taxAmount: body.taxAmount,
        discountAmount: body.discountAmount,
        discountType: body.discountType || null,
        discountValue: body.discountValue || 0,
        totalAmount: body.totalAmount,
        paymentMethod: body.paymentMethod,
        status: 'completed',
        customerEmail: body.customerEmail || null,
        customerPhone: body.customerPhone || null,
        createdAt: new Date().toISOString(),
        items: body.items.map((i: any) => ({
          id: 'item_' + Math.random().toString(36).substr(2, 9),
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate,
          lineTotal: i.unitPrice * i.quantity
        }))
      };

      // Deduct stock quantity
      newOrder.items.forEach((item: any) => {
        db.products = db.products.map(p => {
          if (p.id === item.productId) {
            const newQty = Math.max(0, p.stockQuantity - item.quantity);
            // Log inventory change
            db.inventoryLogs.push({
              id: 'log_' + Math.random().toString(36).substr(2, 9),
              productId: p.id,
              oldQuantity: p.stockQuantity,
              newQuantity: newQty,
              reason: 'Sale',
              createdBy: cashierId,
              createdAt: new Date().toISOString()
            });
            return {
              ...p,
              stockQuantity: newQty,
              stockPackages: newQty // Keep in sync
            };
          }
          return p;
        });
      });

      db.orders.push(newOrder);
      saveDB(db);
      return jsonResponse({ success: true, data: newOrder });
    }
  }

  // Order export handler
  if (pathname === '/api/orders/export') {
    const from = query.get('from') || '';
    const to = query.get('to') || '';
    const format_type = query.get('format') || 'excel';

    const fromDate = new Date(from + 'T00:00:00');
    const toDate = new Date(to + 'T23:59:59');

    const filteredOrders = db.orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= fromDate && orderDate <= toDate && o.status === 'completed';
    });

    if (format_type === 'csv') {
      const data = filteredOrders.map(order => ({
        'Invoice Number': order.invoiceNumber,
        'Date': order.createdAt.split('T')[0],
        'Items': order.items.length,
        'Subtotal': order.subtotal,
        'Tax (VAT)': order.taxAmount,
        'Discount': order.discountAmount,
        'Total': order.totalAmount,
        'Payment Method': order.paymentMethod.toUpperCase(),
        'Status': order.status.toUpperCase(),
      }));

      const headers = Object.keys(data[0] || {
        'Invoice Number': '',
        'Date': '',
        'Items': '',
        'Subtotal': '',
        'Tax (VAT)': '',
        'Discount': '',
        'Total': '',
        'Payment Method': '',
        'Status': '',
      });
      const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const csv = [
        headers.map(escapeCsv).join(','),
        ...data.map(row => headers.map(header => escapeCsv(row[header as keyof typeof row])).join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      return new Response(blob, {
        headers: {
          'Content-Disposition': `attachment; filename="transactions-${from}-to-${to}.csv"`
        }
      });
    }

    if (format_type === 'pdf') {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 297, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Transaction Report', 148.5, 10, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${from} to ${to}`, 148.5, 18, { align: 'center' });

      const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      doc.setTextColor(31, 41, 55);
      doc.text(`Total Transactions: ${filteredOrders.length}`, 15, 35);
      doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 100, 35);

      const tableData = filteredOrders.map(order => [
        order.invoiceNumber,
        order.createdAt.split('T')[0],
        order.items.length.toString(),
        `$${order.subtotal.toFixed(2)}`,
        `$${order.taxAmount.toFixed(2)}`,
        `$${order.totalAmount.toFixed(2)}`,
        order.paymentMethod.toUpperCase(),
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Invoice', 'Date', 'Items', 'Subtotal', 'Tax', 'Total', 'Payment']],
        body: tableData,
      });

      const pdfBlob = doc.output('blob');
      return new Response(pdfBlob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="transactions-${from}-to-${to}.pdf"`
        }
      });
    }
  }

  // PDF download handler for single order
  const orderPdfMatch = pathname.match(/^\/api\/orders\/([^\/]+)\/pdf$/);
  if (orderPdfMatch) {
    const orderId = orderPdfMatch[1];
    const order = db.orders.find(o => o.id === orderId);
    if (!order) return jsonResponse({ success: false, error: 'Order not found' }, 404);

    const doc = new jsPDF();
    doc.setFont('helvetica');
    doc.text('TAX INVOICE', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Store: ${db.store.name}`, 15, 25);
    doc.text(`Invoice: ${order.invoiceNumber}`, 15, 30);
    doc.text(`Date: ${order.createdAt.split('T')[0]}`, 15, 35);

    const itemsData = order.items.map((i: any) => [
      i.productName,
      i.quantity.toString(),
      `$${i.unitPrice.toFixed(2)}`,
      `$${i.lineTotal.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Item Name', 'Qty', 'Unit Price', 'Total']],
      body: itemsData,
    });

    const pdfBlob = doc.output('blob');
    return new Response(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.invoiceNumber}.pdf"`
      }
    });
  }

  const orderMatch = pathname.match(/^\/api\/orders\/([^\/]+)$/);
  if (orderMatch) {
    const orderId = orderMatch[1];
    if (method === 'GET') {
      const order = db.orders.find(o => o.id === orderId);
      if (order) {
        return jsonResponse({
          success: true,
          data: {
            ...order,
            cashier: db.users.find(u => u.id === order.cashierId) || { name: 'Cashier Staff' }
          }
        });
      }
      return jsonResponse({ success: false, error: 'Order not found' }, 404);
    }
    if (method === 'DELETE') {
      const order = db.orders.find(o => o.id === orderId);
      if (order) {
        // Refund inventory stock
        order.items.forEach((item: any) => {
          db.products = db.products.map(p => {
            if (p.id === item.productId) {
              const newQty = p.stockQuantity + item.quantity;
              return {
                ...p,
                stockQuantity: newQty,
                stockPackages: newQty
              };
            }
            return p;
          });
        });
        db.orders = db.orders.map(o => o.id === orderId ? { ...o, status: 'refunded' } : o);
        saveDB(db);
        return jsonResponse({ success: true });
      }
      return jsonResponse({ success: false, error: 'Order not found' }, 404);
    }
  }

  // --- Documents Routes ---
  if (pathname === '/api/documents') {
    if (method === 'GET') {
      return jsonResponse({ success: true, data: db.documents || [] });
    }
    if (method === 'POST') {
      const newDoc = {
        id: 'doc_' + Math.random().toString(36).substr(2, 9),
        name: body.name || 'Unnamed Document',
        type: body.type || 'Other',
        issuingAuthority: body.issuingAuthority || 'N/A',
        issueDate: body.issueDate || new Date().toISOString().split('T')[0],
        expiryDate: body.expiryDate || '',
        notes: body.notes || null,
        fileName: body.fileName || null,
        fileUrl: body.fileUrl || null,
        fileType: body.fileType || null,
        createdAt: new Date().toISOString()
      };
      if (!db.documents) db.documents = [];
      db.documents.push(newDoc);
      saveDB(db);
      return jsonResponse({ success: true, data: newDoc });
    }
  }

  const documentMatch = pathname.match(/^\/api\/documents\/([^\/]+)$/);
  if (documentMatch) {
    const docId = documentMatch[1];
    if (method === 'PUT') {
      if (!db.documents) db.documents = [];
      db.documents = db.documents.map(d => {
        if (d.id === docId) {
          return {
            ...d,
            name: body.name !== undefined ? body.name : d.name,
            type: body.type !== undefined ? body.type : d.type,
            issuingAuthority: body.issuingAuthority !== undefined ? body.issuingAuthority : d.issuingAuthority,
            issueDate: body.issueDate !== undefined ? body.issueDate : d.issueDate,
            expiryDate: body.expiryDate !== undefined ? body.expiryDate : d.expiryDate,
            notes: body.notes !== undefined ? body.notes : d.notes,
            fileName: body.fileName !== undefined ? body.fileName : d.fileName,
            fileUrl: body.fileUrl !== undefined ? body.fileUrl : d.fileUrl,
            fileType: body.fileType !== undefined ? body.fileType : d.fileType,
          };
        }
        return d;
      });
      saveDB(db);
      return jsonResponse({ success: true, data: db.documents.find(d => d.id === docId) });
    }
    if (method === 'DELETE') {
      if (!db.documents) db.documents = [];
      db.documents = db.documents.filter(d => d.id !== docId);
      saveDB(db);
      return jsonResponse({ success: true });
    }
  }

  // --- Employees (Cashiers) Routes ---
  if (pathname === '/api/employees') {
    if (method === 'GET') {
      const cashiers = db.users.filter(u => u.role === 'cashier').map(publicUser);
      return jsonResponse({ success: true, data: cashiers });
    }
    if (method === 'POST') {
      const pin = body.pin || body.employeePin || null;
      const newCashier = {
        id: 'user_cashier_' + Math.random().toString(36).substr(2, 9),
        storeId: db.store.id,
        email: body.email || `cashier_${Math.random().toString(36).substr(2, 4)}@barrelflow.com`,
        name: body.name,
        role: 'cashier',
        employeePin: pin,
        isActive: body.isActive !== undefined ? body.isActive : true
      };
      db.users.push(newCashier);
      saveDB(db);
      return jsonResponse({ success: true, data: publicUser(newCashier) });
    }
  }

  const employeeMatch = pathname.match(/^\/api\/employees\/([^\/]+)$/);
  if (employeeMatch) {
    const employeeId = employeeMatch[1];
    if (method === 'PUT') {
      const pin = body.pin || body.employeePin;
      db.users = db.users.map(u => {
        if (u.id === employeeId) {
          return {
            ...u,
            name: body.name !== undefined ? body.name : u.name,
            email: body.email !== undefined ? body.email : u.email,
            employeePin: pin !== undefined ? pin : u.employeePin,
            isActive: body.isActive !== undefined ? body.isActive : u.isActive,
          };
        }
        return u;
      });
      saveDB(db);
      return jsonResponse({ success: true, data: publicUser(db.users.find(u => u.id === employeeId)) });
    }
    if (method === 'DELETE') {
      db.users = db.users.filter(u => u.id !== employeeId);
      saveDB(db);
      return jsonResponse({ success: true });
    }
  }

  // --- OTP Routes ---
  if (pathname === '/api/otp/send' && method === 'POST') {
    return jsonResponse({ success: true, otp: '123456' });
  }

  if (pathname === '/api/otp/verify' && method === 'POST') {
    if (body.otp === '123456') {
      return jsonResponse({ success: true });
    }
    return jsonResponse({ success: false, error: 'Invalid OTP code. Use 123456.' }, 400);
  }

  // --- Reports & Charts Routes ---
  if (pathname === '/api/reports/dashboard-stats' && method === 'GET') {
    const activeProducts = db.products.filter(p => p.isActive);
    const completedOrders = db.orders.filter(o => o.status === 'completed');
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = completedOrders.filter(o => o.createdAt.startsWith(todayStr));
    const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const lowStock = activeProducts.filter(p => p.stockQuantity <= db.settings.lowStockThreshold).length;
    const totalCustomers = new Set(completedOrders.map(o => o.customerPhone || o.customerEmail).filter(Boolean)).size;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthOrders = completedOrders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
    const monthRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const monthTransactions = monthOrders.length;

    let totalRevenue = 0;
    let totalCost = 0;
    completedOrders.forEach(o => {
      totalRevenue += o.totalAmount;
      o.items.forEach((item: any) => {
        const prod = db.products.find(p => p.id === item.productId);
        const costPrice = prod?.costPrice || (item.unitPrice * 0.6);
        totalCost += costPrice * item.quantity;
      });
    });
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 35.0;

    const dailyRevenues: Record<string, number> = {};
    completedOrders.forEach(o => {
      const dateStr = o.createdAt.split('T')[0];
      dailyRevenues[dateStr] = (dailyRevenues[dateStr] || 0) + o.totalAmount;
    });
    let bestDayDate = '';
    let bestDayRevenue = 0;
    Object.entries(dailyRevenues).forEach(([date, rev]) => {
      if (rev > bestDayRevenue) {
        bestDayRevenue = rev;
        bestDayDate = date;
      }
    });
    const bestDay = bestDayRevenue > 0 ? { date: bestDayDate, revenue: bestDayRevenue } : null;

    const totalSalesVal = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageBasketValue = completedOrders.length > 0 ? totalSalesVal / completedOrders.length : 0;
    const inventoryValue = activeProducts.reduce((sum, p) => sum + (p.stockQuantity * (p.costPrice || 0.6 * p.sellingPrice)), 0);

    const stats = {
      // DashboardView expected properties
      todaySales: Math.round(todaySales * 100) / 100,
      todayOrders: todayOrders.length,
      totalProducts: activeProducts.length,
      lowStockProducts: lowStock,
      totalCustomers,
      pendingSync: 0,
      totalSales: Math.round(totalSalesVal * 100) / 100,
      totalOrders: completedOrders.length,

      // Liquor POS Specific stats
      averageBasketValue: Math.round(averageBasketValue * 100) / 100,
      lowStockSKUs: lowStock,
      inventoryValue: Math.round(inventoryValue * 100) / 100,

      // ReportsView expected properties
      todayRevenue: Math.round(todaySales * 100) / 100,
      todayTransactions: todayOrders.length,
      monthRevenue: Math.round(monthRevenue * 100) / 100,
      monthTransactions,
      profitMargin: Math.round(profitMargin * 10) / 10,
      bestDay
    };
    return jsonResponse({ success: true, data: stats });
  }

  if (pathname === '/api/reports/daily-sales' && method === 'GET') {
    const completedOrders = db.orders.filter(o => o.status === 'completed');
    
    // Group orders by date (last N days based on query days, default 7)
    const days = parseInt(query.get('days') || '7');
    const salesByDate: Record<string, { revenue: number; transactions: number; profit: number }> = {};
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      salesByDate[dateStr] = { revenue: 0, transactions: 0, profit: 0 };
    }

    completedOrders.forEach(o => {
      const dateStr = o.createdAt.split('T')[0];
      if (salesByDate[dateStr] !== undefined) {
        salesByDate[dateStr].revenue += o.totalAmount;
        salesByDate[dateStr].transactions += 1;
        
        // Calculate profit (revenue - cost of items)
        const costOfItems = o.items.reduce((sum, item: any) => {
          const prod = db.products.find(p => p.id === item.productId);
          const costPrice = prod?.costPrice || (item.unitPrice * 0.6);
          return sum + (costPrice * item.quantity);
        }, 0);
        salesByDate[dateStr].profit += (o.subtotal - costOfItems);
      }
    });

    const data = Object.keys(salesByDate).map(date => ({
      date,
      revenue: Math.round(salesByDate[date].revenue),
      transactions: salesByDate[date].transactions,
      profit: Math.round(salesByDate[date].profit)
    })).sort((a, b) => a.date.localeCompare(b.date));

    return jsonResponse({ success: true, data });
  }

  if (pathname === '/api/reports/top-products' && method === 'GET') {
    const completedOrders = db.orders.filter(o => o.status === 'completed');
    
    // Aggregate top products sold
    const topProds: Record<string, { name: string; quantity: number; revenue: number }> = {};
    completedOrders.forEach(o => {
      o.items.forEach((item: any) => {
        if (!topProds[item.productId]) {
          topProds[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        topProds[item.productId].quantity += item.quantity;
        topProds[item.productId].revenue += item.lineTotal;
      });
    });

    const data = Object.keys(topProds).map(prodId => ({
      productId: prodId,
      productName: topProds[prodId].name,
      totalQuantity: topProds[prodId].quantity,
      totalRevenue: topProds[prodId].revenue
    })).sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 8);

    return jsonResponse({ success: true, data });
  }

  if (pathname === '/api/reports/payment-breakdown' && method === 'GET') {
    const completedOrders = db.orders.filter(o => o.status === 'completed');
    
    const breakdown = {
      cash: 0,
      card: 0,
      upi: 0
    };

    completedOrders.forEach(o => {
      const method = o.paymentMethod.toLowerCase() as 'cash' | 'card' | 'upi';
      if (breakdown[method] !== undefined) {
        breakdown[method] += o.totalAmount;
      }
    });

    const data = {
      cash: Math.round(breakdown.cash),
      card: Math.round(breakdown.card),
      upi: Math.round(breakdown.upi)
    };

    return jsonResponse({ success: true, data });
  }

  return null;
}

// Auto-initialize mock fetch only when the explicit mock/demo flag allows it.
if (typeof window !== 'undefined' && shouldEnableMockApi) {
  initMockFetch();
}
