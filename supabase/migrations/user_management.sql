-- Function to set the role of a user
CREATE OR REPLACE FUNCTION set_user_role(
    p_user_id UUID,
    p_role TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', p_role)
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify all admins and kadus
CREATE OR REPLACE FUNCTION notify_relevant_users(
    p_message TEXT,
    p_link TEXT DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    target_user RECORD;
BEGIN
    FOR target_user IN SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'kadus'
    LOOP
        PERFORM create_notification(target_user.id, p_message, p_link, p_actor_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION set_user_role(UUID, TEXT) TO authenticated;