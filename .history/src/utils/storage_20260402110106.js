const STORAGE_KEYS = {
  products: 'warung-pintar-products',
  sales: 'warung-pintar-sales',
  expenses: 'warung-pintar-expenses',
  settings: 'warung-pintar-settings'
};

const DEFAULT_SETTINGS = {
  storeName: 'Kasir Warung'
};

function readStorage(key, fallback) {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadInitialData(defaultProducts) {
  const products = readStorage(STORAGE_KEYS.products, defaultProducts);
  const sales = readStorage(STORAGE_KEYS.sales, []);
  const expenses = readStorage(STORAGE_KEYS.expenses, []);
  const settings = {
    ...DEFAULT_SETTINGS,
    ...readStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  };

  if (!window.localStorage.getItem(STORAGE_KEYS.products)) {
    writeStorage(STORAGE_KEYS.products, defaultProducts);
  }

  if (!window.localStorage.getItem(STORAGE_KEYS.settings)) {
    writeStorage(STORAGE_KEYS.settings, settings);
  }

  return { products, sales, expenses, settings };
}

export function saveSales(sales) {
  writeStorage(STORAGE_KEYS.sales, sales);
}

export function saveExpenses(expenses) {
  writeStorage(STORAGE_KEYS.expenses, expenses);
}

export function saveProducts(products) {
  writeStorage(STORAGE_KEYS.products, products);
}

export function saveSettings(settings) {
  writeStorage(STORAGE_KEYS.settings, settings);
}