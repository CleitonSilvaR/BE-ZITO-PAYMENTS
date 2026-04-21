CREATE TABLE IF NOT EXISTS payments.payment_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES payments.projects(id),
  gateway           TEXT NOT NULL,
  event_type        TEXT NOT NULL,     -- 'subscription.activated' | 'subscription.cancelled'
  customer_ref      TEXT NOT NULL,     -- identificador do cliente no projeto (ex: phone)
  gateway_event_id  TEXT NOT NULL UNIQUE, -- para idempotência
  payload           JSONB,
  processed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON payments.payment_events (project_id, customer_ref);
