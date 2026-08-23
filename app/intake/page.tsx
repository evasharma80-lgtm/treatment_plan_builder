export const dynamic = 'force-dynamic';

import { supabaseServer } from '../../lib/supabase';
import { revalidatePath } from 'next/cache';
import IntakeForm from './IntakeForm';

async function generatePlan(formData: FormData) {
  'use server';
  const intakeId = formData.get('intakeId');
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/generate-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intakeId }),
  });
  revalidatePath('/intake');
}

export default async function IntakePage() {
  const supabase = supabaseServer();
  const { data: intakes } = await supabase.from('intake').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <h1>New intake</h1>
      <IntakeForm />

      <h2>Existing intakes</h2>
      {(intakes || []).map((i) => (
        <div key={i.id} className="card">
          <strong>{i.patient_reference}</strong> — {i.icd10_code} — {i.status}
          {i.status === 'Ready for processing' && (
            <form action={generatePlan} style={{ marginTop: 10 }}>
              <input type="hidden" name="intakeId" value={i.id} />
              <button type="submit">Generate plan</button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}