import { Router, Request, Response } from 'express';
import { supabase } from '../database/supabase.client';

const router = Router();

router.get('/:code', async (req: Request, res: Response): Promise<void> => {
  const { code } = req.params;

  const { data } = await supabase
    .schema('payments')
    .from('checkout_links')
    .select('url, expires_at')
    .eq('code', code)
    .maybeSingle();

  if (!data) {
    res.status(404).send('Link não encontrado.');
    return;
  }

  if (new Date(data.expires_at) < new Date()) {
    res.status(410).send('Este link expirou.');
    return;
  }

  res.redirect(302, data.url);
});

export default router;
