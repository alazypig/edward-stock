import type { ColorConvention } from "../contexts/ColorConventionContext"

export type ChangeSemantic = "success" | "error" | "default"

const CN_UP = "#cf1322"
const CN_DOWN = "#389e0d"
const INTL_UP = "#389e0d"
const INTL_DOWN = "#cf1322"
const NEUTRAL = "#666"

/**
 * Returns the AntD Tag semantic color (success/error/default) for a change value
 * under the given color convention.
 *
 * In CN (A股) convention, positive changes are red ("success" mapped to error)
 * and negative changes are green ("error" mapped to success). Internationally,
 * the mapping is the opposite.
 */
export const getChangeSemantic = (
  value: number,
  convention: ColorConvention,
): ChangeSemantic => {
  if (value > 0) return convention === "cn" ? "error" : "success"
  if (value < 0) return convention === "cn" ? "success" : "error"
  return "default"
}

/**
 * Returns a hex color string suitable for inline text styles.
 */
export const getChangeHex = (
  value: number,
  convention: ColorConvention,
): string => {
  if (value > 0) return convention === "cn" ? CN_UP : INTL_UP
  if (value < 0) return convention === "cn" ? CN_DOWN : INTL_DOWN
  return NEUTRAL
}