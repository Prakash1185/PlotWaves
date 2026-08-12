"use client"

import { useRef } from "react"
import { Download } from "lucide-react"
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
import { toast } from "sonner"

import { SignalPoint } from "@/types/signal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ChartMode = "single" | "overlay"

type SingleProps = {
  mode: "single"
  data: SignalPoint[]
  title: string
  subtitle: string
  seriesKey: "original" | "transformed"
  stroke: string
  fileName: string
}

type OverlayProps = {
  mode: "overlay"
  data: SignalPoint[]
  title: string
  subtitle: string
  originalStroke: string
  transformedStroke: string
  fileName: string
}

type Props = SingleProps | OverlayProps

export const CHART_COLORS = {
  original: "var(--chart-2)",
  transformed: "var(--destructive)",
}

type SeriesConfig = {
  key: "original" | "transformed"
  label: string
  stroke: string
  dashed?: boolean
}

function resolveCssColor(colorExpr: string, fallback: string): string {
  if (typeof window === "undefined") return fallback

  const probe = document.createElement("span")
  probe.style.color = colorExpr
  probe.style.position = "absolute"
  probe.style.opacity = "0"
  probe.style.pointerEvents = "none"

  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()

  return resolved || fallback
}

function downloadCanvasAsPng(canvas: HTMLCanvasElement, fileName: string) {
  canvas.toBlob((blob) => {
    if (!blob) {
      toast.error("Failed to generate PNG")
      return
    }

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = fileName.endsWith(".png") ? fileName : fileName + ".png"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    toast.success("Graph exported as PNG")
  }, "image/png")
}

function exportChartFromData(props: Props) {
  if (!props.data.length) {
    toast.error("No data to export")
    return
  }

  const series: SeriesConfig[] =
    props.mode === "overlay"
      ? [
          { key: "original", label: "Original", stroke: props.originalStroke },
          {
            key: "transformed",
            label: "Transformed",
            stroke: props.transformedStroke,
            dashed: true,
          },
        ]
      : [
          {
            key: props.seriesKey,
            label: props.seriesKey === "original" ? "Original" : "Transformed",
            stroke: props.stroke,
            dashed: props.seriesKey === "transformed",
          },
        ]

  const xValues = props.data.map((p) => p.t).filter((v) => Number.isFinite(v))
  const yValues = props.data
    .flatMap((p) => series.map((s) => p[s.key]))
    .filter((v) => Number.isFinite(v))

  if (!xValues.length || !yValues.length) {
    toast.error("Invalid chart data")
    return
  }

  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)

  let yMin = Math.min(...yValues)
  let yMax = Math.max(...yValues)

  if (yMin === yMax) {
    yMin -= 1
    yMax += 1
  }

  const yPad = (yMax - yMin) * 0.12
  yMin -= yPad
  yMax += yPad

  const width = 1400
  const height = 820
  const pad = { left: 94, right: 36, top: 74, bottom: 78 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  const bg = resolveCssColor("var(--card)", "#ffffff")
  const panel = resolveCssColor("var(--background)", "#f8f9fb")
  const fg = resolveCssColor("var(--foreground)", "#111827")
  const muted = resolveCssColor("var(--muted-foreground)", "#6b7280")
  const border = resolveCssColor("var(--border)", "#d1d5db")
  const zeroAxis = resolveCssColor("var(--ring)", "#9ca3af")

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    toast.error("Failed to initialize canvas")
    return
  }

  const mapX = (x: number) =>
    pad.left + ((x - xMin) / (xMax - xMin || 1)) * plotW
  const mapY = (y: number) =>
    pad.top + ((yMax - y) / (yMax - yMin || 1)) * plotH

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = panel
  ctx.fillRect(pad.left, pad.top, plotW, plotH)

  const vGrid = 8
  const hGrid = 6
  ctx.strokeStyle = border
  ctx.lineWidth = 1

  for (let i = 0; i <= vGrid; i += 1) {
    const x = pad.left + (i / vGrid) * plotW
    ctx.beginPath()
    ctx.moveTo(x, pad.top)
    ctx.lineTo(x, pad.top + plotH)
    ctx.stroke()
  }

  for (let i = 0; i <= hGrid; i += 1) {
    const y = pad.top + (i / hGrid) * plotH
    ctx.beginPath()
    ctx.moveTo(pad.left, y)
    ctx.lineTo(pad.left + plotW, y)
    ctx.stroke()
  }

  if (xMin <= 0 && xMax >= 0) {
    const x0 = mapX(0)
    ctx.save()
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = zeroAxis
    ctx.beginPath()
    ctx.moveTo(x0, pad.top)
    ctx.lineTo(x0, pad.top + plotH)
    ctx.stroke()
    ctx.restore()
  }

  if (yMin <= 0 && yMax >= 0) {
    const y0 = mapY(0)
    ctx.save()
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = zeroAxis
    ctx.beginPath()
    ctx.moveTo(pad.left, y0)
    ctx.lineTo(pad.left + plotW, y0)
    ctx.stroke()
    ctx.restore()
  }

  ctx.fillStyle = fg
  ctx.font = "600 24px system-ui, sans-serif"
  ctx.fillText(props.title, pad.left, 34)

  ctx.fillStyle = muted
  ctx.font = "400 15px system-ui, sans-serif"
  ctx.fillText(props.subtitle, pad.left, 56)

  ctx.font = "500 14px system-ui, sans-serif"
  for (let i = 0; i <= hGrid; i += 1) {
    const ratio = i / hGrid
    const yVal = yMax - ratio * (yMax - yMin)
    const y = pad.top + ratio * plotH
    ctx.fillStyle = muted
    ctx.fillText(yVal.toFixed(2), 12, y + 4)
  }

  const xTicks = 8
  for (let i = 0; i <= xTicks; i += 1) {
    const ratio = i / xTicks
    const xVal = xMin + ratio * (xMax - xMin)
    const x = pad.left + ratio * plotW
    ctx.fillStyle = muted
    ctx.fillText(xVal.toFixed(2), x - 18, pad.top + plotH + 24)
  }

  ctx.fillStyle = muted
  ctx.font = "500 15px system-ui, sans-serif"
  ctx.fillText("Time (t)", pad.left + plotW - 78, pad.top + plotH + 50)

  ctx.save()
  ctx.translate(28, pad.top + plotH / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText("Amplitude", 0, 0)
  ctx.restore()

  series.forEach((s) => {
    ctx.save()
    ctx.strokeStyle = resolveCssColor(
      s.stroke,
      s.key === "original" ? "#1d4ed8" : "#dc2626"
    )
    ctx.lineWidth = s.key === "transformed" ? 3.2 : 2.8
    ctx.lineJoin = "round"
    ctx.lineCap = "round"
    ctx.setLineDash(s.dashed ? [12, 8] : [])

    let started = false
    for (const point of props.data) {
      const x = mapX(point.t)
      const y = mapY(point[s.key])

      if (!Number.isFinite(x) || !Number.isFinite(y)) continue

      if (!started) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        started = true
      } else {
        ctx.lineTo(x, y)
      }
    }

    if (started) ctx.stroke()
    ctx.restore()
  })

  const legendX = pad.left + plotW - 220
  const legendY = pad.top + 8
  series.forEach((s, index) => {
    const y = legendY + index * 26
    ctx.save()
    ctx.strokeStyle = resolveCssColor(
      s.stroke,
      s.key === "original" ? "#1d4ed8" : "#dc2626"
    )
    ctx.lineWidth = 3
    ctx.setLineDash(s.dashed ? [12, 8] : [])
    ctx.beginPath()
    ctx.moveTo(legendX, y)
    ctx.lineTo(legendX + 34, y)
    ctx.stroke()
    ctx.restore()

    ctx.fillStyle = fg
    ctx.font = "500 14px system-ui, sans-serif"
    ctx.fillText(s.label, legendX + 44, y + 5)
  })

  downloadCanvasAsPng(canvas, props.fileName)
}

export function SignalChart(props: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  function handleExport() {
    exportChartFromData(props)
  }

  const isOverlay = props.mode === "overlay"

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-semibold">{props.title}</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {props.subtitle}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={handleExport}
        >
          <Download className="mr-1 size-3" />
          PNG
        </Button>
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        <div ref={chartContainerRef} className="h-56 w-full sm:h-64 lg:h-72">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={0}
          >
            <LineChart
              data={props.data}
              margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="t"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={{ stroke: "var(--border)" }}
                axisLine={{ stroke: "var(--border)" }}
                label={{
                  value: "Time (t)",
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
                tickLine={{ stroke: "var(--border)" }}
                axisLine={{ stroke: "var(--border)" }}
                width={40}
                label={{
                  value: "Amplitude",
                  angle: -90,
                  position: "insideLeft",
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                  offset: 4,
                }}
              />
              <RechartsTooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 500 }}
                labelFormatter={(value) => `t = ${Number(value).toFixed(3)}`}
                formatter={(value, key) => {
                  const numeric = Array.isArray(value)
                    ? Number(value[0] ?? 0)
                    : Number(value ?? 0)

                  return [numeric.toFixed(4), String(key)]
                }}
              />

              <ReferenceLine
                x={0}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.3}
                strokeDasharray="4 4"
              />
              <ReferenceLine
                y={0}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.3}
                strokeDasharray="4 4"
              />

              {isOverlay ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="original"
                    name="Original"
                    stroke={props.originalStroke}
                    dot={false}
                    strokeWidth={2.2}
                    animationDuration={300}
                    isAnimationActive
                  />
                  <Line
                    type="monotone"
                    dataKey="transformed"
                    name="Transformed"
                    stroke={props.transformedStroke}
                    dot={false}
                    strokeWidth={2.5}
                    strokeDasharray="6 3"
                    animationDuration={500}
                    isAnimationActive
                  />
                  <Legend
                    verticalAlign="top"
                    height={28}
                    iconType="line"
                    wrapperStyle={{
                      fontSize: "11px",
                      color: "var(--muted-foreground)",
                    }}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey={props.seriesKey}
                  name={
                    props.seriesKey === "original" ? "Original" : "Transformed"
                  }
                  stroke={props.stroke}
                  dot={false}
                  strokeWidth={2.4}
                  animationDuration={
                    props.seriesKey === "transformed" ? 500 : 300
                  }
                  isAnimationActive
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
