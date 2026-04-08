const STORAGE_KEYS = {
  products: 'warung-pintar-products',
  sales: 'warung-pintar-sales',
  expenses: 'warung-pintar-expenses'
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

  if (!window.localStorage.getItem(STORAGE_KEYS.products)) {
    writeStorage(STORAGE_KEYS.products, defaultProducts);
  }

  return { products, sales, expenses };
}

export function saveSales(sales) {
  writeStorage(STORAGE_KEYS.sales, sales);
}

export function saveExpenses(expenses) {
  writeStorage(STORAGE_KEYS.expenses, expenses);
}