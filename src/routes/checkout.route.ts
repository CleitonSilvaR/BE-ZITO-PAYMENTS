import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { authMiddleware } from '../middleware/auth.middleware';
import { StripeGateway } from '../gateways/stripe/stripe.gateway';
import { supabase } from '../database/supabase.client';

const CHECKOUT_BASE_URL = process.env.CHECKOUT_BASE_URL ?? 'https://be-zito-payments-production.up.railway.app';

function generateCode(): string {
  return randomBytes(5).toString('base64url').slice(0, 8);
}

async function saveCheckoutLink(
  code: string,
  url: string,
  projectId: string,
  customerRef: string
): Promise<void> {
  await supabase.schema('payments').from('checkout_links').insert({
    code,
    url,
    project_id: projectId,
    customer_ref: customerRef,
  });
}

const router = Router();

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { customer_ref } = req.body as { customer_ref: string };

  if (!customer_ref) {
    res.status(400).json({ error: 'customer_ref is required' });
    return;
  }

  const { gatewayConfig, project } = req;

  if (gatewayConfig.gateway !== 'stripe') {
    res.status(400).json({ error: `Unsupported gateway: ${gatewayConfig.gateway}` });
    return;
  }

  const gateway = new StripeGateway(gatewayConfig.config as never);
  const config = gatewayConfig.config;

  const stripe_url = await gateway.createCheckoutLink({
    customer_ref,
    priceId: config['price_id'] ?? '',
    successUrl: config['success_url'] ?? '',
    cancelUrl: config['cancel_url'] ?? '',
  });

  const code = generateCode();
  await saveCheckoutLink(code, stripe_url, project.id, customer_ref);

  const checkout_url = `${CHECKOUT_BASE_URL}/pay/${code}`;

  console.log(`[${project.name}] [${gatewayConfig.gateway}] checkout criado: ${checkout_url}`);

  res.json({ checkout_url });
});

export default router;
