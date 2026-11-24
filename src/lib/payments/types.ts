export type PaymentProviderId = "midtrans" | "tripay" | "mock";

export type CheckoutRequest = {
  orderId: string;
  amountIdr: number;
  itemId: string;
  itemName: string;
  customer: { name: string; email: string };
  returnUrl: string;
};

export type CheckoutResult = { redirectUrl: string; token?: string };

/** Normalised webhook outcome. `null` status means "ignore" (e.g. pending). */
export type WebhookEvent = {
  orderId: string;
  status: "PAID" | "FAILED" | "PENDING";
  /** Amount the provider says was charged, when it is part of the signed payload. */
  grossAmountIdr?: number;
  raw: unknown;
};

export class PaymentSignatureError extends Error {
  constructor() {
    super("Signature webhook tidak valid.");
    this.name = "PaymentSignatureError";
  }
}

export class PaymentProviderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PaymentProviderError";
  }
}

export interface PaymentProvider {
  id: PaymentProviderId;
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
  /** Verifies the signature and returns the normalised event, or throws PaymentSignatureError. */
  parseWebhook(rawBody: string, headers: Headers): WebhookEvent;
}
