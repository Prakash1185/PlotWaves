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

const CHART_COLORS = {
  original: "oklch(0.72 0.19 195)",      // Vibrant teal
  transformed: "oklch(0.68 0.19 25)",     // Warm coral-orange
  originalAlt: "oklch(0.65 0.22 260)",    // Rich indigo
  transformedAlt: "oklch(0.70 0.18 330)", // Magenta-pink
}

function exportSvgAsPng(svg: SVGSVGElement, fileName: string) {
  const rect = svg.getBoundingClientRect()
  const width = Math.max(420, Math.round(rect.width))
  const height = Math.max(240, Math.round(rect.height))

  const serializer = new XMLSerializer()
  let svgString = serializer.serializeToString(svg)

  if (!svgString.includes("xmlns=")) {
    svgString = svgString.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')
  }

  const computed = getComputedStyle(document.body)
  svgString = svgString.replace(/var\((--[\w-]+)\)/g, (match, p1) => {
    return computed.getPropertyValue(p1).trim() || match
  })

  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  })
  const url = URL.createObjectURL(svgBlob)
  const image = new Image()

  image.onload = () => {
    const canvas = document.createElement("canvas")
    canvas.width = width * 2
    canvas.height = height * 2

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      toast.error("Failed to export chart image")
      URL.revokeObjectURL(url)
      return
    }

    ctx.scale(2, 2)
    ctx.drawImage(image, 0, 0, width, height)

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Failed to create PNG file")
        URL.revokeObjectURL(url)
        return
      }

      const downloadUrl = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = downloadUrl
      anchor.download = fileName.endsWith(".png") ? fileName : fileName + ".png"
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()

      URL.revokeObjectURL(downloadUrl)
      URL.revokeObjectURL(url)
      toast.success("Graph exported as PNG")
    }, "image/png")
  }

  image.onerror = () => {
    URL.revokeObjectURL(url)
    toast.error("Failed to render graph for export")
  }

  image.src = url
}

export { CHART_COLORS }

export function SignalChart(props: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  function handleExport() {
    const svg = chartContainerRef.current?.querySelector("svg")
    if (!svg) {
      toast.error("Chart is not ready for export")
      return
    }

    exportSvgAsPng(svg, props.fileName)
  }

  const isOverlay = props.mode === "overlay"

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-semibold">{props.title}</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">{props.subtitle}</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleExport}>
          <Download className="mr-1 size-3" />
          PNG
        </Button>
      </CardHeader>

      <CardContent className="pb-3 pt-0">
        <div ref={chartContainerRef} className="h-56 w-full sm:h-64 lg:h-72">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={props.data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
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
                formatter={(value: any) => [`y = ${Number(value).toFixed(4)}`, ""]}
              />
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="currentColor" floodOpacity="0.5" />
                </filter>
              </defs>
              <ReferenceLine x={0} stroke="var(--muted-foreground)" strokeOpacity={0.3} strokeDasharray="4 4" />
              <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.3} strokeDasharray="4 4" />

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
                    isAnimationActive={true}
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
                    isAnimationActive={true}
                    style={{ filter: "drop-shadow(0 0 4px var(--chart-2))" }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={28}
                    iconType="line"
                    wrapperStyle={{ fontSize: "11px", color: "var(--muted-foreground)" }}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey={props.seriesKey}
                  name={props.seriesKey === "original" ? "Original" : "Transformed"}
                  stroke={props.stroke}
                  dot={false}
                  strokeWidth={2.4}
                  animationDuration={props.seriesKey === "transformed" ? 500 : 300}
                  isAnimationActive={true}
                  style={props.seriesKey === "transformed" ? { filter: "drop-shadow(0 0 5px currentColor)" } : undefined}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}