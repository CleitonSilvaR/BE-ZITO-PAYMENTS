import 'dotenv/config';
import express from 'express';
import checkoutRoute from './routes/checkout.route';
import subscriptionRoute from './routes/subscription.route';
import webhookRoute from './routes/webhook.route';

const app = express();
const PORT = process.env.PORT ?? 3001;

// webhook route uses express.raw() internally, must be registered BEFORE express.json()
app.use('/webhook', webhookRoute);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/checkout', checkoutRoute);
app.use('/subscription', subscriptionRoute);

app.listen(PORT, () => {
  console.log(`BE-ZITO-PAYMENTS running on port ${PORT}`);
});
