
import { generateSignal } from "@/lib/services/signal/generate-signal"
import { transformTime } from "@/lib/services/signal/transform-time"
import { SignalParams, SignalPoint, SignalType } from "@/types/signal"

export function sampleSignal(type: SignalType, params: SignalParams): SignalPoint[] {
  const points: SignalPoint[] = []

  for (let t = params.minTime; t <= params.maxTime; t += params.step) {
    const original = generateSignal(type, t, params)
    const transformedInput = transformTime(t, params)
    const transformed = params.outputScale * generateSignal(type, transformedInput, params)

    points.push({
      t: Number(t.toFixed(4)),
      original: Number(original.toFixed(6)),
      transformed: Number(transformed.toFixed(6)),
    })
  }

  return points
}