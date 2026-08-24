"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Pause, Play, RotateCcw } from "lucide-react"

import { SignalPoint } from "@/types/signal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

type Props = {
  baseData: SignalPoint[]
  gain: number
  decay: number
}

type Stage = "signal" | "impulse" | "flip" | "shift" | "multiply"

const stageOrder: Stage[] = ["signal", "impulse", "flip", "shift", "multiply"]

function nextStage(current: Stage): Stage {
  const index = stageOrder.indexOf(current)
  return stageOrder[(index + 1) % stageOrder.length]
}

function u(t: number): number {
  return t >= 0 ? 1 : 0
}

function hOfT(t: number, gain: number, decay: number): number {
  // Causal impulse response: h(t) = K e^(-a t) u(t)
  if (t < 0) return 0
  return gain * Math.exp(-decay * t)
}

function getStageDescription(stage: Stage): string {
  switch (stage) {
    case "signal":
      return "Step 1: Start with input x(t)."
    case "impulse":
      return "Step 2: Show original impulse response h(t)."
    case "flip":
      return "Step 3: Flip impulse to h(-τ)."
    case "shift":
      return "Step 4: Shift flipped impulse to h(t-τ)."
    case "multiply":
      return "Step 5: Multiply x(τ)·h(t-τ) and integrate overlap area."
  }
}

function getVisibility(
  stage: Stage,
  guidedMode: boolean,
  manual: {
    showX: boolean
    showH: boolean
    showHFlipped: boolean
    showHShifted: boolean
    showProduct: boolean
  }
) {
  if (!guidedMode) return manual

  if (stage === "signal") {
    return {
      showX: true,
      showH: false,
      showHFlipped: false,
      showHShifted: false,
      showProduct: false,
    }
  }

  if (stage === "impulse") {
    return {
      showX: true,
      showH: true,
      showHFlipped: false,
      showHShifted: false,
      showProduct: false,
    }
  }

  if (stage === "flip") {
    return {
      showX: true,
      showH: false,
      showHFlipped: true,
      showHShifted: false,
      showProduct: false,
    }
  }

  if (stage === "shift") {
    return {
      showX: true,
      showH: false,
      showHFlipped: false,
      showHShifted: true,
      showProduct: false,
    }
  }

  return {
    showX: true,
    showH: false,
    showHFlipped: false,
    showHShifted: true,
    showProduct: true,
  }
}

function runStepConvolutionSanityCheck() {
  const dt = 0.01
  const tauMin = -6
  const tauMax = 6

  function stepConvAt(t: number): number {
    let sum = 0
    for (let tau = tauMin; tau <= tauMax; tau += dt) {
      const x = u(tau)
      const h = u(t - tau)
      sum += x * h * dt
    }
    return sum
  }

  const testTimes = [0.5, 1, 2, 3, 4]
  let maxErr = 0

  for (const t of testTimes) {
    const numeric = stepConvAt(t)
    const expected = t
    maxErr = Math.max(maxErr, Math.abs(numeric - expected))
  }

  return {
    maxErr: Number(maxErr.toFixed(4)),
    pass: maxErr < 0.08,
  }
}

export function ConvolutionAnimator({ baseData, gain, decay }: Props) {
  const [animTime, setAnimTime] = useState<number>(baseData[0]?.t || -5)
  const [isPlaying, setIsPlaying] = useState(false)

  const [guidedMode, setGuidedMode] = useState(true)
  const [stage, setStage] = useState<Stage>("signal")

  const [showX, setShowX] = useState(true)
  const [showH, setShowH] = useState(true)
  const [showHFlipped, setShowHFlipped] = useState(true)
  const [showHShifted, setShowHShifted] = useState(true)
  const [showProduct, setShowProduct] = useState(true)

  const minTime = baseData[0]?.t || -5
  const maxTime = baseData[baseData.length - 1]?.t || 5

  useEffect(() => {
    if (!isPlaying) return

    let animId = 0
    let lastTime = 0
    let stageElapsed = 0

    const loop = (time: number) => {
      if (!lastTime) lastTime = time
      const dt = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time

      setAnimTime((prev) => {
        let next = prev + dt * 1.4
        if (next > maxTime) next = minTime
        return next
      })

      if (guidedMode) {
        stageElapsed += dt
        if (stageElapsed >= 1.6) {
          setStage((prev) => nextStage(prev))
          stageElapsed = 0
        }
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [isPlaying, guidedMode, minTime, maxTime])

  const visibility = useMemo(
    () =>
      getVisibility(stage, guidedMode, {
        showX,
        showH,
        showHFlipped,
        showHShifted,
        showProduct,
      }),
    [stage, guidedMode, showX, showH, showHFlipped, showHShifted, showProduct]
  )

  const t = animTime

  const chartData = useMemo(() => {
    return baseData.map((pt) => {
      const tau = pt.t
      const xTau = pt.original

      const hTau = hOfT(tau, gain, decay)

      // Flip first: h(-τ)
      const hFlipped = hOfT(-tau, gain, decay)

      // Then shift flipped signal by t:
      // h_flipped(τ - t) = h(-(τ - t)) = h(t - τ)
      const hShifted = hOfT(-(tau - t), gain, decay)

      const product = xTau * hShifted

      return {
        tau: Number(tau.toFixed(4)),
        x_tau: Number(xTau.toFixed(6)),
        h_tau: Number(hTau.toFixed(6)),
        h_flipped: Number(hFlipped.toFixed(6)),
        h_shifted: Number(hShifted.toFixed(6)),
        product: Number(product.toFixed(6)),
      }
    })
  }, [baseData, gain, decay, t])

  const dt =
    baseData.length > 1 ? Math.abs(baseData[1].t - baseData[0].t) : 0.05
  const integralValue = useMemo(
    () => chartData.reduce((sum, d) => sum + d.product * dt, 0),
    [chartData, dt]
  )

  const sanity = useMemo(() => runStepConvolutionSanityCheck(), [])

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="space-y-3 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">
              Convolution Animation
            </CardTitle>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              y(t) = ∫ x(τ) h(t - τ) dτ
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              h(t - τ) = {gain.toFixed(2)}e^(-{decay.toFixed(2)}(t-τ))u(t-τ)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-md border border-border/50 bg-muted/40 px-3 py-1 text-center font-mono text-xs">
              t = {t.toFixed(2)}
              <br />
              y(t) ={" "}
              <span className="font-bold text-primary">
                {integralValue.toFixed(3)}
              </span>
            </div>

            <Button
              size="sm"
              variant={isPlaying ? "default" : "outline"}
              className="h-8"
              onClick={() => setIsPlaying((p) => !p)}
            >
              {isPlaying ? (
                <Pause className="mr-1 size-3.5" />
              ) : (
                <Play className="mr-1 size-3.5" />
              )}
              {isPlaying ? "Pause" : "Play"}
            </Button>
          </div>
        </div>


        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Guided Steps</span>
          <Switch
            checked={guidedMode}
            onCheckedChange={(checked) => {
              setGuidedMode(checked)
            }}
          />
          <Badge variant={guidedMode ? "secondary" : "outline"}>
            {guidedMode ? "Guided" : "Manual"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setStage("signal")
              setIsPlaying(false)
            }}
          >
            <RotateCcw className="mr-1 size-3" />
            Restart Steps
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {stageOrder.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={stage === s ? "secondary" : "ghost"}
              className="h-7 text-xs"
              onClick={() => {
                setStage(s)
                setGuidedMode(true)
              }}
            >
              {s === "signal" && "1. x(τ)"}
              {s === "impulse" && "2. h(t)"}
              {s === "flip" && "3. h(-τ)"}
              {s === "shift" && "4. h(t-τ)"}
              {s === "multiply" && "5. overlap"}
            </Button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">
          {getStageDescription(stage)}
        </p>

        {!guidedMode ? (
          <>
            <Separator className="opacity-40" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <ToggleRow label="x(τ)" checked={showX} onChange={setShowX} />
              <ToggleRow label="h(τ)" checked={showH} onChange={setShowH} />
              <ToggleRow
                label="h(-τ)"
                checked={showHFlipped}
                onChange={setShowHFlipped}
              />
              <ToggleRow
                label="h(t-τ)"
                checked={showHShifted}
                onChange={setShowHShifted}
              />
              <ToggleRow
                label="x(τ)h(t-τ)"
                checked={showProduct}
                onChange={setShowProduct}
              />
            </div>
          </>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3 pt-0 pb-3">
        <div className="h-72 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={0}
          >
            <ComposedChart
              data={chartData}
              margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />
              <XAxis
                dataKey="tau"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                label={{
                  value: "τ",
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
                width={40}
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
                formatter={(value, name) => {
                  const numeric =
                    typeof value === "number"
                      ? value
                      : typeof value === "string"
                        ? Number(value)
                        : Array.isArray(value)
                          ? Number(value[0] ?? 0)
                          : 0

                  const key = String(name)

                  if (key === "x_tau") return [numeric.toFixed(4), "x(τ)"]
                  if (key === "h_tau") return [numeric.toFixed(4), "h(τ)"]
                  if (key === "h_flipped") return [numeric.toFixed(4), "h(-τ)"]
                  if (key === "h_shifted") return [numeric.toFixed(4), "h(t-τ)"]
                  return [numeric.toFixed(4), "x(τ)h(t-τ)"]
                }}
              />
              <ReferenceLine
                x={0}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.45}
                strokeDasharray="4 4"
              />
              <ReferenceLine
                y={0}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.45}
                strokeDasharray="4 4"
              />
              <ReferenceLine
                x={Number(t.toFixed(4))}
                stroke="var(--primary)"
                strokeOpacity={0.7}
                strokeDasharray="6 3"
                label={{
                  value: "t",
                  position: "top",
                  fill: "var(--primary)",
                  fontSize: 11,
                }}
              />

              {visibility.showProduct ? (
                <Area
                  type="monotone"
                  dataKey="product"
                  name="product"
                  fill="var(--destructive)"
                  stroke="none"
                  fillOpacity={0.22}
                  isAnimationActive={false}
                />
              ) : null}

              {visibility.showX ? (
                <Line
                  type="monotone"
                  dataKey="x_tau"
                  name="x_tau"
                  stroke="var(--chart-2)"
                  strokeWidth={2.3}
                  dot={false}
                  isAnimationActive={false}
                />
              ) : null}

              {visibility.showH ? (
                <Line
                  type="stepAfter"
                  dataKey="h_tau"
                  name="h_tau"
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ) : null}

              {visibility.showHFlipped ? (
                <Line
                  type="stepAfter"
                  dataKey="h_flipped"
                  name="h_flipped"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  isAnimationActive={false}
                />
              ) : null}

              {visibility.showHShifted ? (
                <Line
                  type="stepAfter"
                  dataKey="h_shifted"
                  name="h_shifted"
                  stroke="var(--chart-3)"
                  strokeWidth={2.2}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />
              ) : null}

              <Legend
                verticalAlign="top"
                height={28}
                formatter={(value) => {
                  if (value === "x_tau") return "x(τ)"
                  if (value === "h_tau") return "h(τ)"
                  if (value === "h_flipped") return "h(-τ)"
                  if (value === "h_shifted") return "h(t-τ)"
                  return "x(τ)h(t-τ)"
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
          <p className="font-medium">Math Check (Step * Step = Ramp)</p>
          <p className="mt-1 text-muted-foreground">
            Numerical sanity test: y(t) = ∫u(τ)u(t-τ)dτ should approximate t for
            t ≥ 0.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={sanity.pass ? "secondary" : "destructive"}>
              {sanity.pass ? "Pass" : "Warning"}
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground">
              max |error| = {sanity.maxErr}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-border/50 px-2 py-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
