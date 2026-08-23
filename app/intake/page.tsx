import { supabaseServer } from '../../lib/supabase';
import { revalidatePath } from 'next/cache';

async function createIntake(formData: FormData) {
  'use server';
  const supabase = supabaseServer();
  await supabase.from('intake').insert({
    patient_reference: formData.get('patient_reference'),
    icd10_code: formData.get('icd10_code'),
    injury_date: formData.get('injury_date') || null,
    body_region: formData.get('body_region'),
    severity: formData.get('severity'),
    prior_treatment: formData.get('prior_treatment'),
    insurance_type: formData.get('insurance_type'),
    contraindication_flags: formData.get('contraindication_flags'),
    status: 'Ready for processing',
  });
  revalidatePath('/intake');
}

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
      <form action={createIntake} className="card">
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
        <button type="submit">Create intake</button>
      </form>

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
