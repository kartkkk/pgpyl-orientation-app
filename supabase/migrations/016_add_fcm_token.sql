-- Add FCM token column for web push notifications (replacing expo_push_token)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token text;
