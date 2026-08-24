'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IntakeForm() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log('[IntakeForm] Create intake clicked — submitting form.');

    setStatus('saving');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    console.log('[IntakeForm] Payload:', data);

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      console.log('[IntakeForm] Server responded:', res.status, json);

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(json.error || `Request failed with status ${res.status}`);
        console.error('[IntakeForm] Intake creation failed:', json.error || res.status);
        return;
      }

      setStatus('idle');
      form.reset();
      router.refresh();
    } catch (err: any) {
      console.error('[IntakeForm] Network/fetch error:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Network error — could not reach the server.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <label>Patient reference</label>
      <input name="patient_reference" required placeholder="e.g. Test-002" />
      <label>ICD-10 code</label>
      <input name="icd10_code" required placeholder="e.g. S13.4" />
      <label>Injury date</label>
      <input name="injury_date" type="date" />
      <label>Body region</label>
      <input name="body_region" placeholder="e.g. Neck" />
      <label>Severity</label>
      <select name="severity">
        <option>Mild</option>
        <option>Moderate</option>
        <option>Severe</option>
      </select>
      <label>Prior treatment</label>
      <textarea name="prior_treatment" rows={2}></textarea>
      <label>Insurance type</label>
      <input name="insurance_type" placeholder="e.g. Auto / PI claim" />
      <label>Contraindication flags</label>
      <textarea name="contraindication_flags" rows={2} placeholder="e.g. prior spinal surgery"></textarea>

      {status === 'error' && (
        <p style={{ color: '#B3453A', fontWeight: 600, marginBottom: 12 }}>
          Error: {errorMsg}
        </p>
      )}

      <button type="submit" disabled={status === 'saving'}>
        {status === 'saving' ? 'Saving…' : 'Create intake'}
      </button>
    </form>
  );
}