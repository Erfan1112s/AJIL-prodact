export type PaymentGatewayType = 'online' | 'manual';

export interface PaymentRequestParams {
  amount: number;        // همیشه به تومان، نه ریال
  orderId: string;
  orderNumber: string;
  description: string;
  callbackUrl: string;
  mobile?: string;
  email?: string;
}

export interface PaymentRequestResult {
  success: boolean;
  gateway: string;
  isMock?: boolean;
  authority?: string;      // توکن درگاه
  redirectUrl?: string;    // برای درگاه‌های آنلاین
  instructions?: {         // برای کارت‌به‌کارت
    cardNumber: string;
    cardHolder: string;
    bankName: string;
    amount: number;
  };
  errorMessage?: string;
}

export interface PaymentVerifyParams {
  authority: string;
  amount: number;
}

export interface PaymentVerifyResult {
  success: boolean;
  refId?: string;
  cardPan?: string;
  alreadyVerified?: boolean;
  errorMessage?: string;
}

export interface PaymentGateway {
  readonly name: string;
  readonly type: PaymentGatewayType;
  requestPayment(params: PaymentRequestParams): Promise<PaymentRequestResult>;
  verifyPayment(params: PaymentVerifyParams): Promise<PaymentVerifyResult>;
}