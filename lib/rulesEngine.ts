// Deterministic guardrail checks, run BEFORE the LLM call.
// This is the layer that keeps recommendations defensible — every
// result here gets logged into guardrail_trace on the treatment plan.

export type Protocol = {
  id: string;
  name: string;
  icd10_code: string;
  phase: string;
  recommended_visits: number | null;
  procedures: string | null;
  therapy_type: string[] | null;
  contraindications: string | null;
};

export type Intake = {
  id: string;
  icd10_code: string;
  contraindication_flags: string | null;
  severity: string | null;
};

export type GuardrailResult = {
  notes: string[];
  trace: { rule_id: string; result: string; detail?: string }[];
  excluded: { option: string; reason: string }[];
};

export function runGuardrails(intake: Intake, protocols: Protocol[]): GuardrailResult {
  const trace: GuardrailResult['trace'] = [];
  const excluded: GuardrailResult['excluded'] = [];
  const notes: string[] = [];

  if (protocols.length === 0) {
    notes.push('No matching protocol found for this diagnosis code — flag for senior review.');
    trace.push({ rule_id: 'protocol_match', result: 'no_match' });
    return { notes, trace, excluded };
  }

  trace.push({ rule_id: 'protocol_match', result: 'matched', detail: `${protocols.length} protocol(s) found` });

  const flags = (intake.contraindication_flags || '').toLowerCase();

  for (const protocol of protocols) {
    const contraindications = (protocol.contraindications || '').toLowerCase();

    if (flags.includes('prior spinal surgery') && contraindications.includes('spinal manipulation')) {
      excluded.push({
        option: 'Spinal manipulation',
        reason: 'Contraindicated — prior spinal surgery flagged in intake',
      });
      trace.push({ rule_id: 'contraindication_check', result: 'flag_removed', detail: 'spinal_manipulation' });
    }

    if (protocol.recommended_visits && protocol.recommended_visits > 15) {
      notes.push(`${protocol.name}: recommended visit count (${protocol.recommended_visits}) is unusually high — flag for senior review.`);
      trace.push({ rule_id: 'max_visits_check', result: 'outlier', detail: protocol.name });
    } else if (protocol.recommended_visits) {
      trace.push({ rule_id: 'max_visits_check', result: 'within_limit', detail: `${protocol.recommended_visits}` });
    }
  }

  return { notes, trace, excluded };
}
