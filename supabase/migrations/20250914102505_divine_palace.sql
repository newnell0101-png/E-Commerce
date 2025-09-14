/*
  # Complete CameroonMart Database Schema
  
  This migration creates all necessary tables for the CameroonMart application
  including the missing gamification and chat system tables.
  
  ## New Tables
  1. `user_rewards` - User reward tracking
  2. `achievements` - Achievement definitions
  3. `user_achievements` - User achievement progress
  4. `surprise_events` - Surprise event management
  5. `chat_sessions` - Chat session management
  6. `chat_messages` - Chat message storage
  7. `voice_search_logs` - Voice search analytics
  8. `comments` - Product comment system
  9. `comment_votes` - Comment voting system
  
  ## Security
  - Enable RLS on all tables
  - Add appropriate policies for each table
  - Implement proper user access controls
*/

-- User Rewards System
CREATE TABLE IF NOT EXISTS user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('daily_login', 'first_purchase', 'loyalty_points', 'surprise_gift', 'achievement')),
  title text NOT NULL,
  description text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  claimed boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rewards"
  ON user_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
  ON user_rewards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Achievements System
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT 'trophy',
  points integer NOT NULL DEFAULT 0,
  requirement_type text NOT NULL CHECK (requirement_type IN ('orders', 'spending', 'login_streak', 'referrals')),
  requirement_value integer NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are publicly readable"
  ON achievements FOR SELECT
  TO public
  USING (active = true);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Surprise Events
CREATE TABLE IF NOT EXISTS surprise_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('flash_sale', 'mystery_box', 'spin_wheel', 'daily_gift')),
  active boolean DEFAULT true,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE surprise_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active surprise events are publicly readable"
  ON surprise_events FOR SELECT
  TO public
  USING (active = true AND (end_date IS NULL OR end_date > now()));

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES profiles(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'waiting')),
  subject text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat sessions"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chat sessions"
  ON chat_sessions FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'manager')
  ));

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  file_url text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their sessions"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = session_id 
    AND (chat_sessions.user_id = auth.uid() OR chat_sessions.admin_id = auth.uid())
  ));

CREATE POLICY "Users can send messages in their sessions"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = session_id 
    AND (chat_sessions.user_id = auth.uid() OR chat_sessions.admin_id = auth.uid())
  ));

-- Voice Search Logs
CREATE TABLE IF NOT EXISTS voice_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  search_query text NOT NULL,
  transcription_confidence real,
  results_count integer DEFAULT 0,
  session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE voice_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice search logs"
  ON voice_search_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments System
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  status text DEFAULT 'published' CHECK (status IN ('published', 'pending', 'hidden', 'deleted')),
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published comments are publicly readable"
  ON comments FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comment Votes
CREATE TABLE IF NOT EXISTS comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own votes"
  ON comment_votes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_type ON user_rewards(type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_admin_id ON chat_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_comments_product_id ON comments(product_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_rewards_updated_at BEFORE UPDATE ON user_rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample achievements
INSERT INTO achievements (title, description, icon, points, requirement_type, requirement_value) VALUES
('First Purchase', 'Complete your first order', 'shopping-bag', 100, 'orders', 1),
('Loyal Customer', 'Complete 10 orders', 'heart', 500, 'orders', 10),
('Big Spender', 'Spend over 100,000 FCFA', 'dollar-sign', 1000, 'spending', 100000),
('Daily Visitor', 'Login for 7 consecutive days', 'calendar', 250, 'login_streak', 7),
('Social Butterfly', 'Refer 5 friends', 'users', 750, 'referrals', 5)
ON CONFLICT DO NOTHING;

-- Insert sample surprise events
INSERT INTO surprise_events (title, description, type, config) VALUES
('Daily Spin Wheel', 'Spin the wheel for daily rewards', 'spin_wheel', '{"rewards": [{"type": "points", "value": 50}, {"type": "discount", "value": 10}]}'),
('Mystery Box Monday', 'Special mystery boxes every Monday', 'mystery_box', '{"discount": 20, "min_items": 3}'),
('Flash Sale Friday', 'Lightning deals every Friday', 'flash_sale', '{"duration": 3600, "discount": 30}')
ON CONFLICT DO NOTHING;