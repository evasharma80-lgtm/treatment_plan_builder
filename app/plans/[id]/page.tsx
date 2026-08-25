import { supabaseServer } from '../../../lib/supabase';
import ReviewForm from './ReviewForm';

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
        <ReviewForm planId={plan.id} />
      )}
    </div>
  );
}