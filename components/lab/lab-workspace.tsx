"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  CircleHelp,
  Copy,
  Eye,
  EyeOff,
  Layers,
  PanelRight,
  Play,
  Pause,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  SheetClose,
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
import {
  computeEvenOddDecomposition,
  computeFrequencySpectrum,
  computeSignalStats,
} from "@/lib/services/signal/signal-analysis"
import { SignalStatsPanel } from "@/components/lab/signal-stats-panel"
import { SpectrumChart } from "@/components/lab/spectrum-chart"
import { EvenOddChart } from "@/components/lab/even-odd-chart"
import { ConvolutionAnimator } from "@/components/lab/convolution-animator"

type EquationMode = "parametric" | "manual"
type ChartLayout = "split" | "overlay"

type RangeKey =
  | "baseAmplitude"
  | "omega"
  | "phase"
  | "shift"
  | "timeScale"
  | "outputScale"

type RangeMap = Record<RangeKey, { min: number; max: number }>

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

const defaultRanges: RangeMap = {
  baseAmplitude: { min: 0, max: 5 },
  omega: { min: 0, max: 12 },
  phase: { min: -6.28, max: 6.28 },
  shift: { min: -5, max: 5 },
  timeScale: { min: 0, max: 4 },
  outputScale: { min: 0, max: 4 },
}

const manualExamples = [
  "2*sin(3*t)",
  "cos(2*t + pi/4)",
  "exp(-0.4*t)*sin(6*t)",
  "abs(sin(4*t))",
  "max(0, t)",
]

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function formatVal(value: number): string {
  return Number(value.toFixed(3)).toString()
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
      <p className="text-[10px] text-muted-foreground">
        Range: {formatVal(min)} to {formatVal(max)}
      </p>
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
  const [local, setLocal] = useState(String(value))

  useEffect(() => {
    setLocal(String(value))
  }, [value])

  return (
    <div className="space-y-1">
      <InfoLabel label={label} tip={tip} />
      <Input
        type="text"
        inputMode="decimal"
        value={local}
        onChange={(e) => {
          setLocal(e.target.value)
          const parsed = parseFloat(e.target.value)
          if (!isNaN(parsed)) {
            onChange(parsed)
          }
        }}
        onBlur={() => setLocal(String(value))}
        className="h-8 text-sm"
      />
    </div>
  )
}

function RangeRow({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  label: string
  min: number
  max: number
  onMinChange: (v: number) => void
  onMaxChange: (v: number) => void
}) {
  return (
    <div className="grid grid-cols-[1fr,92px,92px] items-center gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <Input
        type="number"
        value={min}
        onChange={(e) => onMinChange(Number(e.target.value))}
        className="h-8 text-xs"
      />
      <Input
        type="number"
        value={max}
        onChange={(e) => onMaxChange(Number(e.target.value))}
        className="h-8 text-xs"
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
            <div className="px-4 pt-1 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function LabWorkspace() {
  const searchParams = useSearchParams()

  const [signalType, setSignalType] = useState<SignalType>("sine")
  const [params, setParams] = useState<SignalParams>(defaults)

  const [ranges, setRanges] = useState<RangeMap>(defaultRanges)
  const [rangeDraft, setRangeDraft] = useState<RangeMap>(defaultRanges)

  const [equationMode, setEquationMode] = useState<EquationMode>("parametric")
  const [manualExpression, setManualExpression] = useState("0")

  const [chartLayout, setChartLayout] = useState<ChartLayout>("overlay")
  const [showOriginal, setShowOriginal] = useState(true)
  const [showTransformed, setShowTransformed] = useState(true)

  const [showConvolutionPreview, setShowConvolutionPreview] = useState(false)
  const [showConvolutionAnimator, setShowConvolutionAnimator] = useState(false)
  const [convGain, setConvGain] = useState(1)
  const [convDecay, setConvDecay] = useState(0.65)

  const [isResetOpen, setResetOpen] = useState(false)
  const [isControlsOpen, setControlsOpen] = useState(false)
  const [isRangeModalOpen, setRangeModalOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    let presetLoaded = false

    const t = searchParams.get("type")
    if (t) {
      setSignalType(t as SignalType)
      presetLoaded = true
    }

    const w = searchParams.get("w")
    const shift = searchParams.get("shift")
    const scale = searchParams.get("scale")
    const A = searchParams.get("A")
    const rev = searchParams.get("rev")
    const step = searchParams.get("step")

    if (w || shift || scale || A || rev || step) {
      setParams((prev) => ({
        ...prev,
        omega: w ? parseFloat(w) : prev.omega,
        shift: shift ? parseFloat(shift) : prev.shift,
        timeScale: scale ? parseFloat(scale) : prev.timeScale,
        baseAmplitude: A ? parseFloat(A) : prev.baseAmplitude,
        timeReversal: rev === "true" ? true : prev.timeReversal,
        step: step ? Math.max(0.001, parseFloat(step)) : prev.step,
      }))
      presetLoaded = true
    }

    const conv = searchParams.get("conv")
    if (conv === "true") {
      setShowConvolutionPreview(true)
      const gain = searchParams.get("gain")
      if (gain) setConvGain(parseFloat(gain))
      const decay = searchParams.get("decay")
      if (decay) setConvDecay(parseFloat(decay))
      presetLoaded = true
    }

    if (presetLoaded) {
      toast.success("Loaded preset from URL")
    }
  }, [searchParams])

  const baseData = useMemo(
    () => sampleSignal(signalType, params),
    [signalType, params]
  )
  const manualCompile = useMemo(
    () => compileManualEquation(manualExpression),
    [manualExpression]
  )

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
      return `y(t) = x(t) * h(t), h(t) = ${convGain.toFixed(2)} · e^(-${convDecay.toFixed(2)}t) · u(t)`
    }
    if (equationMode === "manual") {
      return "y(t) = " + (manualExpression.trim() || "0")
    }
    return formatEquation(signalType, params)
  }, [
    showConvolutionPreview,
    convGain,
    convDecay,
    equationMode,
    manualExpression,
    signalType,
    params,
  ])

  const modelEquation = "y(t) = A_out · x(a · (t - t0))"

  const baseSignalEquation = useMemo(() => {
    const A = formatVal(params.baseAmplitude)
    const w = formatVal(params.omega)
    const p = formatVal(params.phase)

    switch (signalType) {
      case "sine":
        return `x(t) = ${A} · sin(${w}t + ${p})`
      case "cosine":
        return `x(t) = ${A} · cos(${w}t + ${p})`
      case "step":
        return `x(t) = ${A} · u(t)`
      case "ramp":
        return `x(t) = ${A} · t · u(t)`
      case "exp":
        return `x(t) = ${A} · e^t`
      case "square":
        return `x(t) = ${A} · square(${w}t + ${p})`
    }
  }, [signalType, params.baseAmplitude, params.omega, params.phase])

  const transformSubstitution = useMemo(() => {
    const signedA = params.timeReversal ? -params.timeScale : params.timeScale
    return `A_out = ${formatVal(params.outputScale)}, a = ${formatVal(signedA)}, t0 = ${formatVal(params.shift)}`
  }, [params.outputScale, params.timeScale, params.timeReversal, params.shift])

  const explanation = useMemo(
    () => getExplanation(params, signalType),
    [params, signalType]
  )

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

  const originalStats = useMemo(
    () => computeSignalStats(data, "original"),
    [data]
  )
  const transformedStats = useMemo(
    () => computeSignalStats(data, "transformed"),
    [data]
  )

  const frequencySpectrum = useMemo(
    () => computeFrequencySpectrum(data, "transformed"),
    [data]
  )
  const evenOddData = useMemo(() => {
    const dec = computeEvenOddDecomposition(data, "transformed")
    return data.map((d, i) => ({ t: d.t, even: dec.even[i], odd: dec.odd[i] }))
  }, [data])

  const updateParam = useCallback(
    <K extends keyof SignalParams>(key: K, value: SignalParams[K]) => {
      setParams((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const openRangeSettings = useCallback(() => {
    setRangeDraft(ranges)
    setRangeModalOpen(true)
  }, [ranges])

  const updateRangeDraft = useCallback(
    (key: RangeKey, bound: "min" | "max", value: number) => {
      setRangeDraft((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [bound]: Number.isFinite(value) ? value : prev[key][bound],
        },
      }))
    },
    []
  )

  const applyRangeSettings = useCallback(() => {
    const keys = Object.keys(rangeDraft) as RangeKey[]
    for (const key of keys) {
      const r = rangeDraft[key]
      if (
        !Number.isFinite(r.min) ||
        !Number.isFinite(r.max) ||
        r.min >= r.max
      ) {
        toast.error("Invalid range for " + key + ". Min must be less than max.")
        return
      }
    }

    setRanges(rangeDraft)

    setParams((prev) => ({
      ...prev,
      baseAmplitude: clamp(
        prev.baseAmplitude,
        rangeDraft.baseAmplitude.min,
        rangeDraft.baseAmplitude.max
      ),
      omega: clamp(prev.omega, rangeDraft.omega.min, rangeDraft.omega.max),
      phase: clamp(prev.phase, rangeDraft.phase.min, rangeDraft.phase.max),
      shift: clamp(prev.shift, rangeDraft.shift.min, rangeDraft.shift.max),
      timeScale: clamp(
        prev.timeScale,
        rangeDraft.timeScale.min,
        rangeDraft.timeScale.max
      ),
      outputScale: clamp(
        prev.outputScale,
        rangeDraft.outputScale.min,
        rangeDraft.outputScale.max
      ),
    }))

    toast.success("Parameter limits updated")
    setRangeModalOpen(false)
  }, [rangeDraft])

  const resetAll = useCallback(() => {
    setParams((prev) => ({
      ...defaults,
      minTime: prev.minTime,
      maxTime: prev.maxTime,
      step: prev.step,
    }))
    setSignalType("sine")
    setEquationMode("parametric")
    setManualExpression("0")
    setShowConvolutionPreview(false)
    setConvGain(1)
    setConvDecay(0.65)
    setChartLayout("overlay")
    setShowOriginal(true)
    setShowTransformed(true)
    setIsPlaying(false)
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
    if (!isPlaying) return

    let animId = 0
    let lastTime = 0

    const periodic =
      signalType === "sine" ||
      signalType === "cosine" ||
      signalType === "square"

    const loop = (time: number) => {
      if (!lastTime) lastTime = time
      const dt = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time

      setParams((prev) => {
        if (periodic) {
          if (prev.omega === 0) return prev

          let nextPhase = prev.phase + prev.omega * dt
          while (nextPhase > Math.PI) nextPhase -= 2 * Math.PI
          while (nextPhase < -Math.PI) nextPhase += 2 * Math.PI

          return { ...prev, phase: nextPhase }
        }

        const minShift = ranges.shift.min
        const maxShift = ranges.shift.max
        const span = Math.max(0.001, maxShift - minShift)

        let nextShift = prev.shift + span * 0.35 * dt
        if (nextShift > maxShift) {
          nextShift = minShift + (nextShift - maxShift)
        }

        return { ...prev, shift: nextShift }
      })

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [isPlaying, signalType, ranges.shift.min, ranges.shift.max])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (isTypingTarget(event.target)) return

      const key = event.key.toLowerCase()

      if (key === " ") {
        event.preventDefault()
        setIsPlaying((p) => {
          const next = !p
          toast.info(next ? "Animation playing" : "Animation paused")
          return next
        })
        return
      }

      if (key === "o") {
        event.preventDefault()
        setChartLayout((prev) => {
          const next = prev === "split" ? "overlay" : "split"
          toast.info(`Switched to ${next} view`)
          return next
        })
        return
      }

      if (key === "?") {
        event.preventDefault()
        setShowShortcuts(true)
        return
      }

      if (key === "r") {
        event.preventDefault()
        setResetOpen(true)
        return
      }

      if (key === "c") {
        event.preventDefault()
        copyEquation()
        return
      }

      if (key === "k") {
        event.preventDefault()
        setControlsOpen((prev) => !prev)
      }

      if (key === "l") {
        event.preventDefault()
        openRangeSettings()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [copyEquation, openRangeSettings])

  const generatorPanel = (
    <div className="space-y-4">
      <div>
        <InfoLabel
          label="Signal type"
          tip="Choose x(t). This is the base waveform before transformations."
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
        tip="Amplitude of x(t)."
        value={params.baseAmplitude}
        min={ranges.baseAmplitude.min}
        max={ranges.baseAmplitude.max}
        step={0.1}
        onChange={(v) => updateParam("baseAmplitude", v)}
      />
      <ParamSlider
        label="Omega (ω)"
        tip="Angular frequency in rad/s."
        value={params.omega}
        min={ranges.omega.min}
        max={ranges.omega.max}
        step={0.1}
        onChange={(v) => updateParam("omega", v)}
      />
      <ParamSlider
        label="Phase (φ)"
        tip="Phase shift in radians."
        value={params.phase}
        min={ranges.phase.min}
        max={ranges.phase.max}
        step={0.1}
        onChange={(v) => updateParam("phase", v)}
      />
    </div>
  )

  const transformPanel = (
    <div className="space-y-4">
      <ParamSlider
        label="Time Shift (t0)"
        tip="Positive values delay the signal."
        value={params.shift}
        min={ranges.shift.min}
        max={ranges.shift.max}
        step={0.1}
        onChange={(v) => updateParam("shift", v)}
      />
      <ParamSlider
        label="Time Scale (a)"
        tip="a > 1 compresses, 0 < a < 1 expands."
        value={params.timeScale}
        min={ranges.timeScale.min}
        max={ranges.timeScale.max}
        step={0.1}
        onChange={(v) => updateParam("timeScale", v)}
      />
      <ParamSlider
        label="Output Scale (A_out)"
        tip="Scales final y(t)."
        value={params.outputScale}
        min={ranges.outputScale.min}
        max={ranges.outputScale.max}
        step={0.1}
        onChange={(v) => updateParam("outputScale", v)}
      />

      <Separator className="opacity-50" />

      <div className="flex items-center justify-between">
        <InfoLabel
          label="Time Reversal"
          tip="Mirrors around t = 0 by replacing t with -t."
        />
        <Switch
          checked={params.timeReversal}
          onCheckedChange={(checked) => {
            updateParam("timeReversal", checked)
            toast.info(
              checked ? "Time reversal enabled" : "Time reversal disabled"
            )
          }}
        />
      </div>
    </div>
  )

  const samplingPanel = (
    <div className="space-y-3">
      <ParamInput
        label="Min time"
        tip="Left boundary of time axis."
        value={params.minTime}
        onChange={(v) => updateParam("minTime", v)}
      />
      <ParamInput
        label="Max time"
        tip="Right boundary of time axis."
        value={params.maxTime}
        onChange={(v) => updateParam("maxTime", v)}
      />
      <ParamInput
        label="Step (dt)"
        tip="Smaller is smoother but heavier."
        value={params.step}
        onChange={(v) => updateParam("step", Math.max(0.001, Math.abs(v)))}
      />
    </div>
  )

  const convolutionPanel = (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Preview convolution y(t) = x(t) * h(t) with causal exponential impulse
        response.
      </p>

      <ParamSlider
        label="Impulse Gain (K)"
        tip="Amplitude of impulse response h(t)."
        value={convGain}
        min={0.1}
        max={3}
        step={0.05}
        onChange={setConvGain}
      />

      <ParamSlider
        label="Impulse Decay (alpha)"
        tip="Higher values decay faster."
        value={convDecay}
        min={0.05}
        max={2.5}
        step={0.05}
        onChange={setConvDecay}
      />

      <div className="flex items-center justify-between">
        <InfoLabel
          label="Enable convolution"
          tip="Transformed graph shows convolution output."
        />
        <Switch
          checked={showConvolutionPreview}
          onCheckedChange={(checked) => {
            if (checked && equationMode === "manual") {
              setEquationMode("parametric")
              toast.info(
                "Manual mode disabled while convolution preview is active"
              )
            }
            setShowConvolutionPreview(checked)
            toast.info(
              checked
                ? "Convolution preview enabled"
                : "Convolution preview disabled"
            )
          }}
        />
      </div>

      {showConvolutionPreview && convolutionStats ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground"
        >
          <p>
            Peak: {convolutionStats.peakValue} at t ={" "}
            {convolutionStats.peakTime}
          </p>
          <p>At t ≈ 0: {convolutionStats.atZero}</p>
        </motion.div>
      ) : null}

      {showConvolutionPreview && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            setShowConvolutionAnimator((p) => !p)
            if (!showConvolutionAnimator) {
              setChartLayout("split")
            }
          }}
        >
          {showConvolutionAnimator
            ? "Hide Math Animation"
            : "Show Math Animation"}
        </Button>
      )}
    </div>
  )

  const leftSidebar = (
    <div className="space-y-3">
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Signal Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">{generatorPanel}</CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Transformations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">{transformPanel}</CardContent>
      </Card>
    </div>
  )

  const rightSidebar = (
    <div className="space-y-3">
      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Equation Builder
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
              <TabsTrigger value="parametric" className="text-xs">
                Parametric
              </TabsTrigger>
              <TabsTrigger value="manual" className="text-xs">
                Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="parametric" className="space-y-2 pt-2">
              <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
                <p className="mb-1 text-[10px] tracking-wide text-muted-foreground uppercase">
                  Model
                </p>
                <p className="font-mono text-xs">{modelEquation}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/30 p-2.5">
                <p className="mb-1 text-[10px] tracking-wide text-muted-foreground uppercase">
                  Base Signal
                </p>
                <p className="font-mono text-xs">{baseSignalEquation}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/40 p-2.5">
                <p className="mb-1 text-[10px] tracking-wide text-muted-foreground uppercase">
                  Current Parameters
                </p>
                <p className="font-mono text-xs">{transformSubstitution}</p>
              </div>
              <div className="rounded-md border border-border/60 bg-primary/5 p-2.5">
                <p className="mb-1 text-[10px] tracking-wide text-muted-foreground uppercase">
                  Evaluated y(t)
                </p>
                <p className="font-mono text-xs">{equation}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full text-xs"
                onClick={copyEquation}
              >
                <Copy className="mr-1 size-3" />
                Copy equation
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-2 pt-2">
              <Textarea
                value={manualExpression}
                onChange={(event) => setManualExpression(event.target.value)}
                placeholder="Example: 2*sin(3*(t-1))"
                className="min-h-16 font-mono text-xs"
              />

              <div className="flex flex-wrap gap-1">
                {manualExamples.map((expr) => (
                  <Button
                    key={expr}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => {
                      setManualExpression(expr)
                      toast.info("Expression inserted")
                    }}
                  >
                    {expr}
                  </Button>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground">
                Functions: sin, cos, tan, exp, log, ln, sqrt, abs, floor, ceil,
                round, sign, min, max, pi, e
              </p>

              <p
                className={
                  manualCompile.ok
                    ? "text-[10px] text-primary"
                    : "text-[10px] text-destructive"
                }
              >
                {manualCompile.ok
                  ? "Valid expression applied"
                  : manualCompile.error}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 flex-1 text-xs"
                  onClick={validateManualEquation}
                >
                  Validate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={copyEquation}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Concept Insight
          </CardTitle>
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
            <Badge variant="secondary" className="text-[10px]">
              {signalType}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              a = {params.timeScale.toFixed(2)}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              t0 = {params.shift.toFixed(2)}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              A_out = {params.outputScale.toFixed(2)}
            </Badge>
            {params.timeReversal && (
              <Badge variant="destructive" className="text-[10px]">
                Reversed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <CollapsibleSection
        title="Advanced Settings"
        icon={<Settings2 className="size-3.5 text-muted-foreground" />}
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Sampling
            </p>
            {samplingPanel}
          </div>
          <Separator className="opacity-40" />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Parameter Ranges
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px]"
                onClick={openRangeSettings}
              >
                Configure
              </Button>
            </div>
          </div>
          <Separator className="opacity-40" />
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Convolution Preview
            </p>
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

  const chartArea = (
    <div className="space-y-3">
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
              {showOriginal ? (
                <Eye className="mr-1 size-3" />
              ) : (
                <EyeOff className="mr-1 size-3" />
              )}
              x(t)
            </Button>
            <Button
              variant={showTransformed ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setShowTransformed((p) => !p)
                toast.info(
                  !showTransformed ? "Transformed shown" : "Transformed hidden"
                )
              }}
            >
              {showTransformed ? (
                <Eye className="mr-1 size-3" />
              ) : (
                <EyeOff className="mr-1 size-3" />
              )}
              y(t)
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showConvolutionAnimator && showConvolutionPreview ? (
          <motion.div
            key="convolution-animator"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ConvolutionAnimator
              baseData={baseData}
              gain={convGain}
              decay={convDecay}
            />
          </motion.div>
        ) : chartLayout === "overlay" ? (
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
              fileName="signal-comparison-overlay.png"
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
                title={
                  showConvolutionPreview
                    ? "Convolution y(t) = x(t) * h(t)"
                    : "Transformed Signal y(t)"
                }
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

      <CollapsibleSection
        title="Signal Analytics and Advanced Views"
        icon={<Activity className="size-4 text-primary" />}
      >
        <div className="space-y-4">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stats" className="text-xs">
                Statistics
              </TabsTrigger>
              <TabsTrigger value="spectrum" className="text-xs">
                Frequency Spectrum
              </TabsTrigger>
              <TabsTrigger value="evenodd" className="text-xs">
                Even/Odd
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="stats"
              className="mt-4 grid gap-4 sm:grid-cols-2"
            >
              <SignalStatsPanel stats={originalStats} label="Original x(t)" />
              <SignalStatsPanel
                stats={transformedStats}
                label={
                  showConvolutionPreview
                    ? "Convolution y(t)"
                    : "Transformed y(t)"
                }
              />
            </TabsContent>
            <TabsContent value="spectrum" className="mt-4">
              <SpectrumChart
                bins={frequencySpectrum}
                title={
                  showConvolutionPreview
                    ? "Spectrum of y(t) = x(t)*h(t)"
                    : "Spectrum of y(t)"
                }
              />
            </TabsContent>
            <TabsContent value="evenodd" className="mt-4">
              <EvenOddChart data={evenOddData} />
            </TabsContent>
          </Tabs>
        </div>
      </CollapsibleSection>

      <p className="text-center text-[10px] tracking-wide text-muted-foreground/60">
        Space play · R reset · O overlay/split · L limits · ? shortcuts
      </p>
    </div>
  )

  return (
    <>
      <main className="mx-auto w-full max-w-[1400px] px-4 py-4 pb-24 sm:px-6 lg:pb-6">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="h-8 px-2">
              <Link href="/">
                <ArrowLeft className="size-3.5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight sm:text-lg">
                  PlotWaves
                </h1>
                <Badge variant="outline" className="text-[10px]">
                  V1
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={openRangeSettings}
            >
              <Settings2 className="mr-1 size-3.5" />
              Limits
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowShortcuts(true)}
            >
              ?
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-12">
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
            className="hidden lg:col-span-3 lg:block"
          >
            {leftSidebar}
          </motion.aside>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1], delay: 0.05 }}
            className="lg:col-span-6"
          >
            {chartArea}
          </motion.section>

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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-2.5">
          <Sheet open={isControlsOpen} onOpenChange={setControlsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <PanelRight className="mr-1 size-3.5" />
                Controls
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              showCloseButton={false}
              className="h-[92dvh] max-h-[92dvh] overflow-hidden p-0"
            >
              <SheetHeader className="border-b border-border/60 bg-background/95 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <SheetTitle>Lab Controls</SheetTitle>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                    >
                      Close
                    </Button>
                  </SheetClose>
                </div>
              </SheetHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
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

          <Button variant="outline" size="sm" onClick={openRangeSettings}>
            <Settings2 className="size-3.5" />
          </Button>

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

      <AlertDialog open={isRangeModalOpen} onOpenChange={setRangeModalOpen}>
        <AlertDialogContent className="w-[calc(100vw-0.75rem)] max-w-3xl overflow-hidden p-0 sm:w-full">
          <div className="flex max-h-[92dvh] flex-col">
            <AlertDialogHeader className="shrink-0 border-b border-border/60 px-4 py-3 sm:px-5 sm:py-4">
              <AlertDialogTitle>Parameter Limits</AlertDialogTitle>
              <AlertDialogDescription>
                Set min and max values for base and transformation controls.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-md border border-border/60 p-3">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Base Parameters
                  </p>
                  <div className="grid grid-cols-[1fr,92px,92px] gap-2 text-[10px] text-muted-foreground">
                    <span />
                    <span>Min</span>
                    <span>Max</span>
                  </div>

                  <RangeRow
                    label="Base Amplitude"
                    min={rangeDraft.baseAmplitude.min}
                    max={rangeDraft.baseAmplitude.max}
                    onMinChange={(v) =>
                      updateRangeDraft("baseAmplitude", "min", v)
                    }
                    onMaxChange={(v) =>
                      updateRangeDraft("baseAmplitude", "max", v)
                    }
                  />
                  <RangeRow
                    label="Omega"
                    min={rangeDraft.omega.min}
                    max={rangeDraft.omega.max}
                    onMinChange={(v) => updateRangeDraft("omega", "min", v)}
                    onMaxChange={(v) => updateRangeDraft("omega", "max", v)}
                  />
                  <RangeRow
                    label="Phase"
                    min={rangeDraft.phase.min}
                    max={rangeDraft.phase.max}
                    onMinChange={(v) => updateRangeDraft("phase", "min", v)}
                    onMaxChange={(v) => updateRangeDraft("phase", "max", v)}
                  />
                </div>

                <div className="space-y-3 rounded-md border border-border/60 p-3">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Transform Parameters
                  </p>
                  <div className="grid grid-cols-[1fr,92px,92px] gap-2 text-[10px] text-muted-foreground">
                    <span />
                    <span>Min</span>
                    <span>Max</span>
                  </div>

                  <RangeRow
                    label="Time Shift (t0)"
                    min={rangeDraft.shift.min}
                    max={rangeDraft.shift.max}
                    onMinChange={(v) => updateRangeDraft("shift", "min", v)}
                    onMaxChange={(v) => updateRangeDraft("shift", "max", v)}
                  />
                  <RangeRow
                    label="Time Scale (a)"
                    min={rangeDraft.timeScale.min}
                    max={rangeDraft.timeScale.max}
                    onMinChange={(v) => updateRangeDraft("timeScale", "min", v)}
                    onMaxChange={(v) => updateRangeDraft("timeScale", "max", v)}
                  />
                  <RangeRow
                    label="Output Scale (A_out)"
                    min={rangeDraft.outputScale.min}
                    max={rangeDraft.outputScale.max}
                    onMinChange={(v) =>
                      updateRangeDraft("outputScale", "min", v)
                    }
                    onMaxChange={(v) =>
                      updateRangeDraft("outputScale", "max", v)
                    }
                  />
                </div>
              </div>
            </div>

            <AlertDialogFooter className="mx-0 mt-0 mb-0 shrink-0 rounded-none border-t border-border/60 bg-background/95 px-4 py-3 sm:px-5">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => {
                  setRangeDraft(defaultRanges)
                  toast.info("Limits reset to defaults")
                }}
              >
                Reset Limits
              </Button>
              <AlertDialogAction onClick={applyRangeSettings}>
                Apply Limits
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keyboard Shortcuts</AlertDialogTitle>
            <AlertDialogDescription>
              Quick controls for faster lab workflow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Space: Play or pause animation</p>
            <p>R: Reset workspace</p>
            <p>C: Copy equation</p>
            <p>O: Toggle overlay or split mode</p>
            <p>K: Open mobile controls</p>
            <p>L: Open parameter limits modal</p>
            <p>?: Show this shortcuts dialog</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowShortcuts(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isResetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all controls?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore all signal parameters, transformations, and view
              settings.
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
