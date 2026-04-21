export interface CheckoutParams {
  customer_ref: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface WebhookResult {
  event: 'subscription.activated' | 'subscription.cancelled';
  customer_ref: string;
  gateway_event_id: string;
}

export interface SubscriptionStatus {
  active: boolean;
  expires_at?: string;
}

export interface PaymentGateway {
  createCheckoutLink(params: CheckoutParams): Promise<string>;
  handleWebhookEvent(rawBody: Buffer, signature: string): Promise<WebhookResult | null>;
  getSubscriptionStatus(customer_ref: string): Promise<SubscriptionStatus>;
}
