ALTER TABLE users ALTER COLUMN show_avatar SET DEFAULT true;
UPDATE users SET show_avatar = true WHERE show_avatar = false;

CREATE TABLE user_avatar_uploads (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  image BYTEA NOT NULL CHECK (octet_length(image) <= 524288),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
