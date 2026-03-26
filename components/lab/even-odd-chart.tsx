"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  data: Array<{ t: number; even: number; odd: number }>
}

export function EvenOddChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Even / Odd Decomposition</CardTitle>
        </CardHeader>
        <CardContent className="flex h-40 items-center justify-center text-xs text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Even / Odd Decomposition</CardTitle>
        <p className="text-[10px] text-muted-foreground">
          x_e(t) = ½[x(t) + x(−t)] · x_o(t) = ½[x(t) − x(−t)]
        </p>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        <div className="h-48 w-full sm:h-56">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" strokeOpacity={0.4} />
              <XAxis
                dataKey="t"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
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
                labelFormatter={(v) => `t = ${Number(v).toFixed(3)}`}
              />
              <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.3} strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="even"
                name="Even x_e(t)"
                stroke="oklch(0.65 0.22 260)"
                dot={false}
                strokeWidth={2}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="odd"
                name="Odd x_o(t)"
                stroke="oklch(0.70 0.18 330)"
                dot={false}
                strokeWidth={2}
                strokeDasharray="6 3"
                animationDuration={300}
              />
              <Legend
                verticalAlign="top"
                height={24}
                iconType="line"
                wrapperStyle={{ fontSize: "10px", color: "var(--muted-foreground)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
