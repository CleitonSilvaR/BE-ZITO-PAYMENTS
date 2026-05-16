CREATE TABLE IF NOT EXISTS payments.checkout_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  url         TEXT NOT NULL,
  project_id  UUID NOT NULL REFERENCES payments.projects(id),
  customer_ref TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_checkout_links_code ON payments.checkout_links (code);
