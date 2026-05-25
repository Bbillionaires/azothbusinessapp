-- =============================================================================
-- Migration 010: Gamification — Badges, leaderboards, achievements, streaks
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
CREATE TYPE public.leaderboard_period AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'alltime'
);

CREATE TYPE public.leaderboard_category AS ENUM (
  'spending',
  'referrals',
  'reviews',
  'impact'
);

CREATE TYPE public.legend_tier AS ENUM (
  'bronze',
  'silver',
  'gold',
  'platinum',
  'legend',
  'hall_of_legends'
);

-- ---------------------------------------------------------------------------
-- user_badges
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type  TEXT NOT NULL,   -- 'first_receipt' | 'local_legend' | 'community_builder' | etc.
  badge_name  TEXT NOT NULL,
  badge_emoji TEXT,
  level       SMALLINT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),  -- bronze/silver/gold/platinum/legend
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata    JSONB NOT NULL DEFAULT '{}',   -- extra context, e.g. { "business_count": 10 }
  UNIQUE (user_id, badge_type, level)
);

CREATE INDEX idx_badges_user      ON public.user_badges(user_id);
CREATE INDEX idx_badges_type      ON public.user_badges(badge_type);
CREATE INDEX idx_badges_earned    ON public.user_badges(earned_at DESC);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges: anyone can read"
  ON public.user_badges FOR SELECT USING (TRUE);

CREATE POLICY "badges: system inserts (admins only)"
  ON public.user_badges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- leaderboard_entries
-- ---------------------------------------------------------------------------
CREATE TABLE public.leaderboard_entries (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period     public.leaderboard_period NOT NULL,
  category   public.leaderboard_category NOT NULL,
  rank       INTEGER NOT NULL CHECK (rank > 0),
  score      BIGINT NOT NULL CHECK (score >= 0),
  city       TEXT,
  state      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, period, category, city, state)
);

CREATE INDEX idx_leaderboard_period_cat ON public.leaderboard_entries(period, category);
CREATE INDEX idx_leaderboard_rank       ON public.leaderboard_entries(period, category, rank);
CREATE INDEX idx_leaderboard_user       ON public.leaderboard_entries(user_id);
CREATE INDEX idx_leaderboard_city       ON public.leaderboard_entries(city, state) WHERE city IS NOT NULL;

ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaderboard: anyone can read" ON public.leaderboard_entries FOR SELECT USING (TRUE);
CREATE POLICY "leaderboard: admins manage"
  ON public.leaderboard_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_leaderboard_updated_at
  BEFORE UPDATE ON public.leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- achievements
-- System-defined achievement definitions
-- ---------------------------------------------------------------------------
CREATE TABLE public.achievements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL UNIQUE,
  description    TEXT NOT NULL,
  icon           TEXT NOT NULL,   -- emoji or icon key
  category       TEXT NOT NULL DEFAULT 'general',
  -- criteria: { type: 'receipt_count', threshold: 10 } etc.
  criteria       JSONB NOT NULL DEFAULT '{}',
  points_reward  INTEGER NOT NULL DEFAULT 0 CHECK (points_reward >= 0),
  badge_reward   TEXT,   -- badge_type to award on completion
  is_hidden      BOOLEAN NOT NULL DEFAULT FALSE,  -- hidden until earned
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order     SMALLINT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_achievements_category ON public.achievements(category);
CREATE INDEX idx_achievements_active   ON public.achievements(is_active) WHERE is_active = TRUE;

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements: anyone reads active" ON public.achievements FOR SELECT
  USING (is_active = TRUE AND NOT is_hidden);
CREATE POLICY "achievements: admins full access"
  ON public.achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

-- ---------------------------------------------------------------------------
-- user_achievements
-- Progress tracking per user per achievement
-- ---------------------------------------------------------------------------
CREATE TABLE public.user_achievements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress       INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  target         INTEGER NOT NULL DEFAULT 1 CHECK (target >= 1),
  completed_at   TIMESTAMPTZ,
  notified_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user    ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_achiev  ON public.user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_done    ON public.user_achievements(completed_at) WHERE completed_at IS NOT NULL;

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements: user reads own" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_achievements: admins full access"
  ON public.user_achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_user_achievements_updated_at
  BEFORE UPDATE ON public.user_achievements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- spending_streaks
-- Consecutive-day local spending streaks
-- ---------------------------------------------------------------------------
CREATE TABLE public.spending_streaks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak      INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak      INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date  DATE,
  freeze_tokens       SMALLINT NOT NULL DEFAULT 0 CHECK (freeze_tokens BETWEEN 0 AND 3),
  total_streak_days   INTEGER NOT NULL DEFAULT 0 CHECK (total_streak_days >= 0),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_streaks_user ON public.spending_streaks(user_id);

ALTER TABLE public.spending_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks: user reads own" ON public.spending_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "streaks: admins full access"
  ON public.spending_streaks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_streaks_updated_at
  BEFORE UPDATE ON public.spending_streaks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- community_legends
-- Hall of Fame / Community Legend program
-- ---------------------------------------------------------------------------
CREATE TABLE public.community_legends (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  tier                      public.legend_tier NOT NULL DEFAULT 'bronze',

  -- Qualification metrics (updated periodically)
  referrals_count           INTEGER NOT NULL DEFAULT 0 CHECK (referrals_count >= 0),
  businesses_referred       INTEGER NOT NULL DEFAULT 0 CHECK (businesses_referred >= 0),
  local_spending_total      NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (local_spending_total >= 0),
  reviews_count             INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  events_attended           INTEGER NOT NULL DEFAULT 0 CHECK (events_attended >= 0),
  impact_score              NUMERIC(10,2) NOT NULL DEFAULT 0.00,

  -- Status
  inducted_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_evaluated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_permanent              BOOLEAN NOT NULL DEFAULT FALSE,  -- Hall of Legends = permanent

  -- Profile enrichment
  legend_bio                TEXT,
  featured_at               TIMESTAMPTZ,

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_legends_user    ON public.community_legends(user_id);
CREATE INDEX idx_legends_tier    ON public.community_legends(tier);
CREATE INDEX idx_legends_impact  ON public.community_legends(impact_score DESC);
CREATE INDEX idx_legends_featured ON public.community_legends(featured_at DESC) WHERE featured_at IS NOT NULL;

ALTER TABLE public.community_legends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legends: anyone can read" ON public.community_legends FOR SELECT USING (TRUE);
CREATE POLICY "legends: admins manage"
  ON public.community_legends FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin_staff', 'admin_manager', 'super_admin')
    )
  );

CREATE TRIGGER set_legends_updated_at
  BEFORE UPDATE ON public.community_legends
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Function: update spending streak when a receipt is approved
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_spending_streak(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak    public.spending_streaks;
  v_today     DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - 1;
BEGIN
  -- Upsert streak record
  INSERT INTO public.spending_streaks (user_id, current_streak, longest_streak, last_activity_date, total_streak_days)
  VALUES (p_user_id, 1, 1, v_today, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET
      current_streak    = CASE
        WHEN spending_streaks.last_activity_date = v_today     THEN spending_streaks.current_streak         -- same day, no change
        WHEN spending_streaks.last_activity_date = v_yesterday THEN spending_streaks.current_streak + 1     -- consecutive
        ELSE                                                        1                                        -- streak broken
      END,
      longest_streak    = GREATEST(
        spending_streaks.longest_streak,
        CASE
          WHEN spending_streaks.last_activity_date = v_today     THEN spending_streaks.current_streak
          WHEN spending_streaks.last_activity_date = v_yesterday THEN spending_streaks.current_streak + 1
          ELSE 1
        END
      ),
      total_streak_days = CASE
        WHEN spending_streaks.last_activity_date != v_today THEN spending_streaks.total_streak_days + 1
        ELSE spending_streaks.total_streak_days
      END,
      last_activity_date = v_today,
      updated_at         = NOW()
    RETURNING * INTO v_streak;
END;
$$;

-- ---------------------------------------------------------------------------
-- Function: award a badge to a user (idempotent)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_badge(
  p_user_id    UUID,
  p_badge_type TEXT,
  p_badge_name TEXT,
  p_badge_emoji TEXT    DEFAULT NULL,
  p_level      SMALLINT DEFAULT 1,
  p_metadata   JSONB    DEFAULT '{}'
)
RETURNS public.user_badges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_badge public.user_badges;
BEGIN
  INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_emoji, level, metadata)
  VALUES (p_user_id, p_badge_type, p_badge_name, p_badge_emoji, p_level, p_metadata)
  ON CONFLICT (user_id, badge_type, level) DO UPDATE
    SET metadata = EXCLUDED.metadata
  RETURNING * INTO v_badge;

  RETURN v_badge;
END;
$$;
