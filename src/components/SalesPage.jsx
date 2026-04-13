import { useState } from 'react';
import { formatRupiah } from '../utils/currency';
import ScreenLayout from './ScreenLayout';

function getQuickAmounts(total) {
  const roundings = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
  const seen = new Set();
  for (const r of roundings) {
    const rounded = Math.ceil(total / r) * r;
    if (rounded > total && !seen.has(rounded)) {
      seen.add(rounded);
      if (seen.size >= 3) break;
    }
  }
  return [...seen];
}

export default function SalesPage({
  products,
  cartItems,
  total,
  onAddProduct,
  onDecreaseProduct,
  onCheckout,
  onBack
}) {
  const [showPayModal, setShowPayModal] = useState(false);
  const [cashInput, setCashInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [payError, setPayError] = useState('');

  const cashAmount = Number(cashInput) || 0;
  const kembalian = cashAmount - total;
  const isCashValid = cashAmount >= total && cashAmount > 0;
  const quickAmounts = getQuickAmounts(total);

  function handleBayarClick() {
    if (cartItems.length === 0) return;
    setCashInput('');
    setPayError('');
    setShowPayModal(true);
  }

  async function handleConfirmPay() {
    if (!isCashValid || isProcessing) return;
    setIsProcessing(true);
    setPayError('');

    try {
      await onCheckout();
      setShowPayModal(false);
      setCashInput('');
    } catch (error) {
      setPayError(error instanceof Error ? error.message : 'Gagal menyimpan transaksi. Coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  }

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
                  <span>{item.name} x{item.quantity}</span>
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

      {/* Sticky checkout bar */}
      <div className="pay-sticky-bar">
        <div className="pay-sticky-bar__total">
          <span>Total</span>
          <strong>{formatRupiah(total)}</strong>
        </div>
        <button
          type="button"
          className="pay-sticky-button"
          onClick={handleBayarClick}
          disabled={cartItems.length === 0}
        >
          💳 Bayar
        </button>
      </div>

      {/* ── Payment Confirmation Modal ──────────────────────── */}
      {showPayModal && (
        <div
          className="pay-modal-overlay"
          onClick={() => !isProcessing && setShowPayModal(false)}
        >
          <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="pay-modal__header">
              <h2>💳 Konfirmasi Bayar</h2>
              <button
                type="button"
                className="pay-modal__close"
                onClick={() => !isProcessing && setShowPayModal(false)}
                disabled={isProcessing}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            {/* Cart summary */}
            <div className="pay-modal__summary">
              {cartItems.map((item) => (
                <div key={item.id} className="pay-modal__summary-row">
                  <span>
                    {item.name} <span className="pay-modal__summary-qty">x{item.quantity}</span>
                  </span>
                  <span>{formatRupiah(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pay-modal__total-row">
              <span>🧾 Total Belanja</span>
              <strong>{formatRupiah(total)}</strong>
            </div>

            {/* Cash input */}
            <label className="pay-modal__label">
              <span>💵 Uang Diterima dari Pembeli</span>
              <input
                id="cash-received-input"
                type="number"
                inputMode="numeric"
                min="0"
                className="pay-modal__cash-input"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                placeholder="Masukkan jumlah uang..."
                autoFocus
              />
            </label>

            {/* Quick amount buttons */}
            {quickAmounts.length > 0 && (
              <div className="pay-modal__quick-amounts">
                <span className="pay-modal__quick-label">Uang pas:</span>
                <div className="pay-modal__quick-buttons">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className={`pay-modal__quick-btn ${cashAmount === amount ? 'pay-modal__quick-btn--active' : ''}`}
                      onClick={() => setCashInput(String(amount))}
                    >
                      {formatRupiah(amount)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Kembalian display */}
            <div
              className={`pay-modal__kembalian ${
                cashAmount > 0
                  ? kembalian >= 0
                    ? 'pay-modal__kembalian--valid'
                    : 'pay-modal__kembalian--invalid'
                  : ''
              }`}
            >
              <span>🔄 Kembalian</span>
              <strong>
                {cashAmount <= 0
                  ? '—'
                  : kembalian >= 0
                    ? formatRupiah(kembalian)
                    : `Kurang ${formatRupiah(Math.abs(kembalian))}`}
              </strong>
            </div>

            {/* Error */}
            {payError && <p className="pay-modal__error">⚠️ {payError}</p>}

            {/* Confirm button */}
            <button
              id="confirm-pay-button"
              type="button"
              className="pay-modal__confirm-btn"
              onClick={handleConfirmPay}
              disabled={!isCashValid || isProcessing}
            >
              {isProcessing ? '⏳ Menyimpan...' : '✅ Bayar Sekarang'}
            </button>
          </div>
        </div>
      )}
    </ScreenLayout>
  );
}