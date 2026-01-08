-- =====================================================
-- IDEABOX DATABASE SCHEMA
-- Esegui questo script nell'SQL Editor di Supabase
-- =====================================================

-- Abilita estensione UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================
CREATE TYPE idea_status AS ENUM (
  'draft',
  'submitted',
  'organized',
  'under_review',
  'approved',
  'rejected',
  'scheduled',
  'completed'
);

-- =====================================================
-- TABELLE
-- =====================================================

-- Profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_direction BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ideas
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ai_summary TEXT,
  ai_tags TEXT[],
  ai_similar_ideas TEXT[],
  ai_processed_at TIMESTAMPTZ,
  quality_score NUMERIC DEFAULT 0,
  priority_score NUMERIC DEFAULT 0,
  quality_votes_count INTEGER DEFAULT 0,
  priority_votes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  status idea_status DEFAULT 'submitted',
  review_cycle INTEGER,
  direction_verdict TEXT,
  direction_motivation TEXT,
  direction_reviewed_by UUID REFERENCES profiles(id),
  direction_reviewed_at TIMESTAMPTZ,
  scheduled_quarter TEXT,
  scheduled_priority INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  priority_rating INTEGER CHECK (priority_rating >= 1 AND priority_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  content TEXT NOT NULL,
  is_direction_reply BOOLEAN DEFAULT FALSE,
  reply_to_direction BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review Cycles
CREATE TABLE review_cycles (
  id SERIAL PRIMARY KEY,
  cycle_number INTEGER NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  review_date DATE NOT NULL,
  reveal_date DATE,
  status TEXT DEFAULT 'active',
  top_ideas_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Direction Decisions
CREATE TABLE direction_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  cycle_id INTEGER REFERENCES review_cycles(id),
  verdict TEXT NOT NULL,
  motivation TEXT NOT NULL,
  reviewed_by UUID REFERENCES profiles(id),
  quality_score_at_review NUMERIC,
  priority_score_at_review NUMERIC,
  rank_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDICI
-- =====================================================
CREATE INDEX idx_ideas_author ON ideas(author_id);
CREATE INDEX idx_ideas_category ON ideas(category_id);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_created ON ideas(created_at DESC);
CREATE INDEX idx_votes_idea ON votes(idea_id);
CREATE INDEX idx_votes_user ON votes(user_id);
CREATE INDEX idx_comments_idea ON comments(idea_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;

-- =====================================================
-- FUNZIONI
-- =====================================================

-- Funzione per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at
  BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funzione per creare profilo automaticamente dopo signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per creare profilo su signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Funzione per aggiornare score dopo voto
CREATE OR REPLACE FUNCTION update_idea_scores()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ideas
  SET
    quality_score = COALESCE((
      SELECT AVG(quality_rating)::NUMERIC(3,2)
      FROM votes
      WHERE idea_id = COALESCE(NEW.idea_id, OLD.idea_id)
      AND quality_rating IS NOT NULL
    ), 0),
    quality_votes_count = (
      SELECT COUNT(*)
      FROM votes
      WHERE idea_id = COALESCE(NEW.idea_id, OLD.idea_id)
      AND quality_rating IS NOT NULL
    ),
    priority_score = COALESCE((
      SELECT AVG(priority_rating)::NUMERIC(3,2)
      FROM votes
      WHERE idea_id = COALESCE(NEW.idea_id, OLD.idea_id)
      AND priority_rating IS NOT NULL
    ), 0),
    priority_votes_count = (
      SELECT COUNT(*)
      FROM votes
      WHERE idea_id = COALESCE(NEW.idea_id, OLD.idea_id)
      AND priority_rating IS NOT NULL
    )
  WHERE id = COALESCE(NEW.idea_id, OLD.idea_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scores_on_vote
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_idea_scores();

-- Funzione per aggiornare conteggio commenti
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas SET comments_count = comments_count + 1 WHERE id = NEW.idea_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas SET comments_count = comments_count - 1 WHERE id = OLD.idea_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE direction_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- CATEGORIES policies (pubbliche in lettura)
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage categories" ON categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- IDEAS policies
CREATE POLICY "Ideas are viewable by authenticated users" ON ideas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create ideas" ON ideas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can update own ideas" ON ideas
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Direction can update any idea" ON ideas
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_direction = true OR is_admin = true))
  );

-- VOTES policies
CREATE POLICY "Votes are viewable by authenticated users" ON votes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own votes" ON votes
  FOR ALL USING (user_id = auth.uid());

-- COMMENTS policies
CREATE POLICY "Comments are viewable by authenticated users" ON comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can update own comments" ON comments
  FOR UPDATE USING (author_id = auth.uid());

-- REVIEW_CYCLES policies
CREATE POLICY "Review cycles are viewable by authenticated users" ON review_cycles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only direction can manage review cycles" ON review_cycles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_direction = true OR is_admin = true))
  );

-- DIRECTION_DECISIONS policies
CREATE POLICY "Direction decisions are viewable by authenticated users" ON direction_decisions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only direction can create decisions" ON direction_decisions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_direction = true OR is_admin = true))
  );

-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- DATI INIZIALI - CATEGORIE
-- =====================================================
INSERT INTO categories (name, description, color, icon) VALUES
  ('Prodotti', 'Idee per nuovi prodotti o miglioramenti', '#3b82f6', 'package'),
  ('Processi', 'Ottimizzazione dei processi aziendali', '#10b981', 'settings'),
  ('Tecnologia', 'Innovazioni tecnologiche e digitali', '#8b5cf6', 'cpu'),
  ('Marketing', 'Strategie di marketing e comunicazione', '#f59e0b', 'megaphone'),
  ('HR & Cultura', 'Risorse umane e cultura aziendale', '#ec4899', 'users'),
  ('Sostenibilità', 'Iniziative green e sostenibili', '#22c55e', 'leaf'),
  ('Customer Experience', 'Miglioramento esperienza cliente', '#06b6d4', 'heart'),
  ('Altro', 'Altre idee e suggerimenti', '#6b7280', 'lightbulb');

-- =====================================================
-- FINE SCHEMA
-- =====================================================
