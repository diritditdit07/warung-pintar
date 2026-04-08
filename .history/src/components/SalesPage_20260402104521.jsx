import { formatRupiah } from '../utils/currency';
import ScreenLayout from './ScreenLayout';

export default function SalesPage({ products, cartItems, total, onAddProduct, onCheckout, onBack }) {
  return (
    <ScreenLayout title="Jual" subtitle="Tekan menu untuk menambah pesanan" onBack={onBack}>
      <div className="product-grid">
        {products.map((product) => (
          <button
            type="button"
            key={product.id}
            className="product-button"
            onClick={() => onAddProduct(product)}
          >
            <span>{product.name}</span>
            <strong>{formatRupiah(product.price)}</strong>
          </button>
        ))}
      </div>

      <div className="summary-card">
        <div className="summary-card__row">
          <span>Jumlah Item</span>
          <strong>{cartItems.length}</strong>
        </div>

        <div className="cart-list">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div key={item.id} className="cart-list__item">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <strong>{formatRupiah(item.quantity * item.price)}</strong>
              </div>
            ))
          ) : (
            <p className="empty-state">Belum ada pesanan.</p>
          )}
        </div>

        <div className="summary-card__row summary-card__row--total">
          <span>Total</span>
          <strong>{formatRupiah(total)}</strong>
        </div>

        <button type="button" className="pay-button" onClick={onCheckout} disabled={cartItems.length === 0}>
          Bayar
        </button>
      </div>
    </ScreenLayout>
  );
}