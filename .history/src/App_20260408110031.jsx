import { useEffect, useState } from 'react';
import AddStorePage from './components/AddStorePage';
import ExpensePage from './components/ExpensePage';
import HomeDashboard from './components/HomeDashboard';
import LoginPage from './components/LoginPage';
import ProductPage from './components/ProductPage';
import ReportPage from './components/ReportPage';
import SalesPage from './components/SalesPage';
import SettingsPage from './components/SettingsPage';
import { defaultProducts } from './data/defaultProducts';
import { fetchWarungBootstrap, invokeWarungAction } from './utils/api';
import { clearAuthSession, loadAuthSession, loginWithStoreCode, saveAuthSession } from './utils/auth';
import { formatTodayLabel, getDayKey, getReportPeriodLabel } from './utils/date';
import { getReportSummary } from './utils/report';
import { loadInitialData, saveExpenses, saveProducts, saveSales, saveSettings } from './utils/storage';

function buildCartItems(cartMap, products) {
  return Object.entries(cartMap).map(([productId, quantity]) => {
    const product = products.find((item) => item.id === productId);

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity
    };
  }).filter(Boolean);
}

function createProductId(name) {
  return `${name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}-${Date.now()}`;
}

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [preLoginScreen, setPreLoginScreen] = useState('login');
  const [authSession, setAuthSession] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [storeCodeInput, setStoreCodeInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [cartMap, setCartMap] = useState({});
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [editingProductId, setEditingProductId] = useState('');
  const [storeName, setStoreName] = useState('Kasir Warung');
  const [reportPeriod, setReportPeriod] = useState('today');
  const [customStartDate, setCustomStartDate] = useState(getDayKey());
  const [customEndDate, setCustomEndDate] = useState(getDayKey());
  const [toastMessage, setToastMessage] = useState('');
  const [syncError, setSyncError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const storageScope = authSession?.store?.id || '';

  useEffect(() => {
    setAuthSession(loadAuthSession());
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authSession) {
      setProducts([]);
      setSales([]);
      setExpenses([]);
      setStoreName('Kasir Warung');
      setCartMap({});
      setSyncError('');
      setIsSyncing(false);
      setIsReady(false);
      return;
    }

    const initialData = loadInitialData(defaultProducts, storageScope);
    setProducts(initialData.products);
    setSales(initialData.sales);
    setExpenses(initialData.expenses);
    setStoreName(initialData.settings.storeName || authSession.store.name);
    setIsReady(true);

    let isCancelled = false;

    async function syncRemoteData() {
      try {
        setIsSyncing(true);
        setSyncError('');

        let bootstrap = await fetchWarungBootstrap(authSession);

        if (!isCancelled && bootstrap.products.length === 0 && initialData.products.length > 0) {
          const seeded = await invokeWarungAction(authSession, 'seed-products', {
            products: initialData.products.map((product) => ({
              name: product.name,
              price: product.price
            }))
          });

          bootstrap = {
            ...bootstrap,
            products: seeded.products || []
          };
        }

        if (isCancelled) {
          return;
        }

        setProducts(bootstrap.products || []);
        setSales(bootstrap.sales || []);
        setExpenses(bootstrap.expenses || []);
        setStoreName(bootstrap.settings?.storeName || authSession.store.name);
      } catch (error) {
        if (!isCancelled) {
          setSyncError(error instanceof Error ? error.message : 'Gagal sinkron ke server. Cache lokal dipakai sementara.');
        }
      } finally {
        if (!isCancelled) {
          setIsSyncing(false);
        }
      }
    }

    syncRemoteData();

    return () => {
      isCancelled = true;
    };
  }, [authSession, storageScope]);

  useEffect(() => {
    if (!isReady || !storageScope) {
      return;
    }

    saveSales(sales, storageScope);
  }, [isReady, sales, storageScope]);

  useEffect(() => {
    if (!isReady || !storageScope) {
      return;
    }

    saveExpenses(expenses, storageScope);
  }, [expenses, isReady, storageScope]);

  useEffect(() => {
    if (!isReady || !storageScope) {
      return;
    }

    saveProducts(products, storageScope);
  }, [isReady, products, storageScope]);

  useEffect(() => {
    if (!isReady || !storageScope) {
      return;
    }

    saveSettings({ storeName }, storageScope);
  }, [isReady, storageScope, storeName]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage('');
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const cartItems = buildCartItems(cartMap, products);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const {
    filteredSales,
    filteredExpenses,
    totalSales,
    totalExpenses,
    profit
  } = getReportSummary(sales, expenses, reportPeriod, {
    startDate: customStartDate,
    endDate: customEndDate
  });
  const reportPeriodLabel = getReportPeriodLabel(reportPeriod);

  function handleAddProduct(product) {
    setCartMap((currentCart) => ({
      ...currentCart,
      [product.id]: (currentCart[product.id] || 0) + 1
    }));
  }

  function handleDecreaseProduct(productId) {
    setCartMap((currentCart) => {
      const currentQuantity = currentCart[productId] || 0;

      if (currentQuantity <= 1) {
        const { [productId]: _removed, ...remainingItems } = currentCart;
        return remainingItems;
      }

      return {
        ...currentCart,
        [productId]: currentQuantity - 1
      };
    });
  }

  async function handleCheckout() {
    if (cartItems.length === 0) {
      return;
    }

    const transaction = {
      createdAt: new Date().toISOString(),
      dayKey: getDayKey(),
      items: cartItems,
      total: cartTotal
    };

    try {
      const { sale } = await invokeWarungAction(authSession, 'create-sale', transaction);
      setSales((currentSales) => [sale, ...currentSales]);
      setCartMap({});
      setToastMessage('Transaksi berhasil disimpan');
      setScreen('home');
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Gagal simpan transaksi');
    }
  }

  async function handleSaveExpense(event) {
    event.preventDefault();

    const parsedAmount = Number(expenseAmount);

    if (!expenseName.trim() || parsedAmount <= 0) {
      return;
    }

    const newExpense = {
      createdAt: new Date().toISOString(),
      dayKey: getDayKey(),
      name: expenseName.trim(),
      amount: parsedAmount
    };

    try {
      const { expense } = await invokeWarungAction(authSession, 'create-expense', newExpense);
      setExpenses((currentExpenses) => [expense, ...currentExpenses]);
      setExpenseName('');
      setExpenseAmount('');
      setToastMessage('Pengeluaran berhasil disimpan');
      setScreen('home');
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Gagal simpan pengeluaran');
    }
  }

  function resetProductForm() {
    setProductName('');
    setProductPrice('');
    setEditingProductId('');
  }

  async function handleSaveProduct(event) {
    event.preventDefault();

    const trimmedName = productName.trim();
    const parsedPrice = Number(productPrice);

    if (!trimmedName || parsedPrice <= 0) {
      return;
    }

    try {
      const { product } = await invokeWarungAction(authSession, 'upsert-product', {
        id: isUuid(editingProductId) ? editingProductId : undefined,
        name: trimmedName,
        price: parsedPrice
      });

      if (editingProductId && isUuid(editingProductId)) {
        setProducts((currentProducts) =>
          currentProducts.map((item) => (item.id === editingProductId ? product : item))
        );
      } else {
        setProducts((currentProducts) => [product, ...currentProducts.filter((item) => item.name !== product.name)]);
      }

      resetProductForm();
      setToastMessage('Produk berhasil disimpan');
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Gagal simpan produk');
    }
  }

  function handleEditProduct(product) {
    setProductName(product.name);
    setProductPrice(String(product.price));
    setEditingProductId(product.id);
    setScreen('products');
  }

  async function handleSaveSettings(event) {
    event.preventDefault();

    const trimmedStoreName = storeName.trim();

    if (!trimmedStoreName) {
      return;
    }

    try {
      const { settings } = await invokeWarungAction(authSession, 'update-settings', {
        storeName: trimmedStoreName
      });
      setStoreName(settings.storeName);
      setToastMessage('Nama warung disimpan');
      setScreen('home');
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Gagal simpan setting');
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    if (!storeCodeInput.trim() || !pinInput.trim()) {
      setLoginError('Kode warung dan PIN wajib diisi.');
      return;
    }

    try {
      setIsLoggingIn(true);
      setLoginError('');

      const sessionPayload = await loginWithStoreCode(storeCodeInput.trim(), pinInput.trim());
      saveAuthSession(sessionPayload);
      setAuthSession(sessionPayload);
      setPinInput('');
      setToastMessage('Login berhasil');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login gagal');
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    invokeWarungAction(authSession, 'logout', {}).catch(() => undefined);
    clearAuthSession();
    setAuthSession(null);
    setScreen('home');
    setLoginError('');
    setPinInput('');
    setToastMessage('Sesi warung ditutup');
  }

  if (!isAuthReady) {
    return <main className="app-shell"><div className="app-frame"><div className="screen-card">Memuat...</div></div></main>;
  }

  if (!authSession) {
    return (
      <main className="app-shell">
        <div className="app-frame">
          <LoginPage
            storeCode={storeCodeInput}
            pin={pinInput}
            isSubmitting={isLoggingIn}
            errorMessage={loginError}
            onStoreCodeChange={setStoreCodeInput}
            onPinChange={setPinInput}
            onSubmit={handleLoginSubmit}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {toastMessage && <div className="app-toast">{toastMessage}</div>}
      {syncError && <div className="app-sync-banner">{syncError}</div>}
      {isSyncing && <div className="app-sync-banner app-sync-banner--info">Menyinkronkan data warung...</div>}

      <div className="app-frame">
        {screen === 'home' && (
          <HomeDashboard
            profit={profit}
            onNavigate={setScreen}
            todayLabel={formatTodayLabel()}
            storeName={storeName}
            storeCode={authSession.store.code}
            userName={authSession.user.fullName}
          />
        )}

        {screen === 'sales' && (
          <SalesPage
            products={products}
            cartItems={cartItems}
            total={cartTotal}
            onAddProduct={handleAddProduct}
            onDecreaseProduct={handleDecreaseProduct}
            onCheckout={handleCheckout}
            onBack={() => setScreen('home')}
          />
        )}

        {screen === 'expenses' && (
          <ExpensePage
            name={expenseName}
            amount={expenseAmount}
            onNameChange={setExpenseName}
            onAmountChange={setExpenseAmount}
            onSubmit={handleSaveExpense}
            onBack={() => setScreen('home')}
          />
        )}

        {screen === 'reports' && (
          <ReportPage
            totalSales={totalSales}
            totalExpenses={totalExpenses}
            profit={profit}
            salesEntries={filteredSales}
            expenseEntries={filteredExpenses}
            selectedPeriod={reportPeriod}
            periodLabel={reportPeriodLabel}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomStartChange={setCustomStartDate}
            onCustomEndChange={setCustomEndDate}
            onPeriodChange={setReportPeriod}
            onBack={() => setScreen('home')}
          />
        )}

        {screen === 'products' && (
          <ProductPage
            name={productName}
            price={productPrice}
            products={products}
            editingProductId={editingProductId}
            onNameChange={setProductName}
            onPriceChange={setProductPrice}
            onSubmit={handleSaveProduct}
            onEdit={handleEditProduct}
            onCancelEdit={resetProductForm}
            onBack={() => {
              resetProductForm();
              setScreen('home');
            }}
          />
        )}

        {screen === 'settings' && (
          <SettingsPage
            storeName={storeName}
            sessionInfo={{
              storeCode: authSession.store.code,
              userName: authSession.user.fullName
            }}
            onStoreNameChange={setStoreName}
            onSubmit={handleSaveSettings}
            onLogout={handleLogout}
            onBack={() => setScreen('home')}
          />
        )}
      </div>
    </main>
  );
}