import { formatRupiah } from '../utils/currency';
import { formatEntryDateTime } from '../utils/date';
import ScreenLayout from './ScreenLayout';

const PERIOD_OPTIONS = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'yesterday', label: 'Kemarin' },
  { key: 'thisMonth', label: 'Bulan Ini' },
  { key: 'lastMonth', label: 'Bulan Lalu' }
];

export default function ReportPage({
  totalSales,
  totalExpenses,
  profit,
  salesEntries,
  expenseEntries,
  selectedPeriod,
  periodLabel,
  onPeriodChange,
  onBack
}) {
  return (
    <ScreenLayout title="Laporan" subtitle={`Ringkasan ${periodLabel.toLowerCase()}`} onBack={onBack}>
      <div className="report-filter-list">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`report-filter-button ${selectedPeriod === option.key ? 'report-filter-button--active' : ''}`}
            onClick={() => onPeriodChange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="report-list">
        <article className="report-card">
          <span>Pemasukan {periodLabel}</span>
          <strong>{formatRupiah(totalSales)}</strong>
        </article>

        <article className="report-card">
          <span>Pengeluaran {periodLabel}</span>
          <strong>{formatRupiah(totalExpenses)}</strong>
        </article>

        <article className="report-card report-card--profit">
          <span>Untung {periodLabel}</span>
          <strong>{formatRupiah(profit)}</strong>
        </article>
      </div>

      <div className="report-detail-section">
        <div className="report-detail-header">
          <h3>Daftar Pemasukan</h3>
          <span>{salesEntries.length} transaksi</span>
        </div>

        <div className="report-entry-list">
          {salesEntries.length > 0 ? (
            salesEntries.map((sale) => (
              <article key={sale.id} className="report-entry-card">
                <div className="report-entry-card__top">
                  <strong>{formatRupiah(sale.total)}</strong>
                  <span>{formatEntryDateTime(sale.createdAt)}</span>
                </div>
                <p>
                  {sale.items.map((item) => `${item.name} x${item.quantity}`).join(', ')}
                </p>
              </article>
            ))
          ) : (
            <p className="empty-state">Belum ada pemasukan untuk {periodLabel.toLowerCase()}.</p>
          )}
        </div>
      </div>

      <div className="report-detail-section">
        <div className="report-detail-header">
          <h3>Daftar Pengeluaran</h3>
          <span>{expenseEntries.length} catatan</span>
        </div>

        <div className="report-entry-list">
          {expenseEntries.length > 0 ? (
            expenseEntries.map((expense) => (
              <article key={expense.id} className="report-entry-card">
                <div className="report-entry-card__top">
                  <strong>{formatRupiah(expense.amount)}</strong>
                  <span>{formatEntryDateTime(expense.createdAt)}</span>
                </div>
                <p>{expense.name}</p>
              </article>
            ))
          ) : (
            <p className="empty-state">Belum ada pengeluaran untuk {periodLabel.toLowerCase()}.</p>
          )}
        </div>
      </div>
    </ScreenLayout>
  );
}