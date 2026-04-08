import { getEntryDayKey, isThisMonthEntry, isTodayEntry, isYesterdayEntry } from './date';

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

function isCustomDateEntry(entry, customRange) {
  const entryDayKey = getEntryDayKey(entry);

  if (!entryDayKey) {
    return false;
  }

  const startDate = customRange?.startDate || '';
  const endDate = customRange?.endDate || startDate;

  if (!startDate && !endDate) {
    return false;
  }

  const lowerBound = startDate || endDate;
  const upperBound = endDate || startDate;

  return entryDayKey >= lowerBound && entryDayKey <= upperBound;
}

export function getReportSummary(sales, expenses, periodKey, customRange) {
  const matchEntry =
    periodKey === 'yesterday'
      ? isYesterdayEntry
      : periodKey === 'thisMonth'
        ? isThisMonthEntry
      : periodKey === 'custom'
        ? (entry) => isCustomDateEntry(entry, customRange)
        : isTodayEntry;

  return buildReportSummary(sales.filter(matchEntry), expenses.filter(matchEntry));
}