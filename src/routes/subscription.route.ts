import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { supabase } from '../database/supabase.client';

const router = Router();

router.get('/:customer_ref', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { customer_ref } = req.params;
  const { project } = req;

  const { data } = await supabase
    .schema('payments')
    .from('payment_events')
    .select('event_type, processed_at')
    .eq('project_id', project.id)
    .eq('customer_ref', customer_ref)
    .order('processed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    res.json({ active: false });
    return;
  }

  res.json({
    active: data.event_type === 'subscription.activated',
    gateway: req.gatewayConfig.gateway,
  });
});

export default router;
