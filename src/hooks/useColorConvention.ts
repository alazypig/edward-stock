import { useContext } from "react"
import { ColorConventionContext } from "../contexts/ColorConventionContext"

export const useColorConvention = () => {
  const context = useContext(ColorConventionContext)
  if (context === undefined) {
    throw new Error(
      "useColorConvention must be used within a ColorConventionProvider",
    )
  }
  return context
}