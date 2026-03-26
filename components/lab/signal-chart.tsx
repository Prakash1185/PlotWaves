"use client"

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { SignalPoint } from "@/types/signal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = {
  data: SignalPoint[]
}

export function SignalChart({ data }: Props) {
  return (
    <Card className="h-[420px] border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Original vs Transformed</CardTitle>
      </CardHeader>
      <CardContent className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 6, right: 6, top: 10, bottom: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke="var(--muted-foreground)" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <YAxis stroke="var(--muted-foreground)" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "var(--foreground)" }}
            />
            <Legend />
            <Line type="monotone" dataKey="original" name="Original" stroke="var(--chart-2)" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="transformed" name="Transformed" stroke="var(--chart-4)" dot={false} strokeWidth={2.4} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}