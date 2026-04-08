import ScreenLayout from './ScreenLayout';

export default function ExpensePage({ name, amount, onNameChange, onAmountChange, onSubmit, onBack }) {
  return (
    <ScreenLayout title="Pengeluaran" subtitle="Catat belanja atau biaya harian" onBack={onBack}>
      <form className="expense-form" onSubmit={onSubmit}>
        <label className="field-block">
          <span>Nama Pengeluaran</span>
          <input type="text" value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Contoh: Beli telur" />
        </label>

        <label className="field-block">
          <span>Jumlah Uang</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="Contoh: 25000"
          />
        </label>

        <button type="submit" className="save-button">
          Simpan Pengeluaran
        </button>
      </form>
    </ScreenLayout>
  );
}