import { useMemo, useState } from 'react';

export function resolveStoredEmail(clients = [], currentClientId = null, fallbackEmail = '') {
  const fromLocal = String(fallbackEmail || '').trim();
  if (fromLocal && fromLocal !== 'null' && fromLocal !== 'undefined') return fromLocal;

  const currentId = currentClientId != null ? String(currentClientId) : '';
  if (currentId) {
    const current = clients.find((client) => String(client?.id ?? client?.displayId ?? '') === currentId);
    const email = String(current?.email || current?.emailAddress || '').trim();
    if (email && email !== 'N/A') return email;
  }

  const anyClientWithEmail = clients.find((client) => {
    const value = String(client?.email || client?.emailAddress || '').trim();
    return !!value && value !== 'N/A';
  });
  return anyClientWithEmail ? String(anyClientWithEmail.email || anyClientWithEmail.emailAddress).trim() : '';
}

export function mapAccounts(clients = [], currentClientId = null, preferredEmail = '') {
  const currentId = currentClientId != null ? String(currentClientId) : '';
  return (Array.isArray(clients) ? clients : []).map((client) => {
    const clientId = String(client?.id ?? client?.displayId ?? '');
    const isCurrent = currentId && clientId === currentId;
    const name = client?.name || client?.fullName || 'No name';
    let email = String(client?.email || client?.emailAddress || '').trim();
    if ((!email || email === 'N/A') && isCurrent) {
      email = String(preferredEmail || '').trim();
    }
    return {
      id: clientId,
      name,
      email: email && email !== 'N/A' ? email : '',
      isCurrent: Boolean(isCurrent),
    };
  });
}

export function useAccountRecovery() {
  const [storedEmail, setStoredEmail] = useState('');
  const [message, setMessage] = useState('');

  const clients = useMemo(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('clients') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const currentClientId = localStorage.getItem('currentClientId');
  const currentEmail = localStorage.getItem('clientEmail') || '';
  const accounts = useMemo(() => mapAccounts(clients, currentClientId, currentEmail), [clients, currentClientId, currentEmail]);

  const revealStoredEmail = () => {
    const found = resolveStoredEmail(clients, currentClientId, currentEmail);
    if (found) {
      localStorage.setItem('clientEmail', found);
      setStoredEmail(found);
      setMessage('Stored email loaded from browser data.');
      return;
    }
    setStoredEmail('');
    setMessage('No stored email found. You may need to add one manually.');
  };

  const updateEmailForAccount = (accountId, email) => {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) return;

    const updatedClients = clients.map((client) => {
      const clientId = String(client?.id ?? client?.displayId ?? '');
      if (clientId !== String(accountId)) return client;
      return { ...client, email: normalized };
    });

    localStorage.setItem('clients', JSON.stringify(updatedClients));
    localStorage.setItem('clientEmail', normalized);
    setStoredEmail(normalized);
    setMessage('Email updated for selected account.');
  };

  const copyEmail = async () => {
    if (!storedEmail) return false;
    try {
      await navigator.clipboard.writeText(storedEmail);
      setMessage('Email copied to clipboard.');
      return true;
    } catch {
      setMessage('Could not copy email from this browser context.');
      return false;
    }
  };

  return {
    storedEmail,
    message,
    accounts,
    revealStoredEmail,
    updateEmailForAccount,
    copyEmail,
  };
}
