import { useEffect } from 'react';
import { useLegacyPage } from '../hooks/useLegacyPage';
import LegacyHtmlRenderer from '../components/layout/LegacyHtmlRenderer';
import '../assets/styles/responsive.css';
import '../assets/styles/dashboard-template.css';

function ClientSignup() {
  const { bodyHtml, inlineScripts, loading, error } = useLegacyPage('/legacy/client-signup.html');

  useEffect(() => {
    // Migration metadata for this page.
    const migrationInfo = {
      file: 'client-signup.html',
      inlineScriptCount: 2,
      formCount: 1,
    };

    if (migrationInfo.inlineScriptCount > 0) {
      // TODO: Replace legacy inline JS with dedicated React hooks and event handlers.
      // This scaffold intentionally avoids executing legacy inline scripts.
      console.debug('Legacy migration info', migrationInfo, inlineScripts.length);
    }
  }, [inlineScripts]);

  return (
    <LegacyHtmlRenderer
      pageName="ClientSignup"
      loading={loading}
      error={error}
      bodyHtml={bodyHtml}
    />
  );
}

export default ClientSignup;
