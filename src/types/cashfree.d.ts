declare module '@cashfreepayments/cashfree-js' {
  interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    returnUrl?: string;
    redirectTarget?: '_modal' | '_self' | '_blank';
  }

  interface CashfreeInstance {
    checkout: (options: CashfreeCheckoutOptions) => Promise<any>;
  }

  interface LoadOptions {
    mode: 'sandbox' | 'production';
  }

  export function load(options: LoadOptions): Promise<CashfreeInstance>;
}
