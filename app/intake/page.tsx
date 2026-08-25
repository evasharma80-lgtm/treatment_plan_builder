export const dynamic = 'force-dynamic';

import { supabaseServer } from '../../lib/supabase';
import IntakeForm from './IntakeForm';
import GeneratePlanButton from './GeneratePlanButton';

export default async function IntakePage() {
  const supabase = supabaseServer();
  const { data: intakes, error: listError } = await supabase
    .from('intake')
    .select('*')
    .order('created_at', { ascending: false });

  if (listError) {
    console.error('[IntakePage] Failed to load intakes:', listError);
  }

  return (
    <div>
      <h1>New intake</h1>
      <IntakeForm />

      <h2>Existing intakes</h2>
      {listError && (
        <p style={{ color: '#B3453A', fontWeight: 600 }}>
          Error loading intakes: {listError.message}
        </p>
      )}
      {(intakes || []).map((i) => (
        <div key={i.id} className="card">
          <strong>{i.patient_reference}</strong> — {i.icd10_code} — {i.status}
          {i.status === 'Ready for processing' && (
            <GeneratePlanButton intakeId={i.id} />
          )}
        </div>
      ))}
    </div>
  );
}