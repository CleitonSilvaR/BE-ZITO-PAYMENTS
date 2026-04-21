import StripeLib = require('stripe');
import { supabase } from '../../database/supabase.client';
import {
  CheckoutParams,
  PaymentGateway,
  SubscriptionStatus,
  WebhookResult,
} from '../gateway.interface';

type StripeInstance = InstanceType<typeof StripeLib>;

interface StripeConfig {
  secret_key: string;
  webhook_secret: string;
  price_id: string;
  success_url: string;
  cancel_url: string;
}

interface SessionLike {
  metadata?: Record<string, string> | null;
  client_reference_id?: string | null;
  url?: string | null;
}

interface SubscriptionLike {
  metadata?: Record<string, string>;
}

interface EventLike {
  id: string;
  type: string;
  data: { object: unknown };
}

export class StripeGateway implements PaymentGateway {
  private stripe: StripeInstance;
  private config: StripeConfig;

  constructor(config: StripeConfig) {
    this.config = config;
    this.stripe = new StripeLib(config.secret_key);
  }

  async createCheckoutLink(params: CheckoutParams): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: params.priceId || this.config.price_id, quantity: 1 }],
      success_url: params.successUrl || this.config.success_url,
      cancel_url: params.cancelUrl || this.config.cancel_url,
      client_reference_id: params.customer_ref,
      metadata: { customer_ref: params.customer_ref },
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }

    return session.url;
  }

  async handleWebhookEvent(
    rawBody: Buffer,
    signature: string
  ): Promise<WebhookResult | null> {
    let event: EventLike;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.config.webhook_secret
      ) as unknown as EventLike;
    } catch (err) {
      throw new Error(`Webhook signature validation failed: ${err}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as SessionLike;
      const customer_ref =
        session.metadata?.['customer_ref'] ?? session.client_reference_id ?? '';

      return {
        event: 'subscription.activated',
        customer_ref,
        gateway_event_id: event.id,
      };
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as SubscriptionLike;
      const customer_ref = subscription.metadata?.['customer_ref'] ?? '';

      return {
        event: 'subscription.cancelled',
        customer_ref,
        gateway_event_id: event.id,
      };
    }

    return null;
  }

  async getSubscriptionStatus(customer_ref: string): Promise<SubscriptionStatus> {
    const { data, error } = await supabase
      .schema('payments')
      .from('payment_events')
      .select('event_type, processed_at')
      .eq('customer_ref', customer_ref)
      .eq('gateway', 'stripe')
      .order('processed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { active: false };
    }

    return {
      active: (data as { event_type: string }).event_type === 'subscription.activated',
    };
  }
}
