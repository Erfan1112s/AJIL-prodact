import {
  requestPayment as requestZarinPalPayment,
  verifyPayment as verifyZarinPalPayment,
} from './zarinpal';
import type {
  PaymentGateway,
  PaymentRequestParams,
  PaymentRequestResult,
  PaymentVerifyParams,
  PaymentVerifyResult,
} from './types';

export class ZarinPalGateway implements PaymentGateway {
  readonly name = 'zarinpal';
  readonly type = 'online' as const;

  async requestPayment(
    params: PaymentRequestParams
  ): Promise<PaymentRequestResult> {
    const result = await requestZarinPalPayment({
      amount: params.amount,
      description: params.description,
      callbackUrl: params.callbackUrl,
      email: params.email,
      mobile: params.mobile,
      orderId: params.orderNumber,
    });

    if (!result.ok) {
      return {
        success: false,
        gateway: this.name,
        errorMessage: result.error,
      };
    }

    return {
      success: true,
      gateway: this.name,
      isMock: result.isMock,
      authority: result.authority,
      redirectUrl: result.paymentUrl,
    };
  }

  async verifyPayment(
    params: PaymentVerifyParams
  ): Promise<PaymentVerifyResult> {
    const result = await verifyZarinPalPayment(params);
    if (!result.ok) {
      return { success: false, errorMessage: result.error };
    }

    return {
      success: true,
      refId: result.refId,
    };
  }
}
