import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth.middleware';
import { StripeGateway } from '../gateways/stripe/stripe.gateway';

async function shortenUrl(url: string): Promise<string> {
  try {
    const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    return data;
  } catch {
    return url;
  }
}

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

  const short_url = await shortenUrl(checkout_url);

  console.log(`[${req.project.name}] [${gatewayConfig.gateway}] evento recebido: checkout.created`);

  res.json({ checkout_url: short_url });
});

export default router;
