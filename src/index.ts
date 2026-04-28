import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import checkoutRoute from './routes/checkout.route';
import subscriptionRoute from './routes/subscription.route';
import webhookRoute from './routes/webhook.route';

const app = express();
const PORT = process.env.PORT ?? 3001;

// webhook route uses express.raw() internally, must be registered BEFORE express.json()
app.use('/webhook', webhookRoute);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/sucesso', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/sucesso.html'));
});

app.get('/cancelado', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/cancelado.html'));
});

app.use('/checkout', checkoutRoute);
app.use('/subscription', subscriptionRoute);

app.listen(PORT, () => {
  console.log(`BE-ZITO-PAYMENTS running on port ${PORT}`);
});
