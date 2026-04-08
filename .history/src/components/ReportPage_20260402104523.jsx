import { formatRupiah } from '../utils/currency';
import ScreenLayout from './ScreenLayout';

export default function ReportPage({ totalSales, totalExpenses, profit, onBack }) {
  return (
    <ScreenLayout title="Laporan" subtitle="Ringkasan hari ini" onBack={onBack}>
      <div className="report-list">
        <article className="report-card">
          <span>Total Penjualan</span>
          <strong>{formatRupiah(totalSales)}</strong>
        </article>

        <article className="report-card">
          <span>Total Pengeluaran</span>
          <strong>{formatRupiah(totalExpenses)}</strong>
        </article>

        <article className="report-card report-card--profit">
          <span>Untung Hari Ini</span>
          <strong>{formatRupiah(profit)}</strong>
        </article>
      </div>
    </ScreenLayout>
  );
}