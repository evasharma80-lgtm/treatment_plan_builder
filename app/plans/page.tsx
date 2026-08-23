import { supabaseServer } from '../../lib/supabase';

const statusClass: Record<string, string> = {
  'Pending review': 'status-pending',
  'Approved': 'status-approved',
  'Edited & approved': 'status-approved',
  'Rejected': 'status-rejected',
};

export default async function PlansPage() {
  const supabase = supabaseServer();
  const { data: plans } = await supabase.from('treatment_plans').select('*, intake(*)').order('generated_at', { ascending: false });

  return (
    <div>
      <h1>Treatment plans</h1>
      {(plans || []).map((p: any) => (
        <a key={p.id} href={`/plans/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="card">
            <span className={`status ${statusClass[p.status]}`}>{p.status}</span>
            <h3 style={{ margin: '8px 0 4px' }}>{p.plan_name}</h3>
            <p style={{ margin: 0, color: '#666' }}>{p.total_visits_recommended} visits over {p.duration_weeks} weeks</p>
          </div>
        </a>
      ))}
      {(!plans || plans.length === 0) && <p>No plans yet — generate one from the Intake page.</p>}
    </div>
  );
}
