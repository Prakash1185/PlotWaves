export type SignalType = "sine" | "cosine" | "step" | "ramp" | "exp" | "square"

export type SignalParams = {
  baseAmplitude: number
  omega: number
  frequency: number
  phase: number
  shift: number
  timeScale: number
  outputScale: number
  timeReversal: boolean
  minTime: number
  maxTime: number
  step: number
}

export function angularFrequency(frequency: number): number {
  return 2 * Math.PI * frequency
}

export function frequencyFromAngular(omega: number): number {
  return omega / (2 * Math.PI)
}

export type SignalPoint = {
  t: number
  original: number
  transformed: number
}