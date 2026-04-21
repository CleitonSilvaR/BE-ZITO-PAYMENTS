import axios from 'axios';
import { supabase } from '../database/supabase.client';
import { WebhookResult } from '../gateways/gateway.interface';
import { Project } from '../payments/payment.types';

export async function isEventAlreadyProcessed(gatewayEventId: string): Promise<boolean> {
  const { data } = await supabase
    .schema('payments')
    .from('payment_events')
    .select('id')
    .eq('gateway_event_id', gatewayEventId)
    .maybeSingle();

  return !!data;
}

export async function savePaymentEvent(
  project: Project,
  gateway: string,
  result: WebhookResult,
  payload: unknown
): Promise<void> {
  const { error } = await supabase
    .schema('payments')
    .from('payment_events')
    .insert({
      project_id: project.id,
      gateway,
      event_type: result.event,
      customer_ref: result.customer_ref,
      gateway_event_id: result.gateway_event_id,
      payload,
    });

  if (error) {
    throw new Error(`Failed to save payment event: ${error.message}`);
  }
}

export async function dispatchCallback(
  project: Project,
  gateway: string,
  result: WebhookResult
): Promise<void> {
  const body = {
    event: result.event,
    customer_ref: result.customer_ref,
    gateway,
    project_id: project.id,
  };

  try {
    await axios.post(project.callback_url, body, { timeout: 10000 });
  } catch (err) {
    console.error(`[${project.name}] [${gateway}] callback failed:`, err);
  }
}
