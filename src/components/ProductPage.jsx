import { useEffect, useRef } from 'react';
import { formatRupiah } from '../utils/currency';
import ScreenLayout from './ScreenLayout';

export default function ProductPage({
  name,
  price,
  products,
  editingProductId,
  onNameChange,
  onPriceChange,
  onSubmit,
  onEdit,
  onDelete,
  onCancelEdit,
  onBack
}) {
  const isEditing = Boolean(editingProductId);
  const formRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    formRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });

    window.setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, prefersReducedMotion ? 0 : 220);
  }, [isEditing]);

  return (
    <ScreenLayout title="Produk" subtitle="Tambah atau ubah menu jual" onBack={onBack}>
      <form ref={formRef} className="expense-form product-form-card" onSubmit={onSubmit}>
        {isEditing && <div className="edit-banner">Sedang mengubah produk. Silakan simpan setelah selesai.</div>}

        <label className="field-block">
          <span>Nama Produk</span>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Contoh: Nasi Uduk"
          />
        </label>

        <label className="field-block">
          <span>Harga</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={price}
            onChange={(event) => onPriceChange(event.target.value)}
            placeholder="Contoh: 12000"
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="save-button">
            {isEditing ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>

          {isEditing && (
            <button type="button" className="cancel-button" onClick={onCancelEdit}>
              Batal Ubah
            </button>
          )}
        </div>
      </form>

      <div className="report-list product-list">
        {products.map((product) => (
          <article
            key={product.id}
            className={`report-card product-card ${editingProductId === product.id ? 'product-card--editing' : ''}`}
          >
            <div>
              <span>{product.name}</span>
              <strong>{formatRupiah(product.price)}</strong>
            </div>
            <div className="product-card-actions">
              <button type="button" className="product-edit-button" onClick={() => onEdit(product)}>
                Ubah
              </button>
              <button type="button" className="delete-entry-button" onClick={() => onDelete?.(product.id)}>
                Hapus
              </button>
            </div>
          </article>
        ))}
      </div>
    </ScreenLayout>
  );
}