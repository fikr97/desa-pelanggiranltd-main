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

-- Function to notify all admins
CREATE OR REPLACE FUNCTION notify_admins(
    p_message TEXT,
    p_link TEXT DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    admin_user RECORD;
BEGIN
    FOR admin_user IN SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    LOOP
        PERFORM create_notification(admin_user.id, p_message, p_link, p_actor_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for penduduk table
CREATE OR REPLACE FUNCTION handle_penduduk_change()
RETURNS TRIGGER AS $$
DECLARE
    operation_type TEXT;
    actor_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        operation_type = 'ditambahkan';
    ELSIF (TG_OP = 'UPDATE') THEN
        operation_type = 'diperbarui';
    ELSIF (TG_OP = 'DELETE') THEN
        operation_type = 'dihapus';
    END IF;

    actor_id := current_setting('request.jwt.claims', true)::jsonb->>'sub';

    PERFORM notify_admins(
        'Data penduduk ' || COALESCE(OLD.nama, NEW.nama) || ' telah ' || operation_type,
        '/penduduk',
        actor_id
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for wilayah table
CREATE OR REPLACE FUNCTION handle_wilayah_change()
RETURNS TRIGGER AS $$
DECLARE
    operation_type TEXT;
    actor_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        operation_type = 'ditambahkan';
    ELSIF (TG_OP = 'UPDATE') THEN
        operation_type = 'diperbarui';
    ELSIF (TG_OP = 'DELETE') THEN
        operation_type = 'dihapus';
    END IF;

    actor_id := current_setting('request.jwt.claims', true)::jsonb->>'sub';

    PERFORM notify_admins(
        'Data wilayah ' || COALESCE(OLD.nama, NEW.nama) || ' telah ' || operation_type,
        '/wilayah',
        actor_id
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for form_tugas table
CREATE OR REPLACE FUNCTION handle_form_tugas_change()
RETURNS TRIGGER AS $$
DECLARE
    operation_type TEXT;
    actor_id UUID;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        operation_type = 'dibuat';
    ELSIF (TG_OP = 'UPDATE') THEN
        operation_type = 'diperbarui';
    ELSIF (TG_OP = 'DELETE') THEN
        operation_type = 'dihapus';
    END IF;

    actor_id := current_setting('request.jwt.claims', true)::jsonb->>'sub';

    PERFORM notify_admins(
        'Form tugas ' || COALESCE(OLD.nama_tugas, NEW.nama_tugas) || ' telah ' || operation_type,
        '/form-tugas',
        actor_id
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER form_tugas_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON form_tugas
FOR EACH ROW EXECUTE FUNCTION handle_form_tugas_change();


-- Function to notify all kadus
CREATE OR REPLACE FUNCTION notify_kadus(
    p_message TEXT,
    p_link TEXT DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    kadus_user RECORD;
BEGIN
    FOR kadus_user IN SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'kadus'
    LOOP
        PERFORM create_notification(kadus_user.id, p_message, p_link, p_actor_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;