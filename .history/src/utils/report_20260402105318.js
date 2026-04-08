import { isTodayEntry } from './date';

function sumValues(items, fieldName) {
  return items.reduce((total, item) => total + (Number(item[fieldName]) || 0), 0);
}

export function getTodayReport(sales, expenses) {
  const todaySales = sales.filter(isTodayEntry);
  const todayExpenses = expenses.filter(isTodayEntry);
  const totalSales = sumValues(todaySales, 'total');
  const totalExpenses = sumValues(todayExpenses, 'amount');

  return {
    todaySales,
    todayExpenses,
    totalSales,
    totalExpenses,
    profit: totalSales - totalExpenses
  };
}