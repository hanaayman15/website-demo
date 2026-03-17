function LegacyHtmlRenderer({ pageName, loading, error, bodyHtml }) {
  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading {pageName}...</div>;
  }

  if (error) {
    return <div style={{ padding: '1rem', color: '#b91c1c' }}>Error: {error}</div>;
  }

  return <div data-page={pageName} dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}

export default LegacyHtmlRenderer;
