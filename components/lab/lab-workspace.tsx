"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  CircleHelp,
  Copy,
  Eye,
  EyeOff,
  Layers,
  PanelRight,
  RotateCcw,
  Settings2,
  SplitSquareVertical,
} from "lucide-react"
import { toast } from "sonner"

import { ThemeToggle } from "@/components/theme-toggle"
import { SignalChart, CHART_COLORS } from "@/components/lab/signal-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { SignalParams, SignalPoint, SignalType } from "@/types/signal"
import { sampleSignal } from "@/lib/services/signal/sample-signal"
import { formatEquation } from "@/lib/services/equation/format-equation"
import { getExplanation } from "@/lib/services/explanation/get-explanation"
import { compileManualEquation } from "@/lib/services/equation/manual-evaluator"

type EquationMode = "parametric" | "manual"
type ChartLayout = "split" | "overlay"

const defaults: SignalParams = {
  baseAmplitude: 1,
  omega: 2,
  phase: 0,
  shift: 0,
  timeScale: 1,
  outputScale: 1,
  timeReversal: false,
  minTime: -10,
  maxTime: 10,
  step: 0.05,
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function buildConvolutionPreview(
  baseData: SignalPoint[],
  gain: number,
  decay: number
): SignalPoint[] {
  if (baseData.length < 2) return baseData

  const dt = Math.abs(baseData[1].t - baseData[0].t) || 0.05
  const y: number[] = new Array(baseData.length).fill(0)

  for (let n = 0; n < baseData.length; n += 1) {
    let sum = 0
    for (let k = 0; k <= n; k += 1) {
      const tau = baseData[n].t - baseData[k].t
      const h = tau >= 0 ? gain * Math.exp(-decay * tau) : 0
      sum += baseData[k].original * h * dt
    }
    y[n] = sum
  }

  return baseData.map((point, index) => ({
    ...point,
    transformed: Number(y[index].toFixed(6)),
  }))
}

// ─── Helper components ────────────────────────────────────────────

function InfoLabel({ label, tip }: { label: string; tip: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            aria-label={"More info about " + label}
          >
            <CircleHelp className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-72">
          <p>{tip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function ParamSlider({
  label,
  tip,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  tip: string
  value: number
  min: number
  max: number
  step: number
  onChange: (next: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <InfoLabel label={label} tip={tip} />
        <span className="min-w-[3rem] text-right font-mono text-xs text-muted-foreground">
          {value.toFixed(2)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </div>
  )
}

function ParamInput({
  label,
  tip,
  value,
  onChange,
}: {
  label: string
  tip: string
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div className="space-y-1">
      <InfoLabel label={label} tip={tip} />
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 text-sm"
      />
    </div>
  )
}

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent/50"
        onClick={() => setOpen((p) => !p)}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────

export function LabWorkspace() {
  const [signalType, setSignalType] = useState<SignalType>("sine")
  const [params, setParams] = useState<SignalParams>(defaults)
  const [isResetOpen, setResetOpen] = useState(false)
  const [isControlsOpen, setControlsOpen] = useState(false)

  const [equationMode, setEquationMode] = useState<EquationMode>("parametric")
  const [manualExpression, setManualExpression] = useState("0")

  const [chartLayout, setChartLayout] = useState<ChartLayout>("split")
  const [showOriginal, setShowOriginal] = useState(true)
  const [showTransformed, setShowTransformed] = useState(true)

  const [showConvolutionPreview, setShowConvolutionPreview] = useState(false)
  const [convGain, setConvGain] = useState(1)
  const [convDecay, setConvDecay] = useState(0.65)

  const baseData = useMemo(() => sampleSignal(signalType, params), [signalType, params])
  const manualCompile = useMemo(() => compileManualEquation(manualExpression), [manualExpression])

  const standardData = useMemo(() => {
    if (equationMode !== "manual" || !manualCompile.ok) {
      return baseData
    }

    return baseData.map((point) => {
      const value = manualCompile.fn(point.t)
      return {
        ...point,
        transformed: Number(value.toFixed(6)),
      }
    })
  }, [baseData, equationMode, manualCompile])

  const convolutionData = useMemo(
    () => buildConvolutionPreview(baseData, convGain, convDecay),
    [baseData, convGain, convDecay]
  )

  const data = useMemo(() => {
    if (showConvolutionPreview) return convolutionData
    return standardData
  }, [showConvolutionPreview, convolutionData, standardData])

  const equation = useMemo(() => {
    if (showConvolutionPreview) {
      return `y(t) = x(t) * h(t),  h(t) = ${convGain.toFixed(2)}·e^(−${convDecay.toFixed(2)}t)·u(t)`
    }
    if (equationMode === "manual") {
      return "y(t) = " + (manualExpression.trim() || "0")
    }
    return formatEquation(signalType, params)
  }, [showConvolutionPreview, convGain, convDecay, equationMode, manualExpression, signalType, params])

  const explanation = useMemo(() => {
    return getExplanation(params, signalType)
  }, [params, signalType])

  const convolutionStats = useMemo(() => {
    if (convolutionData.length === 0) return null

    let peakValue = convolutionData[0].transformed
    let peakTime = convolutionData[0].t
    let zeroPoint = convolutionData[0]

    for (const point of convolutionData) {
      if (Math.abs(point.transformed) > Math.abs(peakValue)) {
        peakValue = point.transformed
        peakTime = point.t
      }
      if (Math.abs(point.t) < Math.abs(zeroPoint.t)) {
        zeroPoint = point
      }
    }

    return {
      peakValue: Number(peakValue.toFixed(4)),
      peakTime: Number(peakTime.toFixed(3)),
      atZero: Number(zeroPoint.transformed.toFixed(4)),
    }
  }, [convolutionData])

  const updateParam = useCallback(<K extends keyof SignalParams>(key: K, value: SignalParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetAll = useCallback(() => {
    setParams(defaults)
    setSignalType("sine")
    setEquationMode("parametric")
    setManualExpression("0")
    setShowConvolutionPreview(false)
    setConvGain(1)
    setConvDecay(0.65)
    setChartLayout("split")
    setShowOriginal(true)
    setShowTransformed(true)
    toast.success("Workspace reset to defaults")
  }, [])

  const copyEquation = useCallback(() => {
    navigator.clipboard.writeText(equation)
    toast.success("Equation copied to clipboard")
  }, [equation])

  function validateManualEquation() {
    if (equationMode !== "manual") {
      toast.info("Switch to Manual mode first")
      return
    }

    if (manualCompile.ok) {
      toast.success("Manual equation is valid and applied")
    } else {
      toast.error(manualCompile.error)
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return

      const key = event.key.toLowerCase()

      if (key === "c") {
        event.preventDefault()
        copyEquation()
        return
      }

      if (key === "r") {
        event.preventDefault()
        setResetOpen(true)
        return
      }

      if (key === "k") {
        event.preventDefault()
        setControlsOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [copyEquation])

  // ─── Panel definitions ────────────────────────────────────────

  const generatorPanel = (
    <div className="space-y-4">
      <div>
        <InfoLabel
          label="Signal type"
          tip="Select the base signal family used for x(t)."
        />
        <Select
          value={signalType}
          onValueChange={(v: SignalType) => {
            setSignalType(v)
            toast.info("Signal changed to " + v)
          }}
        >
          <SelectTrigger className="mt-2 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sine">Sine</SelectItem>
            <SelectItem value="cosine">Cosine</SelectItem>
            <SelectItem value="step">Unit Step</SelectItem>
            <SelectItem value="ramp">Ramp</SelectItem>
            <SelectItem value="exp">Exponential</SelectItem>
            <SelectItem value="square">Square Wave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ParamSlider
        label="Base Amplitude (A_sig)"
        tip="Amplitude of the original signal x(t). This scales the base waveform."
        value={params.baseAmplitude}
        min={0}
        max={5}
        step={0.1}
        onChange={(v) => updateParam("baseAmplitude", v)}
      />
      <ParamSlider
        label="Omega (ω)"
        tip="Angular frequency in rad/s. Controls oscillation rate for periodic signals."
        value={params.omega}
        min={0}
        max={12}
        step={0.1}
        onChange={(v) => updateParam("omega", v)}
      />
      <ParamSlider
        label="Phase (φ)"
        tip="Phase offset in radians. Shifts the waveform along the time axis within one period."
        value={params.phase}
        min={-6.28}
        max={6.28}
        step={0.1}
        onChange={(v) => updateParam("phase", v)}
      />
    </div>
  )

  const transformPanel = (
    <div className="space-y-4">
      <ParamSlider
        label="Time Shift (t₀)"
        tip="Time shift inside x(a(t − t₀)). Positive values delay the signal (shift right)."
        value={params.shift}
        min={-5}
        max={5}
        step={0.1}
        onChange={(v) => updateParam("shift", v)}
      />
      <ParamSlider
        label="Time Scale (a)"
        tip="Controls compression (a > 1) or expansion (0 < a < 1). Zero gives a constant output."
        value={params.timeScale}
        min={0}
        max={4}
        step={0.1}
        onChange={(v) => updateParam("timeScale", v)}
      />
      <ParamSlider
        label="Output Scale (A_out)"
        tip="Scales the transformed signal y(t). This is applied after all time transformations."
        value={params.outputScale}
        min={0}
        max={4}
        step={0.1}
        onChange={(v) => updateParam("outputScale", v)}
      />

      <Separator className="opacity-50" />

      <div className="flex items-center justify-between">
        <InfoLabel
          label="Time Reversal"
          tip="Mirrors the signal about t = 0 by replacing t with −t."
        />
        <Switch
          checked={params.timeReversal}
          onCheckedChange={(checked) => {
            updateParam("timeReversal", checked)
            toast.info(checked ? "Time reversal enabled" : "Time reversal disabled")
          }}
        />
      </div>
    </div>
  )

  const samplingPanel = (
    <div className="space-y-3">
      <ParamInput
        label="Min time"
        tip="Left boundary of the time axis."
        value={params.minTime}
        onChange={(v) => updateParam("minTime", v)}
      />
      <ParamInput
        label="Max time"
        tip="Right boundary of the time axis."
        value={params.maxTime}
        onChange={(v) => updateParam("maxTime", v)}
      />
      <ParamInput
        label="Step (Δt)"
        tip="Time resolution used to sample points. Smaller = smoother but heavier."
        value={params.step}
        onChange={(v) => updateParam("step", Math.max(0.001, Math.abs(v)))}
      />
    </div>
  )

  const convolutionPanel = (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Preview convolution y(t) = x(t) * h(t) with a causal exponential impulse response.
      </p>

      <ParamSlider
        label="Impulse Gain (K)"
        tip="Scales the impulse response amplitude h(t) = K·e^(−αt)·u(t)."
        value={convGain}
        min={0.1}
        max={3}
        step={0.05}
        onChange={setConvGain}
      />

      <ParamSlider
        label="Impulse Decay (α)"
        tip="Higher values mean faster exponential decay."
        value={convDecay}
        min={0.05}
        max={2.5}
        step={0.05}
        onChange={setConvDecay}
      />

      <div className="flex items-center justify-between">
        <InfoLabel
          label="Enable convolution"
          tip="When enabled, the transformed graph shows convolution output instead of parametric transform."
        />
        <Switch
          checked={showConvolutionPreview}
          onCheckedChange={(checked) => {
            if (checked && equationMode === "manual") {
              setEquationMode("parametric")
              toast.info("Manual mode disabled while convolution preview is active")
            }
            setShowConvolutionPreview(checked)
            toast.info(checked ? "Convolution preview enabled" : "Convolution preview disabled")
          }}
        />
      </div>

      {showConvolutionPreview && convolutionStats ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground"
        >
          <p>Peak: {convolutionStats.peakValue} at t = {convolutionStats.peakTime}</p>
          <p>At t ≈ 0: {convolutionStats.atZero}</p>
        </motion.div>
      ) : null}
    </div>
  )

  // ─── Left sidebar content ──────────────────────────────────────

  const leftSidebar = (
    <div className="space-y-3">
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Signal Generator</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {generatorPanel}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Transformations</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {transformPanel}
        </CardContent>
      </Card>
    </div>
  )

  // ─── Right sidebar content ─────────────────────────────────────

  const rightSidebar = (
    <div className="space-y-3">
      {/* Equation card */}
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Live Equation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Tabs
            value={equationMode}
            onValueChange={(value) => {
              const next = value as EquationMode
              if (next === "manual" && showConvolutionPreview) {
                setShowConvolutionPreview(false)
                toast.info("Convolution preview disabled for manual mode")
              }
              setEquationMode(next)
              toast.info(
                next === "manual"
                  ? "Manual equation mode"
                  : "Parametric equation mode"
              )
            }}
          >
            <TabsList className="grid h-8 w-full grid-cols-2">
              <TabsTrigger value="parametric" className="text-xs">Parametric</TabsTrigger>
              <TabsTrigger value="manual" className="text-xs">Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="parametric" className="space-y-2 pt-2">
              <div className="rounded-md border border-border/60 bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                {equation}
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-full text-xs" onClick={copyEquation}>
                <Copy className="mr-1 size-3" />
                Copy equation
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-2 pt-2">
              <Textarea
                value={manualExpression}
                onChange={(event) => setManualExpression(event.target.value)}
                placeholder="e.g. 2*sin(3*(t-1))"
                className="min-h-16 font-mono text-xs"
              />

              <p className="text-[10px] text-muted-foreground">
                sin, cos, tan, exp, log, sqrt, abs, floor, ceil, round, sign, pi, e, ^ + − * /
              </p>

              <p className={manualCompile.ok ? "text-[10px] text-primary" : "text-[10px] text-destructive"}>
                {manualCompile.ok ? "✓ Valid expression applied" : manualCompile.error}
              </p>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={validateManualEquation}>
                  Validate
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={copyEquation}>
                  <Copy className="size-3" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Explanation card */}
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Concept Insight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {explanation.map((entry, i) => (
            <motion.div
              key={entry.text}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.15 }}
              className={`flex items-start gap-2 rounded-md px-2.5 py-2 text-xs leading-relaxed ${
                entry.category === "warning"
                  ? "border border-destructive/20 bg-destructive/5 text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {entry.category === "warning" && (
                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
              )}
              <span>{entry.text}</span>
            </motion.div>
          ))}

          <Separator className="opacity-40" />

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px]">{signalType}</Badge>
            <Badge variant="outline" className="text-[10px]">a = {params.timeScale.toFixed(2)}</Badge>
            <Badge variant="outline" className="text-[10px]">t₀ = {params.shift.toFixed(2)}</Badge>
            <Badge variant="outline" className="text-[10px]">A_out = {params.outputScale.toFixed(2)}</Badge>
            {params.timeReversal && (
              <Badge variant="destructive" className="text-[10px]">↺ Reversed</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced settings */}
      <CollapsibleSection
        title="Advanced Settings"
        icon={<Settings2 className="size-3.5 text-muted-foreground" />}
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Sampling</p>
            {samplingPanel}
          </div>
          <Separator className="opacity-40" />
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Convolution Preview</p>
            {convolutionPanel}
          </div>
        </div>
      </CollapsibleSection>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            size="sm"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw className="mr-1 size-3.5" />
            Reset Workspace
          </Button>
        </TooltipTrigger>
        <TooltipContent>Shortcut: R</TooltipContent>
      </Tooltip>
    </div>
  )

  // ─── Chart area ────────────────────────────────────────────────

  const chartArea = (
    <div className="space-y-3">
      {/* Chart controls bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={chartLayout === "split" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setChartLayout("split")
              toast.info("Split view")
            }}
          >
            <SplitSquareVertical className="mr-1 size-3" />
            Split
          </Button>
          <Button
            variant={chartLayout === "overlay" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setChartLayout("overlay")
              toast.info("Overlay view")
            }}
          >
            <Layers className="mr-1 size-3" />
            Overlay
          </Button>
        </div>

        {chartLayout === "split" && (
          <div className="flex items-center gap-2">
            <Button
              variant={showOriginal ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setShowOriginal((p) => !p)
                toast.info(!showOriginal ? "Original shown" : "Original hidden")
              }}
            >
              {showOriginal ? <Eye className="mr-1 size-3" /> : <EyeOff className="mr-1 size-3" />}
              x(t)
            </Button>
            <Button
              variant={showTransformed ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setShowTransformed((p) => !p)
                toast.info(!showTransformed ? "Transformed shown" : "Transformed hidden")
              }}
            >
              {showTransformed ? <Eye className="mr-1 size-3" /> : <EyeOff className="mr-1 size-3" />}
              y(t)
            </Button>
          </div>
        )}
      </div>

      {/* Charts */}
      <AnimatePresence mode="wait">
        {chartLayout === "overlay" ? (
          <motion.div
            key="overlay"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <SignalChart
              mode="overlay"
              data={data}
              title="Signal Comparison"
              subtitle="Original x(t) and transformed y(t) overlaid"
              originalStroke={CHART_COLORS.original}
              transformedStroke={CHART_COLORS.transformed}
              fileName="signal-comparison.png"
            />
          </motion.div>
        ) : (
          <motion.div
            key="split"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {showOriginal && (
              <SignalChart
                mode="single"
                data={data}
                title="Original Signal x(t)"
                subtitle="Base signal before transformations"
                seriesKey="original"
                stroke={CHART_COLORS.original}
                fileName="original-signal.png"
              />
            )}
            {showTransformed && (
              <SignalChart
                mode="single"
                data={data}
                title={showConvolutionPreview ? "Convolution y(t) = x(t) * h(t)" : "Transformed Signal y(t)"}
                subtitle={
                  showConvolutionPreview
                    ? "Convolution preview output"
                    : "After shift, scale, and reversal"
                }
                seriesKey="transformed"
                stroke={CHART_COLORS.transformed}
                fileName="transformed-signal.png"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts hint */}
      <p className="text-center text-[10px] tracking-wide text-muted-foreground/60">
        <kbd className="rounded border border-border/50 px-1 py-0.5 text-[9px]">C</kbd> copy
        {" · "}
        <kbd className="rounded border border-border/50 px-1 py-0.5 text-[9px]">R</kbd> reset
        {" · "}
        <kbd className="rounded border border-border/50 px-1 py-0.5 text-[9px]">K</kbd> controls
        {" · "}
        <kbd className="rounded border border-border/50 px-1 py-0.5 text-[9px]">D</kbd> theme
      </p>
    </div>
  )

  // ─── Render ────────────────────────────────────────────────────

  return (
    <>
      <main className="mx-auto w-full max-w-[1400px] px-4 py-4 pb-24 sm:px-6 lg:pb-6">
        {/* Header */}
        <header className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="h-8 px-2">
              <Link href="/">
                <ArrowLeft className="size-3.5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight sm:text-lg">Signal Systems Lab</h1>
                <Badge variant="outline" className="text-[10px]">V1</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Interactive workspace</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* Main grid */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left sidebar — desktop only */}
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
            className="hidden lg:col-span-3 lg:block"
          >
            {leftSidebar}
          </motion.aside>

          {/* Center — charts */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1], delay: 0.05 }}
            className="lg:col-span-6"
          >
            {chartArea}
          </motion.section>

          {/* Right sidebar — desktop only */}
          <motion.aside
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1], delay: 0.1 }}
            className="hidden lg:col-span-3 lg:block"
          >
            {rightSidebar}
          </motion.aside>
        </div>
      </main>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-2.5">
          <Sheet open={isControlsOpen} onOpenChange={setControlsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <PanelRight className="mr-1 size-3.5" />
                Controls
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Lab Controls</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Signal Generator</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">{generatorPanel}</CardContent>
                </Card>
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Transformations</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">{transformPanel}</CardContent>
                </Card>
                {rightSidebar}
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="ghost" size="sm" onClick={copyEquation}>
            <Copy className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Reset dialog */}
      <AlertDialog open={isResetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all controls?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore all signal parameters, transformations, and view settings to their default values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetAll()
                setResetOpen(false)
              }}
            >
              Confirm reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}