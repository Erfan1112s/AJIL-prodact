import type { PaymentGateway } from './types';
import { ZarinPalGateway } from './zarinpal-gateway';
import { TiKartGateway } from './tikart';

export function getPaymentGateway(
  configuredName = process.env.PAYMENT_GATEWAY || 'zarinpal'
): PaymentGateway {
  const key = configuredName.toLowerCase();

  switch (key) {
    case 'zarinpal': return new ZarinPalGateway();
    case 'tikart': return new TiKartGateway();
    default:
      throw new Error(`PAYMENT_GATEWAY نامعتبر است: ${key}`);
  }
}