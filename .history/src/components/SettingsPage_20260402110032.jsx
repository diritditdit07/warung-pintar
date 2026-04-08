import ScreenLayout from './ScreenLayout';

export default function SettingsPage({ storeName, onStoreNameChange, onSubmit, onBack }) {
  return (
    <ScreenLayout title="Setting" subtitle="Ubah nama warung" onBack={onBack}>
      <form className="expense-form product-form-card" onSubmit={onSubmit}>
        <label className="field-block">
          <span>Nama Warung</span>
          <input
            type="text"
            value={storeName}
            onChange={(event) => onStoreNameChange(event.target.value)}
            placeholder="Contoh: Warung Bu Rina"
          />
        </label>

        <button type="submit" className="save-button">
          Simpan Nama Warung
        </button>
      </form>
    </ScreenLayout>
  );
}