
CREATE TABLE public.community_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#6366f1',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_spaces TO authenticated;
GRANT SELECT ON public.community_spaces TO anon;
GRANT ALL ON public.community_spaces TO service_role;
ALTER TABLE public.community_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spaces_read" ON public.community_spaces FOR SELECT USING (true);
CREATE POLICY "spaces_create" ON public.community_spaces FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND NOT public.is_banned(auth.uid()));
CREATE POLICY "spaces_update_own" ON public.community_spaces FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "spaces_delete_own_or_mod" ON public.community_spaces FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE TABLE public.space_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.community_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.space_members TO authenticated;
GRANT SELECT ON public.space_members TO anon;
GRANT ALL ON public.space_members TO service_role;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_read" ON public.space_members FOR SELECT USING (true);
CREATE POLICY "members_join" ON public.space_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "members_leave" ON public.space_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  space_id uuid REFERENCES public.community_spaces(id) ON DELETE SET NULL,
  title text,
  content text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT SELECT ON public.community_posts TO anon;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_read" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "posts_create" ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "posts_update_own" ON public.community_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own_or_mod" ON public.community_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE TABLE public.post_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  value smallint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_votes TO authenticated;
GRANT SELECT ON public.post_votes TO anon;
GRANT ALL ON public.post_votes TO service_role;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes_read" ON public.post_votes FOR SELECT USING (true);
CREATE POLICY "votes_write" ON public.post_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "votes_update" ON public.post_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "votes_delete" ON public.post_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT SELECT ON public.post_comments TO anon;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "comments_create" ON public.post_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "comments_delete_own_or_mod" ON public.post_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE TABLE public.community_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
GRANT SELECT, INSERT, DELETE ON public.community_stories TO authenticated;
GRANT SELECT ON public.community_stories TO anon;
GRANT ALL ON public.community_stories TO service_role;
ALTER TABLE public.community_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stories_read" ON public.community_stories FOR SELECT USING (expires_at > now());
CREATE POLICY "stories_create" ON public.community_stories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));
CREATE POLICY "stories_delete_own_or_mod" ON public.community_stories FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE INDEX idx_posts_created ON public.community_posts (created_at DESC);
CREATE INDEX idx_comments_post ON public.post_comments (post_id);
CREATE INDEX idx_votes_post ON public.post_votes (post_id);

CREATE POLICY "community_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-posters' AND name LIKE 'community/%' AND NOT public.is_banned(auth.uid()));
CREATE POLICY "community_delete_own_or_mod" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'course-posters' AND name LIKE 'community/%'
    AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator')));

INSERT INTO public.community_spaces (name, description, color, created_by)
SELECT s.name, s.description, s.color, ur.user_id
FROM (VALUES
  ('JEE 2027','Strategy, doubts and daily grind for JEE 2027 aspirants.','#8b5cf6'),
  ('Physics Doubts','Post any Physics doubt — get it solved fast.','#ec4899'),
  ('NEET Warriors','Biology, Chemistry and NEET strategy.','#22d3ee'),
  ('Maths Marathon','Daily maths problems and elegant solutions.','#3b82f6'),
  ('Organic Chem Warriors','GOC, reactions and mechanisms.','#f59e0b')
) AS s(name, description, color)
CROSS JOIN LATERAL (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1) ur;
