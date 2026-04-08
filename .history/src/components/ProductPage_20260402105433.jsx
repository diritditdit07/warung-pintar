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
  onCancelEdit,
  onBack
}) {
  const isEditing = Boolean(editingProductId);

  return (
    <ScreenLayout title="Produk" subtitle="Tambah atau ubah menu jual" onBack={onBack}>
      <form className="expense-form" onSubmit={onSubmit}>
        <label className="field-block">
          <span>Nama Produk</span>
          <input
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
          <article key={product.id} className="report-card product-card">
            <div>
              <span>{product.name}</span>
              <strong>{formatRupiah(product.price)}</strong>
            </div>
            <button type="button" className="product-edit-button" onClick={() => onEdit(product)}>
              Ubah
            </button>
          </article>
        ))}
      </div>
    </ScreenLayout>
  );
}