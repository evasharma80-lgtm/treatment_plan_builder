import { supabaseServer } from '../../../lib/supabase';
import { revalidatePath } from 'next/cache';

async function submitReview(formData: FormData) {
  'use server';
  const planId = formData.get('planId');
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId,
      reviewerName: formData.get('reviewerName'),
      decision: formData.get('decision'),
      notes: formData.get('notes'),
    }),
  });
  revalidatePath(`/plans/${planId}`);
}

export default async function PlanDetail({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: plan } = await supabase.from('treatment_plans').select('*, intake(*)').eq('id', params.id).single();

  if (!plan) return <p>Plan not found.</p>;

  return (
    <div>
      <h1>{plan.plan_name}</h1>
      <p><strong>Status:</strong> {plan.status}</p>
      <p><strong>Total visits:</strong> {plan.total_visits_recommended} over {plan.duration_weeks} weeks</p>

      <h3>Plan summary</h3>
      <pre className="card" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(plan.plan_summary, null, 2)}</pre>

      <h3>Explanation</h3>
      <p>{plan.explanation}</p>

      <details>
        <summary>Guardrail trace &amp; excluded options</summary>
        <p><strong>Excluded:</strong></p>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(plan.excluded_options, null, 2)}</pre>
        <p><strong>Trace:</strong></p>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(plan.guardrail_trace, null, 2)}</pre>
        <p><strong>Sources cited:</strong></p>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(plan.sources_cited, null, 2)}</pre>
      </details>

      {plan.status === 'Pending review' && (
        <form action={submitReview} className="card" style={{ marginTop: 20 }}>
          <input type="hidden" name="planId" value={plan.id} />
          <label>Reviewer name</label>
          <input name="reviewerName" required />
          <label>Decision</label>
          <select name="decision">
            <option>Approved</option>
            <option>Edited & approved</option>
            <option>Rejected</option>
          </select>
          <label>Notes</label>
          <textarea name="notes" rows={2}></textarea>
          <button type="submit">Submit review</button>
        </form>
      )}
    </div>
  );
}
