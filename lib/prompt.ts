import { Protocol, Intake, GuardrailResult } from './rulesEngine';

export function buildPrompt(intake: Intake, protocols: Protocol[], guardrails: GuardrailResult) {
  const protocolText = protocols
    .map(
      (p) =>
        `[${p.name}] Phase: ${p.phase}. Recommended visits: ${p.recommended_visits}. Procedures: ${p.procedures}. Therapy: ${(p.therapy_type || []).join(', ')}.`
    )
    .join('\n');

  const excludedText = guardrails.excluded.map((e) => `${e.option} (${e.reason})`).join('; ') || 'None';

  const system = `You are generating a draft treatment plan for a Personal Injury clinic. You must ONLY recommend procedures, visit counts, and therapy types that appear in the protocol excerpts provided below. Never invent a procedure or code that isn't listed. For every recommendation, cite which protocol it came from. Exclude anything listed as already excluded. Respond with ONLY valid JSON, no other text, in this exact shape:
{
  "total_visits_recommended": number,
  "duration_weeks": number,
  "plan_summary": [ { "phase": string, "visits_per_week": number, "procedures": [ { "name": string, "source": string } ] } ],
  "explanation": string
}`;

  const user = `Diagnosis code: ${intake.icd10_code}
Severity: ${intake.severity}
Already excluded: ${excludedText}

Available protocols:
${protocolText}`;

  return { system, user };
}
