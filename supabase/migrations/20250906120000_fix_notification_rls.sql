-- Drop the old SELECT policy
DROP POLICY "Enable read access for authenticated users" ON notifications;

-- Create a new SELECT policy that restricts access to the user's own notifications
CREATE POLICY "Enable read access for users to their own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

-- Reminder: Make sure to enable real-time for the 'notifications' table in your Supabase project settings.
