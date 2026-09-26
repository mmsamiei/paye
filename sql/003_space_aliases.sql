ALTER TABLE spaces ADD COLUMN IF NOT EXISTS aliases TEXT[] NOT NULL DEFAULT '{}';

UPDATE spaces SET aliases=ARRAY['شریف','دانشگاه صنعتی شریف']
WHERE slug='sharif-university' AND cardinality(aliases)=0;

UPDATE spaces SET aliases=ARRAY['کامپیوتر شریف','مهندسی کامپیوتر شریف','دانشکده کامپیوتر شریف']
WHERE slug='sharif-university/computer-engineering' AND cardinality(aliases)=0;
