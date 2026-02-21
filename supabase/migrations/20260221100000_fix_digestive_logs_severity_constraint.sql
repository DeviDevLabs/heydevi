-- Fix digestive_logs severity constraint to allow 0 (no symptoms)
-- Current constraint is (severity >= 1 AND severity <= 5)

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'digestive_logs' AND constraint_name = 'digestive_logs_severity_check'
    ) THEN
        ALTER TABLE public.digestive_logs DROP CONSTRAINT digestive_logs_severity_check;
    END IF;
END $$;

ALTER TABLE public.digestive_logs ADD CONSTRAINT digestive_logs_severity_check CHECK (severity >= 0 AND severity <= 5);
