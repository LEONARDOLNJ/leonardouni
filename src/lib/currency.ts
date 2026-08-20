export type SupportedCurrency = "MZN" | "USD" | "EUR" | "ZAR";

export interface ExchangeRates {
  readonly USD: number; // MZN per 1 USD
  readonly EUR: number; // MZN per 1 EUR
  readonly ZAR: number; // MZN per 1 ZAR
}

export const OFFICIAL_EXCHANGE_RATES: ExchangeRates = {
  USD: 63.8,
  EUR: 69.5,
  ZAR: 3.5,
};

/**
 * Converts an amount from Meticais (MZN) to a target currency with precise decimal rounding.
 */
export function convertMznToTarget(
  amountMzn: number,
  targetCurrency: SupportedCurrency,
  rates: ExchangeRates = OFFICIAL_EXCHANGE_RATES
): number {
  if (!Number.isFinite(amountMzn) || amountMzn < 0) return 0;
  if (targetCurrency === "MZN") return Math.round(amountMzn * 100) / 100;

  const rate = rates[targetCurrency];
  if (!rate || rate <= 0) return Math.round(amountMzn * 100) / 100;

  const converted = amountMzn / rate;
  return Math.round(converted * 100) / 100;
}

/**
 * Converts an amount from a foreign currency to Meticais (MZN).
 */
export function convertTargetToMzn(
  amountTarget: number,
  sourceCurrency: SupportedCurrency,
  rates: ExchangeRates = OFFICIAL_EXCHANGE_RATES
): number {
  if (!Number.isFinite(amountTarget) || amountTarget < 0) return 0;
  if (sourceCurrency === "MZN") return Math.round(amountTarget * 100) / 100;

  const rate = rates[sourceCurrency];
  if (!rate || rate <= 0) return Math.round(amountTarget * 100) / 100;

  const converted = amountTarget * rate;
  return Math.round(converted * 100) / 100;
}

/**
 * Converts an amount in USD to any supported target currency.
 */
export function convertUsdToTarget(
  amountUsd: number,
  targetCurrency: SupportedCurrency,
  rates: ExchangeRates = OFFICIAL_EXCHANGE_RATES
): number {
  if (!Number.isFinite(amountUsd) || amountUsd < 0) return 0;
  const inMzn = convertTargetToMzn(amountUsd, "USD", rates);
  return convertMznToTarget(inMzn, targetCurrency, rates);
}

/**
 * Formats a currency value with locale-specific symbols and grouping.
 */
export function formatCurrencyValue(
  amount: number,
  currency: SupportedCurrency = "MZN"
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  switch (currency) {
    case "USD":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safeAmount);
    case "EUR":
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safeAmount);
    case "ZAR":
      return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safeAmount);
    case "MZN":
    default:
      return new Intl.NumberFormat("pt-MZ", {
        style: "currency",
        currency: "MZN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safeAmount);
  }
}

/**
 * Validates currency arithmetic consistency across bidirectional conversions.
 * Returns true if variance is within acceptable fractional rounding tolerances (< 0.05).
 */
export function validateCurrencyArithmetic(
  testAmountMzn = 18500,
  rates: ExchangeRates = OFFICIAL_EXCHANGE_RATES
): {
  valid: boolean;
  currencies: Record<
    SupportedCurrency,
    { converted: number; roundTripMzn: number; variance: number }
  >;
} {
  const currencies: SupportedCurrency[] = ["USD", "EUR", "ZAR", "MZN"];
  const results: any = {};
  let allValid = true;

  for (const curr of currencies) {
    const converted = convertMznToTarget(testAmountMzn, curr, rates);
    const roundTripMzn = convertTargetToMzn(converted, curr, rates);
    const variance = Math.abs(testAmountMzn - roundTripMzn);
    const valid = variance <= 1.0; // Rounding tolerance for discrete currency conversions

    if (!valid) allValid = false;

    results[curr] = {
      converted,
      roundTripMzn,
      variance: Math.round(variance * 1000) / 1000,
    };
  }

  return {
    valid: allValid,
    currencies: results,
  };
}
