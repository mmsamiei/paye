ALTER TABLE spaces ADD COLUMN IF NOT EXISTS slug_segment TEXT;

UPDATE spaces SET slug_segment = slug WHERE slug_segment IS NULL;

-- The only existing child was entered with its university repeated in its slug.
UPDATE spaces SET slug_segment = 'computer-engineering'
WHERE slug = 'sharif-computer-engineering'
  AND parent_id = (SELECT id FROM spaces WHERE slug = 'sharif-university');

WITH RECURSIVE paths AS (
  SELECT id, slug_segment AS full_slug FROM spaces WHERE parent_id IS NULL
  UNION ALL
  SELECT child.id, paths.full_slug || '/' || child.slug_segment
  FROM spaces child JOIN paths ON child.parent_id = paths.id
)
UPDATE spaces SET slug = paths.full_slug FROM paths WHERE spaces.id = paths.id;

ALTER TABLE spaces ALTER COLUMN slug_segment SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS spaces_sibling_segment_idx
  ON spaces (parent_id, slug_segment) NULLS NOT DISTINCT;
