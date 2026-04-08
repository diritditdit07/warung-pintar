export default function LoginPage({
  storeCode,
  pin,
  isSubmitting,
  errorMessage,
  onStoreCodeChange,
  onPinChange,
  onSubmit
}) {
  return (
    <section className="login-shell">
      <div className="login-card">
        <p className="eyebrow">Masuk warung</p>
        <h1>Kasir Warung</h1>
        <p className="login-card__subtitle">Masukkan kode warung dan PIN untuk mulai jualan.</p>

        <form className="expense-form" onSubmit={onSubmit}>
          <label className="field-block">
            <span>Kode Warung</span>
            <input
              type="text"
              autoCapitalize="characters"
              value={storeCode}
              onChange={(event) => onStoreCodeChange(event.target.value.toUpperCase())}
              placeholder="Contoh: WARUNG-DEMO"
            />
          </label>

          <label className="field-block">
            <span>PIN</span>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(event) => onPinChange(event.target.value)}
              placeholder="Masukkan PIN"
            />
          </label>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button type="submit" className="save-button" disabled={isSubmitting}>
            {isSubmitting ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </section>
  );
}