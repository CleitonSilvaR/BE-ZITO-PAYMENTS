CREATE TABLE IF NOT EXISTS payments.payment_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES payments.projects(id),
  gateway     TEXT NOT NULL,           -- 'stripe' | 'mercadopago' | etc
  is_active   BOOLEAN NOT NULL DEFAULT true,
  config      TEXT NOT NULL,           -- credenciais criptografadas via AES-256
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
