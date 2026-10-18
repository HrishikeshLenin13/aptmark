-- Deployment scaffold, not applied to a remote project. Review before cloud migration.
BEGIN;
CREATE SCHEMA IF NOT EXISTS content_private;
REVOKE ALL ON SCHEMA content_private FROM PUBLIC, anon, authenticated;
CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 target_date date, target_score integer CHECK(target_score BETWEEN 400 AND 1600),
 weekly_minutes integer NOT NULL DEFAULT 120 CHECK(weekly_minutes BETWEEN 30 AND 1800),
 preferred_days integer[] NOT NULL DEFAULT ARRAY[1,3,5], created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.skills (
 id text PRIMARY KEY, section text NOT NULL CHECK(section IN ('math','rw')),
 domain text NOT NULL, name text NOT NULL, taxonomy_version text NOT NULL
);
CREATE TABLE public.skill_prerequisites (
 skill_id text REFERENCES public.skills(id), prerequisite_id text REFERENCES public.skills(id),
 PRIMARY KEY(skill_id,prerequisite_id), CHECK(skill_id<>prerequisite_id)
);
CREATE TABLE public.questions (
 id text PRIMARY KEY, version integer NOT NULL, skill_id text NOT NULL REFERENCES public.skills(id),
 section text NOT NULL CHECK(section IN ('math','rw')), domain text NOT NULL,
 stem text NOT NULL, passage text, options jsonb NOT NULL, assets jsonb,
 difficulty text NOT NULL, family text NOT NULL, cluster_id text NOT NULL,
 content_hash text NOT NULL, source text NOT NULL, license text NOT NULL,
 validation_passed boolean NOT NULL DEFAULT false,
 editorial_status text NOT NULL DEFAULT 'pending' CHECK(editorial_status IN ('pending','approved','rejected')),
 publication_status text NOT NULL DEFAULT 'candidate' CHECK(publication_status IN ('candidate','published')),
 CHECK(publication_status<>'published' OR (validation_passed AND editorial_status='approved'))
);
CREATE TABLE content_private.question_versions (
 question_id text NOT NULL REFERENCES public.questions(id), version integer NOT NULL,
 full_payload jsonb NOT NULL, correct_answer text NOT NULL, accepted_responses jsonb NOT NULL,
 explanation text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(question_id,version)
);
CREATE TABLE content_private.editorial_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), question_id text NOT NULL REFERENCES public.questions(id),
 version integer NOT NULL, reviewer_id uuid NOT NULL REFERENCES auth.users(id),
 action text NOT NULL CHECK(action IN ('approve','reject','publish','unpublish','edit')),
 notes text NOT NULL CHECK(length(notes)>=15), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.attempts (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 question_id text NOT NULL REFERENCES public.questions(id), question_version integer NOT NULL,
 answer text NOT NULL, correct boolean NOT NULL, assisted boolean NOT NULL,
 independent boolean NOT NULL, seconds numeric NOT NULL CHECK(seconds>=0),
 misconception text NOT NULL DEFAULT 'uncertain', student_note text NOT NULL DEFAULT '',
 due_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX attempt_history ON public.attempts(user_id,created_at DESC);
CREATE INDEX attempt_item ON public.attempts(user_id,question_id);
CREATE INDEX question_retrieval ON public.questions(section,skill_id,difficulty) WHERE publication_status='published';
CREATE TABLE public.bookmarks (user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, question_id text REFERENCES public.questions(id), PRIMARY KEY(user_id,question_id));
CREATE TABLE public.exam_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 state jsonb NOT NULL, spec_version text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.question_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 question_id text NOT NULL REFERENCES public.questions(id), message text NOT NULL CHECK(length(message) BETWEEN 8 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE content_private.model_versions (id text PRIMARY KEY, configuration jsonb NOT NULL, evaluation jsonb, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE content_private.admin_audit_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor uuid REFERENCES auth.users(id), action text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_own ON public.profiles FOR ALL TO authenticated USING (id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE POLICY skills_read ON public.skills FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY prerequisites_read ON public.skill_prerequisites FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY questions_published ON public.questions FOR SELECT TO anon,authenticated USING(publication_status='published' AND editorial_status='approved');
CREATE POLICY attempts_own_read ON public.attempts FOR SELECT TO authenticated USING(user_id=auth.uid());
-- No authenticated INSERT/UPDATE policy for authoritative scoring or exam state.
-- The future trusted server adapter writes attempts and exam state with service credentials.
CREATE POLICY exams_own_read ON public.exam_sessions FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY bookmarks_own ON public.bookmarks FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY reports_own_insert ON public.question_reports FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
GRANT USAGE ON SCHEMA content_private TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA content_private TO service_role;
REVOKE INSERT,UPDATE,DELETE ON public.attempts,public.exam_sessions FROM anon,authenticated;
COMMIT;
