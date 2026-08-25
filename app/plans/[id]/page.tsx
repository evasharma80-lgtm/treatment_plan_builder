import { supabaseServer } from '../../../lib/supabase';
import ReviewForm from './ReviewForm';

const RULE_LABELS: Record<string, string> = {
  protocol_match: 'Protocol matching',
  contraindication_check: 'Contraindication check',
  max_visits_check: 'Visit count check',
};

function friendlyTrace(rule_id: string, result: string, detail?: string) {
  const label = RULE_LABELS[rule_id] || rule_id;
  if (rule_id === 'protocol_match') {
    return result === 'matched'
      ? `✅ ${label}: found ${detail}`
      : `⚠️ ${label}: no matching protocol found for this diagnosis`;
  }
  if (rule_id === 'contraindication_check') {
    return `⚠️ ${label}: removed "${detail}" due to a contraindication flagged in intake`;
  }
  if (rule_id === 'max_visits_check') {
    return result === 'outlier'
      ? `⚠️ ${label}: "${detail}" recommends more visits than typical — flagged for review`
      : `✅ ${label}: visit count within normal range (${detail})`;
  }
  return `${label}: ${result}${detail ? ` (${detail})` : ''}`;
}

export default async function PlanDetail({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();
  const { data: plan } = await supabase.from('treatment_plans').select('*, intake(*)').eq('id', params.id).single();

  if (!plan) return <p>Plan not found.</p>;

  const summary = plan.plan_summary || [];
  const excluded = plan.excluded_options || [];
  const trace = plan.guardrail_trace || [];
  const sources: string[] = Array.from(new Set((plan.sources_cited || []).filter(Boolean)));
  const hasFlags = trace.some((t: any) => t.result === 'no_match' || t.result === 'outlier') || excluded.length > 0;

  return (
    <div>
      <h1>{plan.plan_name}</h1>
      <p><strong>Status:</strong> {plan.status}</p>
      <p><strong>Total visits:</strong> {plan.total_visits_recommended} over {plan.duration_weeks} weeks</p>

      <h3>Plan summary</h3>
      {summary.length === 0 && <p>No plan phases were generated.</p>}
      {summary.map((phase: any, idx: number) => (
        <div key={idx} className="card" style={{ marginBottom: 12 }}>
          <p style={{ margin: 0 }}><strong>{phase.phase}</strong> — {phase.visits_per_week}x/week</p>
          <ul style={{ marginTop: 8, marginBottom: 0 }}>
            {(phase.procedures || []).map((proc: any, pIdx: number) => (
              <li key={pIdx}>
                {proc.name}
                {proc.source && <span style={{ color: '#666' }}> (from: {proc.source})</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h3>Explanation</h3>
      <p>{plan.explanation}</p>

      {excluded.length > 0 && (
        <>
          <h3>What was excluded</h3>
          <ul>
            {excluded.map((e: any, idx: number) => (
              <li key={idx}><strong>{e.option}</strong> — {e.reason}</li>
            ))}
          </ul>
        </>
      )}

      {sources.length > 0 && (
        <>
          <h3>Protocols used</h3>
          <ul>
            {sources.map((s, idx) => <li key={idx}>{s}</li>)}
          </ul>
        </>
      )}

      <details open={hasFlags}>
        <summary>Guardrail trace {hasFlags && '(flagged — review recommended)'}</summary>
        <ul>
          {trace.map((t: any, idx: number) => (
            <li key={idx}>{friendlyTrace(t.rule_id, t.result, t.detail)}</li>
          ))}
        </ul>
      </details>

      {plan.status === 'Pending review' && (
        <ReviewForm
          planId={plan.id}
          currentTotalVisits={plan.total_visits_recommended}
          currentDurationWeeks={plan.duration_weeks}
        />
      )}
    </div>
  );
}