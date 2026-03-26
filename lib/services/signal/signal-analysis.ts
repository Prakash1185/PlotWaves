import { SignalPoint } from "@/types/signal"

export type SignalStats = {
  peakPositive: number
  peakNegative: number
  peakToPeak: number
  rms: number
  energy: number
  averagePower: number
  zeroCrossings: number
  dcOffset: number
  estimatedPeriod: number | null
  isLikelyPeriodic: boolean
}

export type EvenOddDecomposition = {
  even: number[]
  odd: number[]
}

export type FrequencyBin = {
  frequency: number
  magnitude: number
}

/**
 * Compute key signal properties from sampled data points.
 */
export function computeSignalStats(
  data: SignalPoint[],
  seriesKey: "original" | "transformed"
): SignalStats {
  if (data.length === 0) {
    return {
      peakPositive: 0,
      peakNegative: 0,
      peakToPeak: 0,
      rms: 0,
      energy: 0,
      averagePower: 0,
      zeroCrossings: 0,
      dcOffset: 0,
      estimatedPeriod: null,
      isLikelyPeriodic: false,
    }
  }

  const values = data.map((p) => p[seriesKey])
  const n = values.length
  const dt = n > 1 ? Math.abs(data[1].t - data[0].t) : 0.05
  const duration = n > 1 ? Math.abs(data[n - 1].t - data[0].t) : 0

  let peakPositive = -Infinity
  let peakNegative = Infinity
  let sumSquared = 0
  let sum = 0
  let zeroCrossings = 0

  for (let i = 0; i < n; i++) {
    const v = values[i]
    if (v > peakPositive) peakPositive = v
    if (v < peakNegative) peakNegative = v
    sumSquared += v * v
    sum += v

    if (i > 0 && values[i - 1] * v < 0) {
      zeroCrossings++
    }
  }

  const dcOffset = sum / n
  const rms = Math.sqrt(sumSquared / n)
  const energy = sumSquared * dt
  const averagePower = duration > 0 ? energy / duration : 0

  // Simple autocorrelation-based period estimation
  const estimatedPeriod = estimatePeriod(values, dt)
  const isLikelyPeriodic = estimatedPeriod !== null && estimatedPeriod > dt * 4

  return {
    peakPositive: round4(peakPositive === -Infinity ? 0 : peakPositive),
    peakNegative: round4(peakNegative === Infinity ? 0 : peakNegative),
    peakToPeak: round4(peakPositive - peakNegative),
    rms: round4(rms),
    energy: round4(energy),
    averagePower: round4(averagePower),
    zeroCrossings,
    dcOffset: round4(dcOffset),
    estimatedPeriod: estimatedPeriod !== null ? round4(estimatedPeriod) : null,
    isLikelyPeriodic,
  }
}

/**
 * Decompose signal into even and odd components.
 * x_even(t) = [x(t) + x(-t)] / 2
 * x_odd(t)  = [x(t) - x(-t)] / 2
 */
export function computeEvenOddDecomposition(
  data: SignalPoint[],
  seriesKey: "original" | "transformed"
): EvenOddDecomposition {
  const values = data.map((p) => p[seriesKey])
  const times = data.map((p) => p.t)
  const n = values.length

  const even: number[] = new Array(n)
  const odd: number[] = new Array(n)

  for (let i = 0; i < n; i++) {
    const t = times[i]
    const xt = values[i]

    // Find x(-t) via interpolation
    const xNegT = interpolate(times, values, -t)

    even[i] = round6((xt + xNegT) / 2)
    odd[i] = round6((xt - xNegT) / 2)
  }

  return { even, odd }
}

/**
 * Compute a simple DFT magnitude spectrum.
 * Returns the first N/2 frequency bins.
 */
export function computeFrequencySpectrum(
  data: SignalPoint[],
  seriesKey: "original" | "transformed",
  maxBins = 64
): FrequencyBin[] {
  const values = data.map((p) => p[seriesKey])
  const n = values.length
  if (n < 4) return []

  const dt = Math.abs(data[1].t - data[0].t) || 0.05
  const fs = 1 / dt
  const halfN = Math.min(Math.floor(n / 2), maxBins)

  const bins: FrequencyBin[] = []

  // Remove DC before DFT
  const mean = values.reduce((a, b) => a + b, 0) / n

  for (let k = 0; k < halfN; k++) {
    let real = 0
    let imag = 0

    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * k * i) / n
      real += (values[i] - mean) * Math.cos(angle)
      imag -= (values[i] - mean) * Math.sin(angle)
    }

    const magnitude = Math.sqrt(real * real + imag * imag) / n
    const frequency = (k * fs) / n

    bins.push({
      frequency: round4(frequency),
      magnitude: round4(magnitude),
    })
  }

  return bins
}

// ─── Helpers ──────────────────────────────────────────────────────

function round4(n: number): number {
  return Number(n.toFixed(4))
}

function round6(n: number): number {
  return Number(n.toFixed(6))
}

/**
 * Linear interpolation to find value at arbitrary time point.
 */
function interpolate(times: number[], values: number[], t: number): number {
  const n = times.length
  if (n === 0) return 0

  // Clamp to boundaries
  if (t <= times[0]) return values[0]
  if (t >= times[n - 1]) return values[n - 1]

  // Binary search for interval
  let lo = 0
  let hi = n - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (times[mid] <= t) lo = mid
    else hi = mid
  }

  const t0 = times[lo]
  const t1 = times[hi]
  if (t1 === t0) return values[lo]

  const frac = (t - t0) / (t1 - t0)
  return values[lo] + frac * (values[hi] - values[lo])
}

/**
 * Estimate the fundamental period using zero-crossing analysis.
 */
function estimatePeriod(values: number[], dt: number): number | null {
  const n = values.length
  if (n < 10) return null

  // Find positive-going zero crossings
  const crossings: number[] = []
  for (let i = 1; i < n; i++) {
    if (values[i - 1] <= 0 && values[i] > 0) {
      // Interpolate exact crossing point
      const frac = -values[i - 1] / (values[i] - values[i - 1])
      crossings.push((i - 1 + frac) * dt)
    }
  }

  if (crossings.length < 2) return null

  // Average the gaps between successive zero crossings
  let totalGap = 0
  let gaps = 0
  for (let i = 1; i < crossings.length; i++) {
    totalGap += crossings[i] - crossings[i - 1]
    gaps++
  }

  if (gaps === 0) return null
  return totalGap / gaps
}
