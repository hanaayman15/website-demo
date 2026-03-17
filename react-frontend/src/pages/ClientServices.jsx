import { useEffect } from 'react';
import { useLegacyPage } from '../hooks/useLegacyPage';
import LegacyHtmlRenderer from '../components/layout/LegacyHtmlRenderer';
import '../assets/styles/responsive.css';
import '../assets/styles/dashboard-template.css';

function ClientServices() {
  const { bodyHtml, inlineScripts, loading, error } = useLegacyPage('/legacy/client-services.html');

  useEffect(() => {
    // Migration metadata for this page.
    const migrationInfo = {
      file: 'client-services.html',
      inlineScriptCount: 1,
      formCount: 0,
    };

    if (migrationInfo.inlineScriptCount > 0) {
      // TODO: Replace legacy inline JS with dedicated React hooks and event handlers.
      // This scaffold intentionally avoids executing legacy inline scripts.
      console.debug('Legacy migration info', migrationInfo, inlineScripts.length);
    }
  }, [inlineScripts]);

  return (
    <LegacyHtmlRenderer
      pageName="ClientServices"
      loading={loading}
      error={error}
      bodyHtml={bodyHtml}
    />
  );
}

export default ClientServices;
