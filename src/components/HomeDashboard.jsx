import { formatRupiah } from '../utils/currency';

export default function HomeDashboard({
  profit,
  totalSales,
  totalExpenses,
  onNavigate,
  todayLabel,
  storeName,
  storeCode,
  userName
}) {
  const isLoss = profit < 0;

  return (
    <section className="home-dashboard">
      <div className="hero-card">
        <p className="eyebrow">{todayLabel}</p>
        <h1>{storeName}</h1>
        <div className="hero-stats">
          <div className="hero-stat hero-stat--income">
            <span className="hero-stat__label">💰 Pemasukan</span>
            <strong className="hero-stat__value">{formatRupiah(totalSales)}</strong>
          </div>
          <div className="hero-stat hero-stat--expense">
            <span className="hero-stat__label">🧾 Pengeluaran</span>
            <strong className="hero-stat__value">{formatRupiah(totalExpenses)}</strong>
          </div>
        </div>

        <p className="hero-card__label">📈 Untung Hari Ini</p>
        <strong className={`hero-card__amount ${isLoss ? 'hero-card__amount--loss' : ''}`}>
          {formatRupiah(profit)}
        </strong>
      </div>

      <div className="main-actions">
        <button type="button" className="main-action main-action--sales" onClick={() => onNavigate('sales')}>
          🛍️ Jual
        </button>
        <button type="button" className="main-action main-action--expense" onClick={() => onNavigate('expenses')}>
          💸 Pengeluaran
        </button>
        <button type="button" className="main-action main-action--report" onClick={() => onNavigate('reports')}>
          📊 Laporan
        </button>
      </div>

      <div className="secondary-actions">
        <button type="button" className="secondary-action" onClick={() => onNavigate('products')}>
          📦 Atur Produk
        </button>
        <button type="button" className="secondary-action" onClick={() => onNavigate('settings')}>
          ⚙️ Pengaturan
        </button>
      </div>
    </section>
  );
}