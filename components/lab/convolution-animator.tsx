"use client"

import { useEffect, useState } from "react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Pause, Play } from "lucide-react"

import { SignalPoint } from "@/types/signal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Props = {
  baseData: SignalPoint[]
  gain: number
  decay: number
}

export function ConvolutionAnimator({ baseData, gain, decay }: Props) {
  const [animTime, setAnimTime] = useState<number>(baseData[0]?.t || -5)
  const [isPlaying, setIsPlaying] = useState(false)

  // Bounds
  const minTime = baseData[0]?.t || -5
  const maxTime = baseData[baseData.length - 1]?.t || 5

  useEffect(() => {
    let animId: number
    let lastTime = performance.now()

    if (isPlaying) {
      const step = (time: number) => {
        const dt = (time - lastTime) / 1000
        lastTime = time

        setAnimTime((prev) => {
          let next = prev + dt * 1.5 // Speed
          if (next > maxTime) next = minTime
          return next
        })

        animId = requestAnimationFrame(step)
      }
      animId = requestAnimationFrame(step)
    }

    return () => cancelAnimationFrame(animId)
  }, [isPlaying, minTime, maxTime])

  // Generate data points over τ
  // t is fixed to animTime
  const t = animTime

  const chartData = baseData.map((pt) => {
    const tau = pt.t // τ is the x-axis
    const x_tau = pt.original

    // h(t - τ)
    const delta = t - tau
    const h_t_minus_tau = delta >= 0 ? gain * Math.exp(-decay * delta) : 0

    // product
    const product = x_tau * h_t_minus_tau

    return {
      tau: Number(tau.toFixed(3)),
      x_tau: Number(x_tau.toFixed(4)),
      h_t_minus_tau: Number(h_t_minus_tau.toFixed(4)),
      product: Number(product.toFixed(4)),
    }
  })

  // Integral (approx area under product curve)
  const dt = baseData.length > 1 ? Math.abs(baseData[1].t - baseData[0].t) : 0.05
  const integralValue = chartData.reduce((sum, d) => sum + d.product * dt, 0)

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-semibold">Convolution Animation</CardTitle>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            y(t) = ∫ x(τ) h(t - τ) dτ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-md border border-border/50 bg-muted/40 px-3 py-1 text-center font-mono text-xs">
            t = {t.toFixed(2)}
            <br />
            y(t) = <span className="text-chart-2 font-bold">{integralValue.toFixed(3)}</span>
          </div>
          <Button
            size="sm"
            variant={isPlaying ? "default" : "outline"}
            className="h-8"
            onClick={() => setIsPlaying((p) => !p)}
          >
            {isPlaying ? <Pause className="mr-1 size-3.5" /> : <Play className="mr-1 size-3.5" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <ComposedChart data={chartData} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" strokeOpacity={0.4} />
              <XAxis
                dataKey="tau"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                label={{
                  value: "τ (Time)",
                  position: "insideBottomRight",
                  offset: -4,
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                  fontStyle: "italic",
                }}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                width={36}
              />
              <RechartsTooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelFormatter={(value) => `τ = ${Number(value).toFixed(3)}`}
                formatter={(value: any, name: any) => {
                  let label = String(name)
                  if (name === "x_tau") label = "x(τ)"
                  if (name === "h_t_minus_tau") label = "h(t - τ)"
                  if (name === "product") label = "Overlap Area"
                  return [Number(value).toFixed(3), label]
                }}
              />
              <ReferenceLine x={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeDasharray="4 4" />
              <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} strokeDasharray="4 4" />

              <Area
                type="monotone"
                dataKey="product"
                name="product"
                fill="oklch(0.68 0.19 25)"
                stroke="none"
                fillOpacity={0.3}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="x_tau"
                name="x_tau"
                stroke="oklch(0.72 0.19 195)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="stepAfter"
                dataKey="h_t_minus_tau"
                name="h_t_minus_tau"
                stroke="oklch(0.65 0.22 260)"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
              <Legend
                verticalAlign="top"
                height={28}
                formatter={(value) => {
                  if (value === "x_tau") return "x(τ)"
                  if (value === "h_t_minus_tau") return "h(t - τ)"
                  return "Overlap x(τ)h(t-τ)"
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
