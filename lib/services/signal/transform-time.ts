import { SignalParams } from "@/types/signal"

export function transformTime(t: number, params: SignalParams): number {
  const shifted = t - params.shift
  const scaled = params.timeScale * shifted
  return params.timeReversal ? -scaled : scaled
}