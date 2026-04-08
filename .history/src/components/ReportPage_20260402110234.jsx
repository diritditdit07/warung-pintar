import { formatRupiah } from '../utils/currency';
import ScreenLayout from './ScreenLayout';

const PERIOD_OPTIONS = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'yesterday', label: 'Kemarin' },
  { key: 'lastMonth', label: 'Bulan Lalu' }
];

export default function ReportPage({
  totalSales,
  totalExpenses,
  profit,
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
    </ScreenLayout>
  );
}