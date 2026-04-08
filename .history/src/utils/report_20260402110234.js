import { isLastMonthEntry, isTodayEntry, isYesterdayEntry } from './date';

function sumValues(items, fieldName) {
  return items.reduce((total, item) => total + (Number(item[fieldName]) || 0), 0);
}

function buildReportSummary(filteredSales, filteredExpenses) {
  const totalSales = sumValues(filteredSales, 'total');
  const totalExpenses = sumValues(filteredExpenses, 'amount');

  return {
    filteredSales,
    filteredExpenses,
    totalSales,
    totalExpenses,
    profit: totalSales - totalExpenses
  };
}

export function getReportSummary(sales, expenses, periodKey) {
  const matchEntry =
    periodKey === 'yesterday'
      ? isYesterdayEntry
      : periodKey === 'lastMonth'
        ? isLastMonthEntry
        : isTodayEntry;

  return buildReportSummary(sales.filter(matchEntry), expenses.filter(matchEntry));
}