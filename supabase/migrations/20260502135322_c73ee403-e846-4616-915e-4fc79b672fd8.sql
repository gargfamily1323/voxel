ALTER TABLE public.tasks ALTER COLUMN category TYPE TEXT USING category::text;
ALTER TABLE public.tasks ALTER COLUMN category SET DEFAULT 'PERSONAL';
DROP TYPE IF EXISTS task_category;