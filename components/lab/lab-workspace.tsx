"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, CircleHelp, Copy, PanelRight, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { ThemeToggle } from "@/components/theme-toggle"
import { SignalChart } from "@/components/lab/signal-chart"
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { SignalParams, SignalType } from "@/types/signal"
import { sampleSignal } from "@/lib/services/signal/sample-signal"
import { formatEquation } from "@/lib/services/equation/format-equation"
import { getExplanation } from "@/lib/services/explanation/get-explanation"
import { compileManualEquation } from "@/lib/services/equation/manual-evaluator"

type EquationMode = "parametric" | "manual"

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

export function LabWorkspace() {
  const [signalType, setSignalType] = useState<SignalType>("sine")
  const [params, setParams] = useState<SignalParams>(defaults)
  const [isResetOpen, setResetOpen] = useState(false)
  const [isControlsOpen, setControlsOpen] = useState(false)

  const [equationMode, setEquationMode] = useState<EquationMode>("parametric")
  const [manualExpression, setManualExpression] = useState("0")

  const baseData = useMemo(() => sampleSignal(signalType, params), [signalType, params])
  const manualCompile = useMemo(() => compileManualEquation(manualExpression), [manualExpression])

  const data = useMemo(() => {
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

  const equation = useMemo(() => {
    if (equationMode === "manual") {
      return "y(t) = " + (manualExpression.trim() || "0")
    }
    return formatEquation(signalType, params)
  }, [equationMode, manualExpression, signalType, params])

  const explanation = useMemo(() => getExplanation(params), [params])

  function updateParam<K extends keyof SignalParams>(key: K, value: SignalParams[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  function resetAll() {
    setParams(defaults)
    setSignalType("sine")
    setEquationMode("parametric")
    setManualExpression("0")
    toast.success("Workspace reset to defaults")
  }

  function copyEquation() {
    navigator.clipboard.writeText(equation)
    toast.success("Equation copied")
  }

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
  }, [equation])

  const generatorPanel = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Signal Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <InfoLabel
            label="Signal type"
            tip="Select the base signal family used for x(t). This drives the shape before transformation."
          />
          <Select
            value={signalType}
            onValueChange={(v: SignalType) => {
              setSignalType(v)
              toast.info("Signal changed to " + v)
            }}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sine">Sine</SelectItem>
              <SelectItem value="cosine">Cosine</SelectItem>
              <SelectItem value="step">Step</SelectItem>
              <SelectItem value="ramp">Ramp</SelectItem>
              <SelectItem value="exp">Exponential</SelectItem>
              <SelectItem value="square">Square</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ParamSlider
          label="Base Amplitude"
          tip="Amplitude of the original signal x(t)."
          value={params.baseAmplitude}
          min={0}
          max={5}
          step={0.1}
          onChange={(v) => updateParam("baseAmplitude", v)}
        />
        <ParamSlider
          label="Omega"
          tip="Angular frequency omega in rad/s. Larger values increase oscillation rate."
          value={params.omega}
          min={0.1}
          max={10}
          step={0.1}
          onChange={(v) => updateParam("omega", v)}
        />
        <ParamSlider
          label="Phase"
          tip="Phase offset phi in radians."
          value={params.phase}
          min={-6.28}
          max={6.28}
          step={0.1}
          onChange={(v) => updateParam("phase", v)}
        />
      </CardContent>
    </Card>
  )

  const samplingPanel = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sampling</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
          label="Step"
          tip="Time resolution delta t used to sample points."
          value={params.step}
          onChange={(v) => updateParam("step", Math.max(0.01, v))}
        />
      </CardContent>
    </Card>
  )

  const transformPanel = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Transformations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ParamSlider
          label="Shift t0"
          tip="Time shift inside x(a(t - t0)). Positive moves the signal right."
          value={params.shift}
          min={-5}
          max={5}
          step={0.1}
          onChange={(v) => updateParam("shift", v)}
        />
        <ParamSlider
          label="Time scale a"
          tip="Controls compression or expansion in time."
          value={params.timeScale}
          min={0.1}
          max={4}
          step={0.1}
          onChange={(v) => updateParam("timeScale", v)}
        />
        <ParamSlider
          label="Output scale Aout"
          tip="Scales transformed amplitude y(t)."
          value={params.outputScale}
          min={0}
          max={4}
          step={0.1}
          onChange={(v) => updateParam("outputScale", v)}
        />

        <Separator />

        <div className="flex items-center justify-between">
          <InfoLabel
            label="Time reversal"
            tip="Mirrors the signal around t = 0 by replacing t with -t."
          />
          <Switch
            checked={params.timeReversal}
            onCheckedChange={(checked) => {
              updateParam("timeReversal", checked)
              toast.info(checked ? "Time reversal enabled" : "Time reversal disabled")
            }}
          />
        </div>
      </CardContent>
    </Card>
  )

  const explanationPanel = (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Concept Explanation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {explanation.map((line) => (
          <p key={line} className="text-sm text-muted-foreground">
            {line}
          </p>
        ))}
      </CardContent>
    </Card>
  )

  return (
    <TooltipProvider delayDuration={120}>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:pb-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="size-4" />
                Home
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Signal Systems Lab</h1>
              <p className="text-sm text-muted-foreground">V1 Interactive Workspace</p>
            </div>
            <Badge variant="secondary">V1</Badge>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid gap-4 lg:grid-cols-12">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="hidden space-y-4 lg:col-span-3 lg:block"
          >
            {generatorPanel}
            {samplingPanel}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.04 }}
            className="space-y-4 lg:col-span-6"
          >
            <div className="grid grid-cols-1 gap-4">
              <SignalChart
                data={data}
                title="Original Signal x(t)"
                subtitle="Base signal before transformations"
                seriesKey="original"
                stroke="var(--foreground)"
                fileName="original-signal.png"
              />
              <SignalChart
                data={data}
                title="Transformed Signal y(t)"
                subtitle="Result after shift, scale, and reversal"
                seriesKey="transformed"
                stroke="var(--destructive)"
                fileName="transformed-signal.png"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <InfoLabel
                    label="Equation"
                    tip="Current mathematical form generated from control settings."
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tabs
                  value={equationMode}
                  onValueChange={(value) => {
                    const next = value as EquationMode
                    setEquationMode(next)
                    toast.info(
                      next === "manual"
                        ? "Manual equation mode enabled"
                        : "Parametric equation mode enabled"
                    )
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="parametric">Parametric</TabsTrigger>
                    <TabsTrigger value="manual">Manual</TabsTrigger>
                  </TabsList>

                  <TabsContent value="parametric" className="space-y-3 pt-2">
                    <p className="rounded-md border border-border bg-muted/40 p-3 text-sm">{equation}</p>
                    <div className="flex flex-wrap gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" onClick={copyEquation}>
                            <Copy className="size-4" />
                            Copy equation
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Shortcut: C</TooltipContent>
                      </Tooltip>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-3 pt-2">
                    <InfoLabel
                      label="Manual expression y(t)"
                      tip="Use variable t. Example: 2*sin(3*(t-1)). Use explicit multiplication like 2*t."
                    />
                    <Textarea
                      value={manualExpression}
                      onChange={(event) => setManualExpression(event.target.value)}
                      placeholder="Example: 2*sin(3*(t-1))"
                      className="min-h-24 font-mono text-sm"
                    />

                    <p className="text-xs text-muted-foreground">
                      Supported: sin, cos, tan, exp, log, ln, sqrt, abs, floor, ceil, round, sign, min,
                      max, pi, e, operators + - * / ^.
                    </p>

                    <p className={manualCompile.ok ? "text-xs text-primary" : "text-xs text-destructive"}>
                      {manualCompile.ok
                        ? "Expression valid. Transformed graph now uses manual y(t)."
                        : manualCompile.error}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={validateManualEquation}>
                        Validate expression
                      </Button>
                      <Button variant="outline" onClick={copyEquation}>
                        <Copy className="size-4" />
                        Copy equation
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Shortcuts: C copy, R reset, K controls
                </Button>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: "easeOut", delay: 0.08 }}
            className="hidden space-y-4 lg:col-span-3 lg:block"
          >
            {transformPanel}
            {explanationPanel}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" className="w-full" onClick={() => setResetOpen(true)}>
                  <RotateCcw className="size-4" />
                  Reset workspace
                </Button>
              </TooltipTrigger>
              <TooltipContent>Shortcut: R</TooltipContent>
            </Tooltip>
          </motion.section>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-3">
            <Sheet open={isControlsOpen} onOpenChange={setControlsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <PanelRight className="size-4" />
                  Controls
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Lab Controls</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {generatorPanel}
                  {samplingPanel}
                  {transformPanel}
                  {explanationPanel}
                  <Button variant="destructive" className="w-full" onClick={() => setResetOpen(true)}>
                    <RotateCcw className="size-4" />
                    Reset workspace
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="outline" onClick={copyEquation}>
              <Copy className="size-4" />
              Copy
            </Button>

            <Button variant="destructive" onClick={() => setResetOpen(true)}>
              <RotateCcw className="size-4" />
              Reset
            </Button>
          </div>
        </div>

        <AlertDialog open={isResetOpen} onOpenChange={setResetOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all controls?</AlertDialogTitle>
              <AlertDialogDescription>
                This will restore signal and transformation settings to default values.
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
      </main>
    </TooltipProvider>
  )
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
        <span className="text-xs text-muted-foreground">{value.toFixed(2)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0] ?? value)} />
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
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}