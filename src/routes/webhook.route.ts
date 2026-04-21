import { Router } from 'express';
import express from 'express';
import { handleWebhook } from '../webhook/webhook.controller';

const router = Router();

// MUST use express.raw() before express.json() for Stripe signature validation
router.post('/:gateway', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
