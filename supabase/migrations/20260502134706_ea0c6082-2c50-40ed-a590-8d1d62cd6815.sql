ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sort_order DOUBLE PRECISION NOT NULL DEFAULT 0;
UPDATE public.tasks SET sort_order = EXTRACT(EPOCH FROM created_at) WHERE sort_order = 0;
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON public.tasks(sort_order);