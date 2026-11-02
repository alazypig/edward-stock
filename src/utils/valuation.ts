import type { Valuation } from "../type"

export const VALUATION_LEVELS = [
  { key: "conservative", label: "保守" },
  { key: "neutral", label: "中性" },
  { key: "optimistic", label: "乐观" },
] as const

export type ValuationLevel = (typeof VALUATION_LEVELS)[number]["key"]

export type ValuationBand =
  | "belowConservative"
  | "conservative"
  | "betweenConservativeAndNeutral"
  | "neutral"
  | "betweenNeutralAndOptimistic"
  | "optimistic"
  | "aboveOptimistic"

export const VALUATION_BAND_LABELS: Record<ValuationBand, string> = {
  belowConservative: "低于保守区间",
  conservative: "处于保守区间",
  betweenConservativeAndNeutral: "介于保守与中性之间",
  neutral: "处于中性区间",
  betweenNeutralAndOptimistic: "介于中性与乐观之间",
  optimistic: "处于乐观区间",
  aboveOptimistic: "高于乐观区间",
}

/** 低于中性下限用红色，高于中性上限用黄色 */
export const VALUATION_RED = "#cf1322"
export const VALUATION_YELLOW = "#d48806"

/**
 * 判断当前股价落在哪个估值区间。
 */
export const getValuationBand = (
  price: number,
  valuation: Valuation,
): ValuationBand => {
  const { conservative, neutral, optimistic } = valuation
  if (price < conservative.min) return "belowConservative"
  if (price <= conservative.max) return "conservative"
  if (price < neutral.min) return "betweenConservativeAndNeutral"
  if (price <= neutral.max) return "neutral"
  if (price < optimistic.min) return "betweenNeutralAndOptimistic"
  if (price <= optimistic.max) return "optimistic"
  return "aboveOptimistic"
}

/**
 * 收盘价低于中性下限 → 红色；高于中性上限 → 黄色；落在中性区间内不着色。
 */
export const getValuationColor = (
  price: number,
  valuation: Valuation,
): string | undefined => {
  if (price < valuation.neutral.min) return VALUATION_RED
  if (price > valuation.neutral.max) return VALUATION_YELLOW
  return undefined
}
