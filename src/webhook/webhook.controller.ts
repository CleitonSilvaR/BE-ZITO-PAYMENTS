import { Request, Response } from 'express';
import { supabase } from '../database/supabase.client';
import { StripeGateway } from '../gateways/stripe/stripe.gateway';
import { findProjectByApiKey, findActiveGatewayConfig } from '../projects/project.service';
import {
  isEventAlreadyProcessed,
  savePaymentEvent,
  dispatchCallback,
} from './webhook.service';

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const gatewayParam = req.params['gateway'];
  const gateway = Array.isArray(gatewayParam) ? gatewayParam[0] : gatewayParam;
  const projectIdHeader = req.headers['x-project-id'];
  const projectId = Array.isArray(projectIdHeader) ? projectIdHeader[0] : projectIdHeader;

  if (!projectId) {
    res.status(400).json({ error: 'Missing x-project-id header' });
    return;
  }

  const { data: projectData } = await supabase
    .schema('payments')
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (!projectData) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const project = projectData as { id: string; name: string; api_key: string; callback_url: string };

  const gatewayConfig = await findActiveGatewayConfig(project.id, gateway);
  if (!gatewayConfig) {
    res.status(404).json({ error: 'No active gateway config found' });
    return;
  }

  let gatewayHandler;
  if (gateway === 'stripe') {
    gatewayHandler = new StripeGateway(gatewayConfig.config as never);
  } else {
    res.status(400).json({ error: `Unsupported gateway: ${gateway}` });
    return;
  }

  const signature = req.headers['stripe-signature'] as string;
  const rawBody = req.body as Buffer;

  let result;
  try {
    result = await gatewayHandler.handleWebhookEvent(rawBody, signature);
  } catch (err) {
    console.error(`[${project.name}] [${gateway}] webhook validation failed:`, err);
    res.status(400).json({ error: 'Webhook validation failed' });
    return;
  }

  if (!result) {
    res.status(200).json({ received: true, processed: false });
    return;
  }

  console.log(`[${project.name}] [${gateway}] evento recebido: ${result.event}`);

  const alreadyProcessed = await isEventAlreadyProcessed(result.gateway_event_id);
  if (alreadyProcessed) {
    res.status(200).json({ received: true, processed: false, reason: 'duplicate' });
    return;
  }

  await savePaymentEvent(project, gateway, result, req.body);
  await dispatchCallback(project, gateway, result);

  res.status(200).json({ received: true, processed: true });
}
