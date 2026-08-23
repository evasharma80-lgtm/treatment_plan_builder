import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase';

export async function POST(req: NextRequest) {
  const { planId, reviewerName, decision, notes } = await req.json();
  const supabase = supabaseServer();

  await supabase.from('reviews').insert({
    treatment_plan_id: planId,
    reviewer_name: reviewerName,
    decision,
    notes,
  });

  const newStatus = decision; // 'Approved' | 'Edited & approved' | 'Rejected'
  await supabase.from('treatment_plans').update({ status: newStatus }).eq('id', planId);

  return NextResponse.json({ ok: true });
}
