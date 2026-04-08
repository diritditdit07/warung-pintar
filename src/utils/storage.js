const STORAGE_KEYS = {
  products: 'warung-pintar-products',
  sales: 'warung-pintar-sales',
  expenses: 'warung-pintar-expenses',
  settings: 'warung-pintar-settings'
};

const DEFAULT_SETTINGS = {
  storeName: 'Kasir Warung'
};

function createScopedKey(key, scopeKey) {
  return scopeKey ? `${scopeKey}:${key}` : key;
}

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

export function loadInitialData(defaultProducts, scopeKey) {
  const productKey = createScopedKey(STORAGE_KEYS.products, scopeKey);
  const salesKey = createScopedKey(STORAGE_KEYS.sales, scopeKey);
  const expensesKey = createScopedKey(STORAGE_KEYS.expenses, scopeKey);
  const settingsKey = createScopedKey(STORAGE_KEYS.settings, scopeKey);
  const hasScopedProducts = window.localStorage.getItem(productKey);
  const hasScopedSettings = window.localStorage.getItem(settingsKey);
  const products = readStorage(productKey, readStorage(STORAGE_KEYS.products, defaultProducts));
  const sales = readStorage(salesKey, readStorage(STORAGE_KEYS.sales, []));
  const expenses = readStorage(expensesKey, readStorage(STORAGE_KEYS.expenses, []));
  const settings = {
    ...DEFAULT_SETTINGS,
    ...readStorage(settingsKey, readStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS))
  };

  if (!hasScopedProducts) {
    writeStorage(productKey, products);
  }

  if (!hasScopedSettings) {
    writeStorage(settingsKey, settings);
  }

  return { products, sales, expenses, settings };
}

export function saveSales(sales, scopeKey) {
  writeStorage(createScopedKey(STORAGE_KEYS.sales, scopeKey), sales);
}

export function saveExpenses(expenses, scopeKey) {
  writeStorage(createScopedKey(STORAGE_KEYS.expenses, scopeKey), expenses);
}

export function saveProducts(products, scopeKey) {
  writeStorage(createScopedKey(STORAGE_KEYS.products, scopeKey), products);
}

export function saveSettings(settings, scopeKey) {
  writeStorage(createScopedKey(STORAGE_KEYS.settings, scopeKey), settings);
}