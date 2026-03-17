import { useEffect, useMemo, useState } from 'react';

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

function extractInlineScripts(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
}

function stripScripts(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '');
}

export function useLegacyPage(url) {
  const [rawHtml, setRawHtml] = useState('');
  const [inlineScripts, setInlineScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load page: ' + res.status);
        }
        return res.text();
      })
      .then((html) => {
        if (!mounted) return;
        setInlineScripts(extractInlineScripts(html));
        setRawHtml(stripScripts(extractBody(html)));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(String(err.message || err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [url]);

  const bodyHtml = useMemo(() => rawHtml, [rawHtml]);
  return { bodyHtml, inlineScripts, loading, error };
}
