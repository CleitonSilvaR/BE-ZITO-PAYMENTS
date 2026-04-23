import 'dotenv/config';
import { encrypt } from '../src/crypto/config.crypto';

const stripeConfig = {
  secret_key: 'sk_test_COLOQUE_AQUI',
  webhook_secret: 'whsec_COLOQUE_AQUI',
  price_id: 'price_COLOQUE_AQUI',
  success_url: 'https://SEU_DOMINIO/sucesso',
  cancel_url:  'https://SEU_DOMINIO/cancelado',
};

const encrypted = encrypt(JSON.stringify(stripeConfig));
console.log('\n=== Cole esse valor no campo config da tabela payment_configs ===\n');
console.log(encrypted);
console.log('\n');
