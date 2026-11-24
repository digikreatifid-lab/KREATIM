import { midtransProvider } from "./midtrans";
import { mockProvider } from "./mock";
import { tripayProvider } from "./tripay";
import type { PaymentProvider } from "./types";

export * from "./types";

export function paymentProvider(): PaymentProvider {
  const id = process.env.PAYMENT_PROVIDER ?? (process.env.NODE_ENV === "production" ? "midtrans" : "mock");
  if (id === "tripay") return tripayProvider;
  if (id === "mock") return mockProvider;
  return midtransProvider;
}
