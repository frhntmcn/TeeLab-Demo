export interface PricingConfig {
  baseUnit: number;
  frontPrintUnit: number;
  backPrintUnit: number;
  quantityDiscounts: readonly { minimumQuantity: number; rate: number }[];
}

export const pricingConfig: PricingConfig = {
  baseUnit: 320,
  frontPrintUnit: 145,
  backPrintUnit: 125,
  quantityDiscounts: [
    { minimumQuantity: 10, rate: 0.12 },
    { minimumQuantity: 5, rate: 0.07 },
  ],
};
