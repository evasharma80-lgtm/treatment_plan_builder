-- AI Treatment Plan Builder — Supabase schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

create table protocols (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icd10_code text not null,
  diagnosis_description text,
  phase text check (phase in ('Acute care', 'Rehabilitation', 'Maintenance')),
  recommended_visits int,
  visits_per_week int,
  procedures text,
  therapy_type text[],
  contraindications text,
  source text default 'Clinic-authored',
  notes text,
  created_at timestamptz default now()
);

create table intake (
  id uuid primary key default gen_random_uuid(),
  patient_reference text not null,
  icd10_code text not null,
  injury_date date,
  body_region text,
  severity text check (severity in ('Mild', 'Moderate', 'Severe')),
  prior_treatment text,
  insurance_type text,
  contraindication_flags text,
  status text default 'Draft' check (status in ('Draft', 'Ready for processing', 'Plan generated')),
  guardrail_notes text,
  created_at timestamptz default now()
);

create table treatment_plans (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid references intake(id) on delete cascade,
  plan_name text,
  total_visits_recommended int,
  duration_weeks int,
  plan_summary jsonb,
  excluded_options jsonb,
  explanation text,
  guardrail_trace jsonb,
  sources_cited jsonb,
  status text default 'Pending review' check (status in ('Pending review', 'Approved', 'Edited & approved', 'Rejected')),
  generated_at timestamptz default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  treatment_plan_id uuid references treatment_plans(id) on delete cascade,
  reviewer_name text,
  decision text check (decision in ('Approved', 'Edited & approved', 'Rejected')),
  notes text,
  reviewed_at timestamptz default now()
);

-- Starter protocols — replace with the clinic's own documented practice.
insert into protocols (name, icd10_code, diagnosis_description, phase, recommended_visits, visits_per_week, procedures, therapy_type, contraindications, source, notes) values
('Cervical strain — acute phase', 'S13.4', 'Sprain of ligaments of cervical spine', 'Acute care', 6, 3, '97140 Manual therapy
97110 Therapeutic exercise', ARRAY['Physical therapy','Chiropractic'], 'Avoid spinal manipulation if prior spinal surgery or fracture suspected', 'Clinic-authored', 'Starter protocol — replace with the clinic''s own documented practice.'),
('Cervical strain — rehab phase', 'S13.4', 'Sprain of ligaments of cervical spine', 'Rehabilitation', 6, 2, '97110 Therapeutic exercise
97530 Therapeutic activities', ARRAY['Physical therapy'], '', 'Clinic-authored', 'Starter protocol — replace with the clinic''s own documented practice.'),
('Lumbar strain — acute phase', 'M54.5', 'Low back pain', 'Acute care', 8, 3, '97140 Manual therapy
97012 Mechanical traction', ARRAY['Physical therapy','Chiropractic'], 'Avoid spinal manipulation if prior spinal surgery or fracture suspected', 'Clinic-authored', 'Starter protocol — replace with the clinic''s own documented practice.'),
('Lumbar strain — rehab phase', 'M54.5', 'Low back pain', 'Rehabilitation', 6, 2, '97110 Therapeutic exercise
97530 Therapeutic activities', ARRAY['Physical therapy'], '', 'Clinic-authored', 'Starter protocol — replace with the clinic''s own documented practice.'),
('Whiplash-associated disorder — acute phase', 'S13.4XXA', 'Whiplash injury, initial encounter', 'Acute care', 10, 3, '97140 Manual therapy
97035 Ultrasound therapy', ARRAY['Physical therapy','Chiropractic'], 'Avoid aggressive manipulation in first 2 weeks post-injury', 'Clinic-authored', 'Starter protocol — replace with the clinic''s own documented practice.');
