import { useEffect, useState } from 'react';
import ExpensePage from './components/ExpensePage';
import HomeDashboard from './components/HomeDashboard';
import ProductPage from './components/ProductPage';
import ReportPage from './components/ReportPage';
import SalesPage from './components/SalesPage';
import { defaultProducts } from './data/defaultProducts';
import { formatTodayLabel, getDayKey } from './utils/date';
import { getTodayReport } from './utils/report';
import { loadInitialData, saveExpenses, saveProducts, saveSales } from './utils/storage';

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

export default function App() {
  const [screen, setScreen] = useState('home');
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
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const initialData = loadInitialData(defaultProducts);
    setProducts(initialData.products);
    setSales(initialData.sales);
    setExpenses(initialData.expenses);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    saveSales(sales);
  }, [isReady, sales]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    saveExpenses(expenses);
  }, [expenses, isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    saveProducts(products);
  }, [isReady, products]);

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
  const { totalSales, totalExpenses, profit } = getTodayReport(sales, expenses);

  function handleAddProduct(product) {
    setCartMap((currentCart) => ({
      ...currentCart,
      [product.id]: (currentCart[product.id] || 0) + 1
    }));
    setToastMessage(`${product.name} ditambahkan`);
  }

  function handleDecreaseProduct(productId) {
    setCartMap((currentCart) => {
      const currentQuantity = currentCart[productId] || 0;
      const product = products.find((item) => item.id === productId);

      if (currentQuantity <= 1) {
        const { [productId]: _removed, ...remainingItems } = currentCart;
        if (product) {
          setToastMessage(`${product.name} dihapus`);
        }
        return remainingItems;
      }

      if (product) {
        setToastMessage(`Jumlah ${product.name} dikurangi`);
      }

      return {
        ...currentCart,
        [productId]: currentQuantity - 1
      };
    });
  }

  function handleRemoveProduct(productId) {
    const product = products.find((item) => item.id === productId);

    setCartMap((currentCart) => {
      const { [productId]: _removed, ...remainingItems } = currentCart;
      return remainingItems;
    });

    if (product) {
      setToastMessage(`${product.name} dihapus`);
    }
  }

  function handleCancelSale() {
    if (cartItems.length === 0) {
      return;
    }

    const shouldCancel = window.confirm('Batalkan semua pesanan yang sedang dibuat?');

    if (!shouldCancel) {
      return;
    }

    setCartMap({});
    setToastMessage('Pesanan dibatalkan');
  }

  function handleCheckout() {
    if (cartItems.length === 0) {
      return;
    }

    const transaction = {
      id: `sale-${Date.now()}`,
      createdAt: new Date().toISOString(),
      dayKey: getDayKey(),
      items: cartItems,
      total: cartTotal
    };

    setSales((currentSales) => [transaction, ...currentSales]);
    setCartMap({});
    setToastMessage('Transaksi berhasil disimpan');
    setScreen('home');
  }

  function handleSaveExpense(event) {
    event.preventDefault();

    const parsedAmount = Number(expenseAmount);

    if (!expenseName.trim() || parsedAmount <= 0) {
      return;
    }

    const newExpense = {
      id: `expense-${Date.now()}`,
      createdAt: new Date().toISOString(),
      dayKey: getDayKey(),
      name: expenseName.trim(),
      amount: parsedAmount
    };

    setExpenses((currentExpenses) => [newExpense, ...currentExpenses]);
    setExpenseName('');
    setExpenseAmount('');
    setScreen('home');
  }

  function resetProductForm() {
    setProductName('');
    setProductPrice('');
    setEditingProductId('');
  }

  function handleSaveProduct(event) {
    event.preventDefault();

    const trimmedName = productName.trim();
    const parsedPrice = Number(productPrice);

    if (!trimmedName || parsedPrice <= 0) {
      return;
    }

    if (editingProductId) {
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProductId
            ? {
                ...product,
                name: trimmedName,
                price: parsedPrice
              }
            : product
        )
      );
    } else {
      const newProduct = {
        id: createProductId(trimmedName),
        name: trimmedName,
        price: parsedPrice
      };

      setProducts((currentProducts) => [newProduct, ...currentProducts]);
    }

    resetProductForm();
  }

  function handleEditProduct(product) {
    setProductName(product.name);
    setProductPrice(String(product.price));
    setEditingProductId(product.id);
    setScreen('products');
  }

  return (
    <main className="app-shell">
      {toastMessage && <div className="app-toast">{toastMessage}</div>}

      <div className="app-frame">
        {screen === 'home' && (
          <HomeDashboard profit={profit} onNavigate={setScreen} todayLabel={formatTodayLabel()} />
        )}

        {screen === 'sales' && (
          <SalesPage
            products={products}
            cartItems={cartItems}
            total={cartTotal}
            onAddProduct={handleAddProduct}
            onDecreaseProduct={handleDecreaseProduct}
            onRemoveProduct={handleRemoveProduct}
            onCancelSale={handleCancelSale}
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
      </div>
    </main>
  );
}