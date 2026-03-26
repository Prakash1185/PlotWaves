import { SignalParams, SignalType } from "@/types/signal"

function r(n: number): string {
  return Number(n.toFixed(2)).toString()
}

export function formatEquation(type: SignalType, p: SignalParams): string {
  const core = r(p.timeScale) + "(t - " + r(p.shift) + ")"
  const timeExpr = p.timeReversal ? "-(" + core + ")" : core

  if (type === "sine") return "y(t) = " + r(p.outputScale) + " sin(" + r(p.omega) + " " + timeExpr + " + " + r(p.phase) + ")"
  if (type === "cosine") return "y(t) = " + r(p.outputScale) + " cos(" + r(p.omega) + " " + timeExpr + " + " + r(p.phase) + ")"
  if (type === "step") return "y(t) = " + r(p.outputScale) + " u(" + timeExpr + ")"
  if (type === "ramp") return "y(t) = " + r(p.outputScale) + " (" + timeExpr + ")u(" + timeExpr + ")"
  if (type === "exp") return "y(t) = " + r(p.outputScale) + " e^(" + timeExpr + ")"
  return "y(t) = " + r(p.outputScale) + " square(" + r(p.omega) + " " + timeExpr + " + " + r(p.phase) + ")"
}