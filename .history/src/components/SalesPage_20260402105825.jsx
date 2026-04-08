import { formatRupiah } from '../utils/currency';
import ScreenLayout from './ScreenLayout';

export default function SalesPage({
  products,
  cartItems,
  total,
  onAddProduct,
  onDecreaseProduct,
  onRemoveProduct,
  onCancelSale,
  onCheckout,
  onBack
}) {
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
                <div className="cart-list__details">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <strong>{formatRupiah(item.quantity * item.price)}</strong>
                </div>

                <div className="cart-list__actions">
                  <button
                    type="button"
                    className="cart-action-button cart-action-button--secondary"
                    onClick={() => onDecreaseProduct(item.id)}
                  >
                    Kurang
                  </button>
                  <button
                    type="button"
                    className="cart-action-button cart-action-button--danger"
                    onClick={() => onRemoveProduct(item.id)}
                  >
                    Hapus
                  </button>
                </div>
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

        <div className="checkout-actions">
          <button type="button" className="sale-cancel-button" onClick={onCancelSale} disabled={cartItems.length === 0}>
            Batal
          </button>
          <button type="button" className="pay-button" onClick={onCheckout} disabled={cartItems.length === 0}>
            Bayar
          </button>
        </div>
      </div>
    </ScreenLayout>
  );
}