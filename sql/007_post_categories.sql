ALTER TABLE posts
  ADD COLUMN category TEXT CHECK (category IN ('companionship','learning','advice','discussion'));

ALTER TABLE posts
  ADD COLUMN category_source TEXT NOT NULL DEFAULT 'auto'
    CHECK (category_source IN ('auto','manual'));
