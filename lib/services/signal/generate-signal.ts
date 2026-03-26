import { SignalParams, SignalType } from "@/types/signal"

export function generateSignal(type: SignalType, t: number, params: SignalParams): number {
  const A = params.baseAmplitude
  const w = params.omega
  const phi = params.phase

  switch (type) {
    case "sine":
      return A * Math.sin(w * t + phi)
    case "cosine":
      return A * Math.cos(w * t + phi)
    case "step":
      return t >= 0 ? A : 0
    case "ramp":
      return t >= 0 ? A * t : 0
    case "exp":
      return A * Math.exp(t)
    case "square":
      return Math.sin(w * t + phi) >= 0 ? A : -A
    default:
      return 0
  }
}