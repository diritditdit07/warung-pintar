export default function ScreenLayout({ title, subtitle, onBack, children }) {
  return (
    <section className="screen-card">
      <div className="screen-card__header">
        <button type="button" className="back-button" onClick={onBack}>
          ← Beranda
        </button>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}