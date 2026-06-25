import { SignalParams, SignalType } from "@/types/signal"

type ExplanationEntry = {
  text: string
  category: "shift" | "scale" | "amplitude" | "general" | "warning"
}

export function getExplanation(p: SignalParams, signalType?: SignalType): ExplanationEntry[] {
  const entries: ExplanationEntry[] = []

  // Shift explanations
  if (p.shift > 0) {
    entries.push({
      text: `Positive shift (t₀ = ${p.shift.toFixed(1)}) delays the signal — it moves to the right on the time axis.`,
      category: "shift",
    })
  }
  if (p.shift < 0) {
    entries.push({
      text: `Negative shift (t₀ = ${p.shift.toFixed(1)}) advances the signal — it moves to the left on the time axis.`,
      category: "shift",
    })
  }
  if (Math.abs(p.shift) > 4) {
    entries.push({
      text: "Large shift value — the signal may move partially outside the visible time window.",
      category: "warning",
    })
  }

  // Time scale explanations
  if (p.timeScale > 1) {
    entries.push({
      text: `Time scale a = ${p.timeScale.toFixed(2)} compresses the signal in time — events happen faster.`,
      category: "scale",
    })
  }
  if (p.timeScale > 0 && p.timeScale < 1) {
    entries.push({
      text: `Time scale a = ${p.timeScale.toFixed(2)} expands the signal in time — events are stretched out.`,
      category: "scale",
    })
  }
  if (p.timeScale === 0) {
    entries.push({
      text: "Time scale a = 0 collapses all time variation — the output becomes a constant.",
      category: "warning",
    })
  }
  if (p.timeScale > 3) {
    entries.push({
      text: "Very high compression — rapid oscillations may appear aliased at current sampling resolution.",
      category: "warning",
    })
  }

  // Time reversal
  if (p.timeReversal) {
    entries.push({
      text: "Time reversal is active — the signal is mirrored about t = 0, like playing a recording backwards.",
      category: "scale",
    })
    if (p.shift !== 0) {
      entries.push({
        text: "Combined reversal + shift: the signal is first reversed, then shifted. Watch the equation carefully.",
        category: "general",
      })
    }
  }

  // Output scale explanations
  if (p.outputScale > 1) {
    entries.push({
      text: `Output amplitude Aₒᵤₜ = ${p.outputScale.toFixed(2)} amplifies the transformed signal beyond original magnitude.`,
      category: "amplitude",
    })
  }
  if (p.outputScale > 0 && p.outputScale < 1) {
    entries.push({
      text: `Output amplitude Aₒᵤₜ = ${p.outputScale.toFixed(2)} attenuates the transformed signal — energy is reduced.`,
      category: "amplitude",
    })
  }
  if (p.outputScale === 0) {
    entries.push({
      text: "Output scale is zero — the transformed signal is completely suppressed.",
      category: "warning",
    })
  }

  // Base amplitude
  if (p.baseAmplitude === 0) {
    entries.push({
      text: "Base amplitude is zero — both signals are flat. Increase it to see the waveform.",
      category: "warning",
    })
  }
  if (p.baseAmplitude > 3) {
    entries.push({
      text: "High base amplitude — the signal peaks may be clipped visually. Check the Y-axis range.",
      category: "general",
    })
  }

  // Signal-type specific hints
  if (signalType === "step" || signalType === "ramp") {
    if (p.timeReversal) {
      entries.push({
        text: `Time-reversed ${signalType} function: the discontinuity now appears from the right side.`,
        category: "general",
      })
    }
  }
  if (signalType === "exp") {
    if (p.timeScale > 1) {
      entries.push({
        text: "Compressed exponential grows or decays faster — the rate is multiplied by the time scale.",
        category: "general",
      })
    }
  }
  if (signalType === "square") {
    entries.push({
      text: "Square wave is defined by the sign of the underlying sine — boundary values follow sin(ωt + φ) ≥ 0.",
      category: "general",
    })
  }

  // Omega / frequency
  if (p.omega > 8) {
    entries.push({
      text: "High angular frequency — ensure sampling step is small enough to capture all oscillations.",
      category: "warning",
    })
  }

  // Neutral state
  if (entries.length === 0) {
    entries.push({
      text: "Settings are near default — the original and transformed signals are very similar.",
      category: "general",
    })
  }

  return entries
}