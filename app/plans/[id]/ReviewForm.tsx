'use client';

import { useState } from 'react';

export default function ReviewForm({ planId }: { planId: string }) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log('[ReviewForm] Submit review clicked for plan', planId);

    setStatus('saving');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    console.log('[ReviewForm] Payload:', data);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      console.log('[ReviewForm] Server responded:', res.status, json);

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(json.error || `Request failed with status ${res.status}`);
        console.error('[ReviewForm] Review submission failed:', json.error, json.detail || '');
        return;
      }

      window.location.reload();
    } catch (err: any) {
      console.error('[ReviewForm] Network/fetch error:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Network error — could not reach the server.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginTop: 20 }}>
      <input type="hidden" name="planId" value={planId} />
      <label>Reviewer name</label>
      <input name="reviewerName" required />
      <label>Decision</label>
      <select name="decision">
        <option>Approved</option>
        <option>Edited &amp; approved</option>
        <option>Rejected</option>
      </select>
      <label>Notes</label>
      <textarea name="notes" rows={2}></textarea>

      {status === 'error' && (
        <p style={{ color: '#B3453A', fontWeight: 600, marginTop: 10 }}>
          Error: {errorMsg}
        </p>
      )}

      <button type="submit" disabled={status === 'saving'}>
        {status === 'saving' ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}