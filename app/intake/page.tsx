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