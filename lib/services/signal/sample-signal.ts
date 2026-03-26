import { generateSignal } from "@/lib/services/signal/generate-signal"
import { transformTime } from "@/lib/services/signal/transform-time"
import { SignalParams, SignalPoint, SignalType } from "@/types/signal"

const MIN_STEP = 0.001
const MAX_POINTS = 12000

function sanitizeParams(params: SignalParams): SignalParams {
  const safeStep = Number.isFinite(params.step) ? Math.max(MIN_STEP, Math.abs(params.step)) : 0.05

  let safeMin = Number.isFinite(params.minTime) ? params.minTime : -10
  let safeMax = Number.isFinite(params.maxTime) ? params.maxTime : 10

  if (safeMax < safeMin) {
    const temp = safeMin
    safeMin = safeMax
    safeMax = temp
  }

  return {
    ...params,
    minTime: safeMin,
    maxTime: safeMax,
    step: safeStep,
  }
}

export function sampleSignal(type: SignalType, params: SignalParams): SignalPoint[] {
  const safe = sanitizeParams(params)
  const points: SignalPoint[] = []

  let t = safe.minTime
  let count = 0

  while (t <= safe.maxTime + safe.step * 0.5 && count < MAX_POINTS) {
    const original = generateSignal(type, t, safe)
    const transformedInput = transformTime(t, safe)
    const transformed = safe.outputScale * generateSignal(type, transformedInput, safe)

    points.push({
      t: Number(t.toFixed(4)),
      original: Number(original.toFixed(6)),
      transformed: Number(transformed.toFixed(6)),
    })

    t += safe.step
    count += 1
  }

  return points
}