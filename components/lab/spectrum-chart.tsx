"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { FrequencyBin } from "@/lib/services/signal/signal-analysis"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  bins: FrequencyBin[]
  title?: string
  barColor?: string
}

export function SpectrumChart({
  bins,
  title = "Frequency Spectrum",
  barColor = "oklch(0.65 0.22 260)",
}: Props) {
  if (bins.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-40 items-center justify-center text-xs text-muted-foreground">
          Not enough data for spectrum analysis
        </CardContent>
      </Card>
    )
  }

  // Filter bins with significant magnitude (cut noise floor)
  const maxMag = Math.max(...bins.map((b) => b.magnitude))
  const threshold = maxMag * 0.005
  const filtered = bins.filter((b) => b.magnitude > threshold && b.frequency > 0)

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <p className="text-[10px] text-muted-foreground">Magnitude spectrum |X(f)|</p>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        <div className="h-44 w-full sm:h-48">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={filtered} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" strokeOpacity={0.4} />
              <XAxis
                dataKey="frequency"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={{ stroke: "var(--border)" }}
                label={{
                  value: "f (Hz)",
                  position: "insideBottomRight",
                  offset: -2,
                  fill: "var(--muted-foreground)",
                  fontSize: 10,
                }}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                tickLine={{ stroke: "var(--border)" }}
                width={32}
              />
              <RechartsTooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "11px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelFormatter={(v) => `f = ${Number(v).toFixed(3)} Hz`}
                formatter={(v: any) => [Number(v).toFixed(4), "|X(f)|"]}
              />
              <Bar
                dataKey="magnitude"
                fill={barColor}
                radius={[2, 2, 0, 0]}
                animationDuration={400}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
