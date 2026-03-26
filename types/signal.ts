export type SignalType = "sine" | "cosine" | "step" | "ramp" | "exp" | "square"

export type SignalParams = {
  baseAmplitude: number
  omega: number
  phase: number
  shift: number
  timeScale: number
  outputScale: number
  timeReversal: boolean
  minTime: number
  maxTime: number
  step: number
}

export type SignalPoint = {
  t: number
  original: number
  transformed: number
}