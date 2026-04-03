import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const LAST_CLIENT_CONTEXT_KEY = 'lastClientContextV1';

function readStoredContext() {
  try {
    const raw = localStorage.getItem(LAST_CLIENT_CONTEXT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function resolveClientServicesLinks(clientId, flow) {
  const params = new URLSearchParams();
  if (clientId) params.set('client_id', String(clientId));
  if (flow) params.set('flow', String(flow));
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const nutritionPath = String(flow || '').toLowerCase() === 'signup'
    ? `/add-client${suffix}`
    : `/client-nutrition-profile${suffix}`;
  return {
    nutrition: nutritionPath,
    mental: `/mental-coaching${suffix}`,
    antiDoping: `/anti-doping${suffix}`,
  };
}

export function buildClientSummary(context, fallbackClientId) {
  return {
    name: context?.full_name || '-',
    id: context?.display_id || context?.user_id || fallbackClientId || '-',
    email: context?.email || '-',
  };
}

export function useClientServicesContext() {
  const [searchParams] = useSearchParams();

  const context = useMemo(() => readStoredContext(), []);
  const clientId = useMemo(() => {
    const fromQuery = searchParams.get('client_id');
    if (fromQuery) return fromQuery;
    if (context?.user_id) return String(context.user_id);
    return '';
  }, [context, searchParams]);

  const flow = useMemo(() => {
    return searchParams.get('flow') || String(localStorage.getItem('onboardingSource') || '').toLowerCase() || '';
  }, [searchParams]);

  const links = useMemo(() => resolveClientServicesLinks(clientId, flow), [clientId, flow]);
  const summary = useMemo(() => buildClientSummary(context, clientId), [context, clientId]);

  return {
    clientId,
    flow,
    summary,
    links,
  };
}
