import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase';
import { runGuardrails } from '../../../lib/rulesEngine';
import { buildPrompt } from '../../../lib/prompt';

export async function POST(req: NextRequest) {
  const { intakeId } = await req.json();
  const supabase = supabaseServer();

  const { data: intake, error: intakeErr } = await supabase
    .from('intake')
    .select('*')
    .eq('id', intakeId)
    .single();
  if (intakeErr || !intake) {
    return NextResponse.json({ error: 'Intake record not found' }, { status: 404 });
  }

  const { data: protocols } = await supabase
    .from('protocols')
    .select('*')
    .eq('icd10_code', intake.icd10_code);

  const guardrails = runGuardrails(intake, protocols || []);
  const { system, user } = buildPrompt(intake, protocols || [], guardrails);

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY!}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    return NextResponse.json({ error: 'LLM call failed', detail: errText }, { status: 502 });
  }

  const groqData = await groqRes.json();
  const rawText = groqData.choices?.[0]?.message?.content || '{}';

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: 'LLM returned invalid JSON', raw: rawText }, { status: 502 });
  }

  const { data: plan, error: insertErr } = await supabase
    .from('treatment_plans')
    .insert({
      intake_id: intake.id,
      plan_name: `Plan for ${intake.patient_reference}`,
      total_visits_recommended: parsed.total_visits_recommended,
      duration_weeks: parsed.duration_weeks,
      plan_summary: parsed.plan_summary,
      excluded_options: guardrails.excluded,
      explanation: parsed.explanation,
      guardrail_trace: guardrails.trace,
      sources_cited: (parsed.plan_summary || []).flatMap((p: any) => p.procedures?.map((x: any) => x.source) || []),
      status: 'Pending review',
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  await supabase.from('intake').update({ status: 'Plan generated', guardrail_notes: guardrails.notes.join(' ') }).eq('id', intake.id);

  return NextResponse.json({ plan });
}