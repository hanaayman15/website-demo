import '../../assets/styles/react-pages.css';

function PageLayout({
  title,
  subtitle,
  actions = null,
  maxWidth = 1100,
  gap = '1rem',
  children,
}) {
  return (
    <main className="react-page-wrap react-grid" style={{ maxWidth, gap }}>
      {(title || subtitle || actions) ? (
        <section className="react-panel react-row-between" style={{ flexWrap: 'wrap' }}>
          <div>
            {title ? <h1 style={{ marginTop: 0, marginBottom: '0.35rem' }}>{title}</h1> : null}
            {subtitle ? <p className="react-muted" style={{ margin: 0 }}>{subtitle}</p> : null}
          </div>
          {actions ? <div className="react-inline-actions">{actions}</div> : null}
        </section>
      ) : null}
      {children}
    </main>
  );
}

export default PageLayout;
