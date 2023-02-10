CREATE TABLE IF NOT EXISTS images (
  image_id TEXT PRIMARY KEY,
  -- Considering the
  -- image_id TEXT,
  source_url TEXT,
  user_id TEXT,
  annotations TEXT,
  status TEXT,
  created INTEGER,
  updated INTEGER
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS images_by_user ON images (user_id, created);
