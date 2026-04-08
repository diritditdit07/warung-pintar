import ScreenLayout from './ScreenLayout';

export default function SettingsPage({
  storeName,
  sessionInfo,
  onStoreNameChange,
  onSubmit,
  onLogout,
  onBack
}) {
  return (
    <ScreenLayout title="Setting" subtitle="Ubah nama warung" onBack={onBack}>
      <div className="settings-info-card">
        <span>{sessionInfo.storeCode}</span>
        <strong>{sessionInfo.userName}</strong>
      </div>

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

        <button type="button" className="cancel-button" onClick={onLogout}>
          Keluar dari Warung
        </button>
      </form>
    </ScreenLayout>
  );
}