function LockedOverlay({
  title = 'Premium Feature',
  description,
  ctaLabel = 'Upgrade Now',
  onCta,
  borderColor = '#c4b5fd',
  children,
}) {
  return (
    <section className="react-panel react-grid" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', zIndex: 2 }}>
        <div className="react-panel react-grid" style={{ maxWidth: 430, borderColor }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <p className="react-muted" style={{ margin: 0 }}>{description}</p>
          <button className="react-btn" type="button" onClick={onCta}>{ctaLabel}</button>
        </div>
      </div>

      <div style={{ filter: 'blur(4px)', pointerEvents: 'none' }}>
        {children}
      </div>
    </section>
  );
}

export default LockedOverlay;
