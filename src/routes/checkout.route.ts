import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { StripeGateway } from '../gateways/stripe/stripe.gateway';

const router = Router();

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { customer_ref } = req.body as { customer_ref: string };

  if (!customer_ref) {
    res.status(400).json({ error: 'customer_ref is required' });
    return;
  }

  const { gatewayConfig } = req;
  let gateway;

  if (gatewayConfig.gateway === 'stripe') {
    gateway = new StripeGateway(gatewayConfig.config as never);
  } else {
    res.status(400).json({ error: `Unsupported gateway: ${gatewayConfig.gateway}` });
    return;
  }

  const config = gatewayConfig.config;

  const checkout_url = await gateway.createCheckoutLink({
    customer_ref,
    priceId: config['price_id'] ?? '',
    successUrl: config['success_url'] ?? '',
    cancelUrl: config['cancel_url'] ?? '',
  });

  console.log(`[${req.project.name}] [${gatewayConfig.gateway}] evento recebido: checkout.created`);

  res.json({ checkout_url });
});

export default router;
