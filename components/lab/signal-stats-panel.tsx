"use client"

import { motion } from "framer-motion"
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Gauge,
  Repeat,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react"

import type { SignalStats } from "@/lib/services/signal/signal-analysis"

type Props = {
  stats: SignalStats
  label: string
}

const statItems = (stats: SignalStats) => [
  {
    icon: ArrowUp,
    label: "Peak +",
    value: stats.peakPositive.toFixed(3),
    color: "text-emerald-500",
  },
  {
    icon: ArrowDown,
    label: "Peak −",
    value: stats.peakNegative.toFixed(3),
    color: "text-rose-500",
  },
  {
    icon: Activity,
    label: "Peak-Peak",
    value: stats.peakToPeak.toFixed(3),
    color: "text-amber-500",
  },
  {
    icon: Waves,
    label: "RMS",
    value: stats.rms.toFixed(3),
    color: "text-blue-500",
  },
  {
    icon: Zap,
    label: "Energy",
    value: stats.energy > 1000 ? stats.energy.toExponential(2) : stats.energy.toFixed(3),
    color: "text-violet-500",
  },
  {
    icon: Gauge,
    label: "Avg Power",
    value: stats.averagePower > 1000 ? stats.averagePower.toExponential(2) : stats.averagePower.toFixed(3),
    color: "text-cyan-500",
  },
  {
    icon: TrendingUp,
    label: "DC Offset",
    value: stats.dcOffset.toFixed(4),
    color: "text-orange-500",
  },
  {
    icon: Repeat,
    label: "Period",
    value: stats.estimatedPeriod !== null ? stats.estimatedPeriod.toFixed(3) + "s" : "N/A",
    color: stats.isLikelyPeriodic ? "text-emerald-500" : "text-muted-foreground",
  },
]

export function SignalStatsPanel({ stats, label }: Props) {
  const items = statItems(stats)

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02, duration: 0.15 }}
            className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1.5"
          >
            <item.icon className={`size-3 shrink-0 ${item.color}`} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] text-muted-foreground">{item.label}</p>
              <p className="truncate font-mono text-[11px] font-medium">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
      {stats.zeroCrossings > 0 && (
        <p className="text-[10px] text-muted-foreground">
          {stats.zeroCrossings} zero crossing{stats.zeroCrossings !== 1 ? "s" : ""} detected
        </p>
      )}
    </div>
  )
}
