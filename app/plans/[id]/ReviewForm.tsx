'use client';

import { useState } from 'react';

export default function ReviewForm({
  planId,
  currentTotalVisits,
  currentDurationWeeks,
}: {
  planId: string;
  currentTotalVisits: number | null;
  currentDurationWeeks: number | null;
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [decision, setDecision] = useState('Approved');

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
      <select name="decision" value={decision} onChange={(e) => setDecision(e.target.value)}>
        <option>Approved</option>
        <option>Edited &amp; approved</option>
        <option>Rejected</option>
      </select>

      {decision === 'Edited & approved' && (
        <div style={{ marginTop: 10, marginBottom: 10, paddingLeft: 12, borderLeft: '3px solid #ddd' }}>
          <label>Total visits</label>
          <input
            name="totalVisits"
            type="number"
            min={0}
            defaultValue={currentTotalVisits ?? undefined}
            required
          />
          <label>Duration (weeks)</label>
          <input
            name="durationWeeks"
            type="number"
            min={0}
            defaultValue={currentDurationWeeks ?? undefined}
            required
          />
          <p style={{ fontSize: 13, color: '#666', marginTop: 6, marginBottom: 0 }}>
            Original recommendation: {currentTotalVisits ?? '—'} visits over {currentDurationWeeks ?? '—'} weeks.
            Editing here will overwrite the plan with your reviewed values — the edit is tracked in Notes.
          </p>
        </div>
      )}

      <label>Notes</label>
      <textarea name="notes" rows={2} placeholder={decision === 'Edited & approved' ? 'Explain what was changed and why' : ''}></textarea>

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