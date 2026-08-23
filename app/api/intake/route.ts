import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = supabaseServer();

    const { data, error } = await supabase
      .from('intake')
      .insert({
        patient_reference: body.patient_reference,
        icd10_code: body.icd10_code,
        injury_date: body.injury_date || null,
        body_region: body.body_region,
        severity: body.severity,
        prior_treatment: body.prior_treatment,
        insurance_type: body.insurance_type,
        contraindication_flags: body.contraindication_flags,
        status: 'Ready for processing',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ intake: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}