'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GeneratePlanButton({ intakeId }: { intakeId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleClick() {
    console.log('[GeneratePlanButton] Generate plan clicked for intake', intakeId);
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId }),
      });
      const json = await res.json();

      console.log('[GeneratePlanButton] Server responded:', res.status, json);

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(json.error || `Request failed with status ${res.status}`);
        console.error('[GeneratePlanButton] Plan generation failed:', json.error, json.detail || '');
        return;
      }

      setStatus('idle');
      router.refresh();
    } catch (err: any) {
      console.error('[GeneratePlanButton] Network/fetch error:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Network error — could not reach the server.');
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={handleClick} disabled={status === 'loading'}>
        {status === 'loading' ? 'Generating…' : 'Generate plan'}
      </button>
      {status === 'error' && (
        <p style={{ color: '#B3453A', fontWeight: 600, marginTop: 6 }}>
          Error: {errorMsg}
        </p>
      )}
    </div>
  );
}