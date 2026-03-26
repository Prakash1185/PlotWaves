"use client"

import { useRef } from "react"
import { Download } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import { SignalPoint } from "@/types/signal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SeriesKey = "original" | "transformed"

type Props = {
  data: SignalPoint[]
  title: string
  subtitle: string
  seriesKey: SeriesKey
  stroke: string
  fileName: string
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

export function SignalChart({
  data,
  title,
  subtitle,
  seriesKey,
  stroke,
  fileName,
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  function handleExport() {
    const svg = chartContainerRef.current?.querySelector("svg")
    if (!svg) {
      toast.error("Chart is not ready for export")
      return
    }

    exportSvgAsPng(svg, fileName)
  }

  return (
    <Card className="border-border/70">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="size-4" />
          Export PNG
        </Button>
      </CardHeader>

      <CardContent>
        <div ref={chartContainerRef} className="h-72 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 6, right: 10, top: 10, bottom: 8 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Line
                type="monotone"
                dataKey={seriesKey}
                name={seriesKey === "original" ? "Original" : "Transformed"}
                stroke={stroke}
                dot={false}
                strokeWidth={2.8}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}