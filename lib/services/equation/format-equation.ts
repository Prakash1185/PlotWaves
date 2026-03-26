import { SignalParams, SignalType } from "@/types/signal"

function formatNum(n: number): string {
  // strip trailing zeros
  return Number(n.toFixed(3)).toString()
}

export function formatEquation(type: SignalType, p: SignalParams): string {
  // Combine factors to make it academic and clean
  
  // Total amplitude multiplier
  const A = p.outputScale * p.baseAmplitude
  const A_str = A === 1 ? "" : A === -1 ? "-" : formatNum(A)

  // Total time scale multiplier taking into account omega (w) and timeScale (a) and reversal
  let effectiveW = p.timeScale
  if (type === "sine" || type === "cosine" || type === "square") {
    effectiveW = p.timeScale * p.omega
  }
  
  const sign = p.timeReversal ? -1 : 1
  effectiveW *= sign

  // Shift t0
  const t0 = p.shift

  // Format the inner argument "(wt - wt0)"
  let innerArg = ""
  if (effectiveW === 0) {
    innerArg = "0"
  } else {
    const w_str = Math.abs(effectiveW) === 1 ? (effectiveW < 0 ? "-" : "") : formatNum(effectiveW)
    innerArg = `${w_str}t`
    
    // add shift term: effectiveW * -t0
    const shiftTerm = effectiveW * -t0
    if (shiftTerm > 0) {
      innerArg += ` + ${formatNum(shiftTerm)}`
    } else if (shiftTerm < 0) {
      innerArg += ` - ${formatNum(Math.abs(shiftTerm))}`
    }
  }

  // Phase
  const phi = p.phase
  if ((type === "sine" || type === "cosine" || type === "square") && phi !== 0) {
    if (phi > 0) {
      innerArg += ` + ${formatNum(phi)}`
    } else {
      innerArg += ` - ${formatNum(Math.abs(phi))}`
    }
  }

  // Handle specific functions
  switch (type) {
    case "sine":
      return `y(t) = ${A_str === "" ? "1" : A_str} sin(${innerArg})`
    case "cosine":
      return `y(t) = ${A_str === "" ? "1" : A_str} cos(${innerArg})`
    case "square":
      return `y(t) = ${A_str === "" ? "1" : A_str} square(${innerArg})`
    case "step":
      return `y(t) = ${A_str === "" ? "1" : A_str} u(${innerArg})`
    case "ramp":
      // r(t) = t * u(t)
      return `y(t) = ${A_str === "" ? "" : A_str}(${innerArg}) u(${innerArg})`
    case "exp":
      return `y(t) = ${A_str === "" ? "1" : A_str} e^(${innerArg})`
    default:
      return "y(t) = 0"
  }
}