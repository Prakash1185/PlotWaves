import { SignalParams, SignalType } from "@/types/signal"

function fmt(value: number): string {
  const n = Number(value.toFixed(3))
  if (Object.is(n, -0)) return "0"
  return String(n)
}

function signedTerm(value: number): string {
  if (value > 0) return " + " + fmt(value)
  if (value < 0) return " - " + fmt(Math.abs(value))
  return ""
}

function maybeMulLeft(coeff: number, expr: string): string {
  if (coeff === 1) return expr
  if (coeff === -1) return "-" + expr
  return fmt(coeff) + "*" + expr
}

function buildLinearTimeExpr(scale: number, shift: number): string {
  // scale * (t - shift)
  if (scale === 0) return "0"

  const inner = shift === 0 ? "t" : "(t - " + fmt(shift) + ")"
  return maybeMulLeft(scale, inner)
}

function assertNever(x: never): never {
  throw new Error("Unhandled signal type: " + String(x))
}

export function formatEquation(type: SignalType, p: SignalParams): string {
  const effectiveScale = p.timeReversal ? -p.timeScale : p.timeScale
  const tau = buildLinearTimeExpr(effectiveScale, p.shift)

  const combinedAmplitude = p.outputScale * p.baseAmplitude
  if (combinedAmplitude === 0) {
    return "y(t) = 0"
  }

  const ampFactor = combinedAmplitude === 1 ? "" : fmt(combinedAmplitude) + "*"

  const periodicCore = (() => {
    const omegaTerm = maybeMulLeft(p.omega, tau)
    const phase = signedTerm(p.phase)
    return omegaTerm + phase
  })()

  switch (type) {
    case "sine":
      return "y(t) = " + ampFactor + "sin(" + periodicCore + ")"

    case "cosine":
      return "y(t) = " + ampFactor + "cos(" + periodicCore + ")"

    case "square":
      return "y(t) = " + ampFactor + "square(" + periodicCore + ")"

    case "step":
      return "y(t) = " + ampFactor + "u(" + tau + ")"

    case "ramp":
      return "y(t) = " + ampFactor + tau + "*u(" + tau + ")"

    case "exp":
      return "y(t) = " + ampFactor + "exp(" + tau + ")"
  }

  return assertNever(type)
}