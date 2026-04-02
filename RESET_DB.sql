DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS session_players CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS players CASCADE;

CREATE TABLE players (
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

CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Badminton Session',
  session_date DATE NOT NULL,
  session_time TEXT NOT NULL DEFAULT '18:00',
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','active','completed')),
  player_of_day UUID REFERENCES players(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE session_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  checked_in BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  points_scored INTEGER NOT NULL DEFAULT 0,
  points_conceded INTEGER NOT NULL DEFAULT 0,
  UNIQUE(session_id, player_id)
);

CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  game_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','completed')),
  team_a_player1 UUID REFERENCES players(id),
  team_a_player2 UUID REFERENCES players(id),
  team_b_player1 UUID REFERENCES players(id),
  team_b_player2 UUID REFERENCES players(id),
  sitting_out UUID[],
  team_a_score INTEGER,
  team_b_score INTEGER,
  balance_score INTEGER DEFAULT 75,
  locked BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  session_id UUID REFERENCES sessions(id),
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE session_players;
ALTER PUBLICATION supabase_realtime ADD TABLE games;
