CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    actor_id UUID REFERENCES auth.users(id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_actor FOREIGN KEY (actor_id) REFERENCES auth.users (id) ON DELETE SET NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Enable update access for users to their own notifications" ON notifications;

CREATE POLICY "Enable read access for authenticated users" ON notifications
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON notifications
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for users to their own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_message TEXT,
    p_link TEXT DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO notifications (user_id, message, link, actor_id)
    VALUES (p_user_id, p_message, p_link, p_actor_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for penduduk table
CREATE OR REPLACE FUNCTION handle_penduduk_change()
RETURNS TRIGGER AS $$
DECLARE
    operation_type TEXT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        operation_type = 'ditambahkan';
    ELSIF (TG_OP = 'UPDATE') THEN
        operation_type = 'diperbarui';
    ELSIF (TG_OP = 'DELETE') THEN
        operation_type = 'dihapus';
    END IF;

    PERFORM notify_relevant_users(
        'Data penduduk ' || COALESCE(OLD.nama, NEW.nama) || ' telah ' || operation_type,
        '/penduduk',
        auth.uid()
    );

    PERFORM notify_relevant_users(
        'Data keluarga dengan No. KK ' || COALESCE(OLD.no_kk, NEW.no_kk) || ' telah ' || operation_type,
        '/data-keluarga',
        auth.uid()
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS penduduk_change_trigger ON penduduk;
CREATE TRIGGER penduduk_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON penduduk
FOR EACH ROW EXECUTE FUNCTION handle_penduduk_change();
