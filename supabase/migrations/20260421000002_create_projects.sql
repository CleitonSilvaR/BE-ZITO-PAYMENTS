CREATE TABLE IF NOT EXISTS payments.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  api_key     TEXT NOT NULL UNIQUE,
  callback_url TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
