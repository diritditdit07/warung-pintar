import { formatRupiah } from '../utils/currency';

export default function HomeDashboard({ profit, onNavigate, todayLabel }) {
  return (
    <section className="home-dashboard">
      <div className="hero-card">
        <p className="eyebrow">{todayLabel}</p>
        <h1>Kasir Warung</h1>
        <p className="hero-card__label">Untung Hari Ini</p>
        <strong className="hero-card__amount">{formatRupiah(profit)}</strong>
      </div>

      <div className="main-actions">
        <button type="button" className="main-action main-action--sales" onClick={() => onNavigate('sales')}>
          Jual
        </button>
        <button type="button" className="main-action main-action--expense" onClick={() => onNavigate('expenses')}>
          Pengeluaran
        </button>
        <button type="button" className="main-action main-action--report" onClick={() => onNavigate('reports')}>
          Laporan
        </button>
      </div>
    </section>
  );
}