import { useEffect, useState } from 'react';
import ExpensePage from './components/ExpensePage';
import HomeDashboard from './components/HomeDashboard';
import ReportPage from './components/ReportPage';
import SalesPage from './components/SalesPage';
import { defaultProducts } from './data/defaultProducts';
import { formatTodayLabel, isToday } from './utils/date';
import { loadInitialData, saveExpenses, saveSales } from './utils/storage';

function buildCartItems(cartMap, products) {
  return Object.entries(cartMap).map(([productId, quantity]) => {
    const product = products.find((item) => item.id === productId);

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity
    };
  });
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

  const cartItems = buildCartItems(cartMap, products);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const todaySales = sales.filter((item) => isToday(item.createdAt));
  const todayExpenses = expenses.filter((item) => isToday(item.createdAt));
  const totalSales = todaySales.reduce((total, item) => total + item.total, 0);
  const totalExpenses = todayExpenses.reduce((total, item) => total + item.amount, 0);
  const profit = totalSales - totalExpenses;

  function handleAddProduct(product) {
    setCartMap((currentCart) => ({
      ...currentCart,
      [product.id]: (currentCart[product.id] || 0) + 1
    }));
  }

  function handleCheckout() {
    if (cartItems.length === 0) {
      return;
    }

    const transaction = {
      id: `sale-${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: cartItems,
      total: cartTotal
    };

    setSales((currentSales) => [transaction, ...currentSales]);
    setCartMap({});
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
      name: expenseName.trim(),
      amount: parsedAmount
    };

    setExpenses((currentExpenses) => [newExpense, ...currentExpenses]);
    setExpenseName('');
    setExpenseAmount('');
    setScreen('home');
  }

  return (
    <main className="app-shell">
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
      </div>
    </main>
  );
}