import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase';

export async function POST(req: NextRequest) {
  const { planId, reviewerName, decision, notes, totalVisits, durationWeeks } = await req.json();
  const supabase = supabaseServer();

  const { error: reviewErr } = await supabase.from('reviews').insert({
    treatment_plan_id: planId,
    reviewer_name: reviewerName,
    decision,
    notes,
  });

  if (reviewErr) {
    return NextResponse.json({ error: 'Failed to save review', detail: reviewErr.message }, { status: 500 });
  }

  const planUpdate: Record<string, unknown> = { status: decision };

  if (decision === 'Edited & approved') {
    if (totalVisits !== undefined && totalVisits !== '') {
      planUpdate.total_visits_recommended = Number(totalVisits);
    }
    if (durationWeeks !== undefined && durationWeeks !== '') {
      planUpdate.duration_weeks = Number(durationWeeks);
    }
  }

  const { error: updateErr } = await supabase.from('treatment_plans').update(planUpdate).eq('id', planId);

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to update plan status', detail: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}