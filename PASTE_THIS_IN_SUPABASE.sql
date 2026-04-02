-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#c9a84c',
  skill_rating INTEGER NOT NULL DEFAULT 1000,
  total_games INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  total_points_scored INTEGER NOT NULL DEFAULT 0,
  total_points_conceded INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup','active','completed')),
  player_of_day UUID REFERENCES players(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Session players
CREATE TABLE IF NOT EXISTS session_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  status TEXT NOT NULL DEFAULT 'otw' CHECK (status IN ('here','otw','absent','arrived')),
  arrived_at TIMESTAMPTZ,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  session_points_scored INTEGER NOT NULL DEFAULT 0,
  session_points_conceded INTEGER NOT NULL DEFAULT 0,
  UNIQUE(session_id, player_id)
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  game_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','live','completed')),
  team_a_player1 UUID REFERENCES players(id),
  team_a_player2 UUID REFERENCES players(id),
  team_b_player1 UUID REFERENCES players(id),
  team_b_player2 UUID REFERENCES players(id),
  sitting_out UUID[],
  team_a_score INTEGER,
  team_b_score INTEGER,
  competitiveness_score INTEGER DEFAULT 75,
  submitted_by TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  session_id UUID REFERENCES sessions(id),
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_players;
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE badges;

-- Disable RLS on all tables (open access, PIN-protected at app level)
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;

-- Seed 8 default players (skip if already exist)
INSERT INTO players (name, initials, color, skill_rating)
SELECT * FROM (VALUES
  ('Abhishek', 'AB', '#c9a84c', 1050),
  ('Manu', 'MK', '#4ab9d4', 1020),
  ('Rajan', 'RS', '#c9a84c', 1080),
  ('Priya', 'PV', '#c44bd4', 980),
  ('Arjun', 'AS', '#4cd98a', 960),
  ('Neha', 'NK', '#e85d4a', 940),
  ('Vikram', 'VR', '#7b8cde', 970),
  ('Sunita', 'SA', '#d4c44b', 930)
) AS v(name, initials, color, skill_rating)
WHERE NOT EXISTS (SELECT 1 FROM players LIMIT 1);
