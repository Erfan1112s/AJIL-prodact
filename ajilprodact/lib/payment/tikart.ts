import type {
  PaymentGateway, PaymentRequestResult, PaymentVerifyResult,
} from './types';

export class TiKartGateway implements PaymentGateway {
  readonly name = 'tikart';
  readonly type = 'online' as const;

  async requestPayment(): Promise<PaymentRequestResult> {
    return {
      success: false,
      gateway: this.name,
      errorMessage: 'درگاه تیکارت تا تایید مستندات رسمی فعال نیست.',
    };
  }

  async verifyPayment(): Promise<PaymentVerifyResult> {
    return {
      success: false,
      errorMessage: 'تایید پرداخت تیکارت تا تایید مستندات رسمی فعال نیست.',
    };
  }
}