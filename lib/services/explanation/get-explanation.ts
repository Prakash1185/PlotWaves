import { SignalParams } from "@/types/signal"

export function getExplanation(p: SignalParams): string[] {
  const lines: string[] = []

  if (p.shift > 0) lines.push("Positive shift moves the signal to the right.")
  if (p.shift < 0) lines.push("Negative shift moves the signal to the left.")
  if (p.timeScale > 1) lines.push("Time scale greater than 1 compresses the signal.")
  if (p.timeScale > 0 && p.timeScale < 1) lines.push("Time scale between 0 and 1 expands the signal.")
  if (p.timeReversal) lines.push("Time reversal mirrors the signal around t = 0.")
  if (p.outputScale > 1) lines.push("Output scale amplifies the transformed signal.")
  if (p.outputScale > 0 && p.outputScale < 1) lines.push("Output scale attenuates the transformed signal.")

  if (lines.length === 0) lines.push("Current settings are close to the base signal behavior.")

  return lines
}