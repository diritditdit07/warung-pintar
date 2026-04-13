import { formatRupiah } from '../utils/currency';
import ScreenLayout from './ScreenLayout';

export default function SalesPage({
  products,
  cartItems,
  total,
  onAddProduct,
  onDecreaseProduct,
  onCheckout,
  onBack
}) {
  return (
    <ScreenLayout title="Jual" subtitle="Tekan menu untuk tambah, tekan pesanan untuk kurangi" onBack={onBack}>
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

      <div className="cart-section">
        <div className="cart-list">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className="cart-list__item cart-list__item--button"
                onClick={() => onDecreaseProduct(item.id)}
                aria-label={`Kurangi ${item.name}`}
                title={`Kurangi ${item.name}`}
              >
                <div className="cart-list__details">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <strong>{formatRupiah(item.quantity * item.price)}</strong>
                </div>

                <span className="cart-list__hint">−</span>
              </button>
            ))
          ) : (
            <p className="empty-state">Belum ada pesanan. Pilih menu di atas.</p>
          )}
        </div>
      </div>

      {/* Sticky checkout bar — selalu terlihat di bawah */}
      <div className="pay-sticky-bar">
        <div className="pay-sticky-bar__total">
          <span>Total</span>
          <strong>{formatRupiah(total)}</strong>
        </div>
        <button
          type="button"
          className="pay-sticky-button"
          onClick={onCheckout}
          disabled={cartItems.length === 0}
        >
          💳 Bayar
        </button>
      </div>
    </ScreenLayout>
  );
}