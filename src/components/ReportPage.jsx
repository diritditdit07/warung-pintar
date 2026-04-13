import { useState } from 'react';
import { formatRupiah } from '../utils/currency';
import { formatEntryDateTime } from '../utils/date';
import ScreenLayout from './ScreenLayout';

const PERIOD_OPTIONS = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'yesterday', label: 'Kemarin' },
  { key: 'thisMonth', label: 'Bulan Ini' },
  { key: 'custom', label: 'Custom' }
];

export default function ReportPage({
  totalSales,
  totalExpenses,
  profit,
  salesEntries,
  expenseEntries,
  selectedPeriod,
  periodLabel,
  customStartDate,
  customEndDate,
  onCustomStartChange,
  onCustomEndChange,
  onPeriodChange,
  onDeleteSale,
  onDeleteExpense,
  storeName,
  onBack
}) {
  const [printReceipt, setPrintReceipt] = useState(null);

  function handlePrint() {
    window.print();
  }

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

      {selectedPeriod === 'custom' && (
        <div className="report-custom-range">
          <label className="field-block">
            <span>Dari Tanggal</span>
            <input type="date" value={customStartDate} onChange={(event) => onCustomStartChange(event.target.value)} />
          </label>

          <label className="field-block">
            <span>Sampai Tanggal</span>
            <input type="date" value={customEndDate} onChange={(event) => onCustomEndChange(event.target.value)} />
          </label>
        </div>
      )}

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

      {/* ── Daftar Pemasukan ── */}
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
                <div className="report-entry-card__actions">
                  <button
                    type="button"
                    className="print-receipt-button"
                    onClick={() => setPrintReceipt(sale)}
                  >
                    🖨️ Cetak Struk
                  </button>
                  <button
                    type="button"
                    className="delete-entry-button"
                    onClick={() => onDeleteSale?.(sale.id)}
                  >
                    Hapus transaksi
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="empty-state">Belum ada pemasukan untuk {periodLabel.toLowerCase()}.</p>
          )}
        </div>
      </div>

      {/* ── Daftar Pengeluaran ── */}
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
                <button
                  type="button"
                  className="delete-entry-button"
                  onClick={() => onDeleteExpense?.(expense.id)}
                >
                  Hapus pengeluaran
                </button>
              </article>
            ))
          ) : (
            <p className="empty-state">Belum ada pengeluaran untuk {periodLabel.toLowerCase()}.</p>
          )}
        </div>
      </div>

      {/* ── Print Receipt Modal ─────────────────────────────── */}
      {printReceipt && (
        <div
          className="pay-modal-overlay"
          onClick={() => setPrintReceipt(null)}
        >
          <div className="receipt-print-modal" onClick={(e) => e.stopPropagation()}>
            {/* Screen-only action bar */}
            <div className="receipt-print-modal__actions no-print">
              <button
                id="print-receipt-button"
                type="button"
                className="receipt-print-modal__print-btn"
                onClick={handlePrint}
              >
                🖨️ Cetak Struk
              </button>
              <button
                type="button"
                className="receipt-print-modal__close-btn"
                onClick={() => setPrintReceipt(null)}
              >
                ✕ Tutup
              </button>
            </div>

            {/* Receipt content — visible on screen + print */}
            <div className="receipt-print-content">
              <div className="receipt-print-content__header">
                <p className="receipt-print-content__store">{storeName || 'Kasir Warung'}</p>
                <p className="receipt-print-content__date">{formatEntryDateTime(printReceipt.createdAt)}</p>
                <div className="receipt-print-content__divider-dashed" />
              </div>

              <div className="receipt-print-content__items">
                {printReceipt.items.map((item, idx) => (
                  <div key={idx} className="receipt-print-content__item-row">
                    <span className="receipt-print-content__item-name">{item.name}</span>
                    <span className="receipt-print-content__item-qty">x{item.quantity}</span>
                    <span className="receipt-print-content__item-price">{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="receipt-print-content__divider-dashed" />

              <div className="receipt-print-content__total-row">
                <span>TOTAL</span>
                <strong>{formatRupiah(printReceipt.total)}</strong>
              </div>

              <div className="receipt-print-content__divider-dashed" />

              <p className="receipt-print-content__footer">Terima kasih sudah belanja! 🙏</p>
            </div>
          </div>
        </div>
      )}
    </ScreenLayout>
  );
}