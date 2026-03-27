"use client"

import Link from "next/link"
import { useMemo, useState, type ComponentType } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpen,
  Filter,
  Gauge,
  HeartPulse,
  Layers,
  Radio,
  Search,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react"

import type { SignalType } from "@/types/signal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type PresetLevel = "Starter" | "Intermediate" | "Advanced"

type LabPresetQuery = {
  type: SignalType
  w?: number
  A?: number
  shift?: number
  scale?: number
  rev?: boolean
  step?: number
  conv?: boolean
  gain?: number
  decay?: number
}

type Preset = {
  id: string
  name: string
  description: string
  realWorld: string
  level: PresetLevel
  tags: string[]
  featured?: boolean
  query: LabPresetQuery
}

type PresetGroup = {
  id: string
  title: string
  subtitle: string
  icon: ComponentType<{ className?: string }>
  presets: Preset[]
}

const PRESET_GROUPS: PresetGroup[] = [
  {
    id: "core",
    title: "Core Classroom Essentials",
    subtitle: "Most used starter graphs for quick teaching demos.",
    icon: BookOpen,
    presets: [
      {
        id: "core-standard-sine",
        name: "Standard Sine",
        description: "Clean baseline periodic signal.",
        realWorld: "AC waveform and vibration fundamentals.",
        level: "Starter",
        tags: ["periodic", "foundation"],
        featured: true,
        query: { type: "sine", w: 2, A: 1, shift: 0, scale: 1 },
      },
      {
        id: "core-time-delay",
        name: "Delayed Sine",
        description: "Right shift with same frequency and amplitude.",
        realWorld: "Propagation delay in cables and channels.",
        level: "Starter",
        tags: ["shift", "delay"],
        featured: true,
        query: { type: "sine", w: 2, A: 1, shift: 2, scale: 1 },
      },
      {
        id: "core-compression",
        name: "Time Compression",
        description: "Signal compressed by scale factor a > 1.",
        realWorld: "Faster event timeline in rotating machinery.",
        level: "Starter",
        tags: ["time-scale", "compression"],
        query: { type: "cosine", w: 2, A: 1, scale: 2, shift: 0 },
      },
      {
        id: "core-expansion",
        name: "Time Expansion",
        description: "Signal expanded by scale factor 0 < a < 1.",
        realWorld: "Slow dynamics in thermal and chemical systems.",
        level: "Starter",
        tags: ["time-scale", "expansion"],
        query: { type: "cosine", w: 2, A: 1, scale: 0.5, shift: 0 },
      },
    ],
  },
  {
    id: "comms",
    title: "Communication Systems",
    subtitle: "Wireless and digital communication style profiles.",
    icon: Radio,
    presets: [
      {
        id: "comms-carrier",
        name: "Carrier Tone",
        description: "High frequency sinusoidal carrier profile.",
        realWorld: "RF carrier in analog and digital communication.",
        level: "Intermediate",
        tags: ["carrier", "rf"],
        featured: true,
        query: { type: "sine", w: 9, A: 1.2, shift: 0, scale: 1 },
      },
      {
        id: "comms-multipath",
        name: "Multipath Delay",
        description: "Delayed copy to mimic reflected paths.",
        realWorld: "Urban multipath fading in mobile networks.",
        level: "Intermediate",
        tags: ["delay", "wireless"],
        query: { type: "sine", w: 6, A: 1, shift: 1.8, scale: 1 },
      },
      {
        id: "comms-doppler",
        name: "Doppler Compression",
        description: "Compressed received waveform profile.",
        realWorld: "Relative motion between radar and target.",
        level: "Advanced",
        tags: ["doppler", "radar"],
        query: { type: "cosine", w: 5, A: 1, scale: 1.7, shift: 0.4 },
      },
      {
        id: "comms-bitclock",
        name: "Bit Clock Square Wave",
        description: "Fast edge transitions with small offset.",
        realWorld: "Clock and timing recovery in digital links.",
        level: "Intermediate",
        tags: ["square", "digital"],
        query: { type: "square", w: 8, A: 1, shift: 0.2, scale: 1 },
      },
    ],
  },
  {
    id: "audio",
    title: "Audio and Acoustic",
    subtitle: "Most used transformations for sound behavior.",
    icon: AudioLines,
    presets: [
      {
        id: "audio-echo",
        name: "Room Echo Delay",
        description: "Delayed waveform useful for echo intuition.",
        realWorld: "Speech reflections in halls and rooms.",
        level: "Starter",
        tags: ["echo", "acoustics"],
        featured: true,
        query: { type: "sine", w: 4, A: 1, shift: 2, scale: 1 },
      },
      {
        id: "audio-vibrato",
        name: "Vibrato Style Stretch",
        description: "Slight expansion for perceived low rate wobble.",
        realWorld: "Pitch and modulation effects in music.",
        level: "Intermediate",
        tags: ["music", "modulation"],
        query: { type: "sine", w: 7, A: 1, scale: 0.85, shift: 0 },
      },
      {
        id: "audio-envelope",
        name: "Slow Envelope Motion",
        description: "Low frequency modulation profile.",
        realWorld: "Amplitude envelope behavior in voice signals.",
        level: "Intermediate",
        tags: ["envelope", "voice"],
        query: { type: "cosine", w: 2, A: 1.4, scale: 0.7, shift: 0 },
      },
    ],
  },
  {
    id: "power",
    title: "Power and Energy",
    subtitle: "Practical waveforms from electrical systems.",
    icon: Zap,
    presets: [
      {
        id: "power-mains",
        name: "Mains Sine (Normalized)",
        description: "Power line style sinusoidal signal.",
        realWorld: "Grid and inverter output analysis.",
        level: "Starter",
        tags: ["mains", "ac"],
        featured: true,
        query: { type: "sine", w: 6.28, A: 1, shift: 0, scale: 1 },
      },
      {
        id: "power-ripple",
        name: "Rectifier Ripple Approx",
        description: "Pulse-like ripple profile under load.",
        realWorld: "DC output ripple after rectification.",
        level: "Intermediate",
        tags: ["ripple", "rectifier"],
        query: { type: "square", w: 6, A: 0.8, shift: 0, scale: 1.2 },
      },
      {
        id: "power-switching",
        name: "Switching Stress",
        description: "Fast switching style waveform.",
        realWorld: "SMPS and PWM converter switching behavior.",
        level: "Advanced",
        tags: ["smps", "switching"],
        query: { type: "square", w: 10, A: 1.1, shift: 0.3, scale: 1 },
      },
    ],
  },
  {
    id: "control",
    title: "Control and Mechatronics",
    subtitle: "Canonical response shapes for systems labs.",
    icon: Gauge,
    presets: [
      {
        id: "control-step-delay",
        name: "Delayed Step Response",
        description: "Step with transport delay.",
        realWorld: "Actuator dead-time and process delay.",
        level: "Starter",
        tags: ["step", "delay"],
        query: { type: "step", A: 1, shift: 1.5, scale: 1 },
      },
      {
        id: "control-ramp-command",
        name: "Ramp Command Profile",
        description: "Ramped reference with shift and scaling.",
        realWorld: "Motor speed and position trajectory planning.",
        level: "Starter",
        tags: ["ramp", "trajectory"],
        query: { type: "ramp", A: 0.8, shift: -0.8, scale: 0.9 },
      },
      {
        id: "control-saturation-stress",
        name: "Aggressive Ramp Stress",
        description: "Higher gain and compression stress case.",
        realWorld: "Controller saturation and transient testing.",
        level: "Advanced",
        tags: ["stress", "transient"],
        query: { type: "ramp", A: 1.5, shift: 0.4, scale: 1.4 },
      },
    ],
  },
  {
    id: "systems",
    title: "Convolution and System Response",
    subtitle: "Real-life impulse response style demos.",
    icon: Layers,
    presets: [
      {
        id: "sys-rc-filter",
        name: "RC Low Pass Response",
        description: "Square input with exponential impulse response.",
        realWorld: "RC circuit smoothing in sensor and power front-ends.",
        level: "Intermediate",
        tags: ["convolution", "rc"],
        featured: true,
        query: { type: "square", w: 2, A: 1, conv: true, gain: 1, decay: 0.8 },
      },
      {
        id: "sys-room-tail",
        name: "Acoustic Tail",
        description: "Sine input convolved with slow decay impulse.",
        realWorld: "Room reverberation and late reflections.",
        level: "Advanced",
        tags: ["convolution", "acoustic"],
        query: { type: "sine", w: 4, A: 1, conv: true, gain: 1.3, decay: 0.4 },
      },
      {
        id: "sys-thermal",
        name: "Thermal Smoothing",
        description: "Step input passed through slow first-order response.",
        realWorld: "Temperature sensors and thermal plant dynamics.",
        level: "Intermediate",
        tags: ["convolution", "thermal"],
        query: { type: "step", A: 1, conv: true, gain: 1, decay: 0.5 },
      },
    ],
  },
  {
    id: "biomedical",
    title: "Biomedical and Sensing",
    subtitle: "Common transformed traces used in instrumentation.",
    icon: HeartPulse,
    presets: [
      {
        id: "bio-baseline-wander",
        name: "Baseline Wander Toy",
        description: "Low-frequency drift behavior profile.",
        realWorld: "ECG baseline drift and sensor offset changes.",
        level: "Intermediate",
        tags: ["ecg", "drift"],
        query: { type: "sine", w: 0.8, A: 1.2, shift: 0.6, scale: 1 },
      },
      {
        id: "bio-respiration-like",
        name: "Respiration Like Wave",
        description: "Slow oscillatory waveform with shift.",
        realWorld: "Respiration and chest movement monitoring.",
        level: "Starter",
        tags: ["respiration", "monitoring"],
        query: { type: "cosine", w: 1.2, A: 1, shift: 0.4, scale: 1 },
      },
    ],
  },
]

const cardContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const cardItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0, 0, 0.2, 1] as const },
  },
}

function toQueryString(query: LabPresetQuery): string {
  const params = new URLSearchParams()
  const entries = Object.entries(query) as Array<
    [keyof LabPresetQuery, string | number | boolean | undefined]
  >

  for (const [key, value] of entries) {
    if (value === undefined) continue
    params.set(key, String(value))
  }

  return params.toString()
}

function summarizeQuery(query: LabPresetQuery): string[] {
  const items: string[] = ["type=" + query.type]

  if (typeof query.w === "number") items.push("omega=" + query.w)
  if (typeof query.A === "number") items.push("A=" + query.A)
  if (typeof query.shift === "number") items.push("shift=" + query.shift)
  if (typeof query.scale === "number") items.push("scale=" + query.scale)
  if (query.rev) items.push("reverse=true")
  if (typeof query.step === "number") items.push("dt=" + query.step)
  if (query.conv) {
    items.push("conv=true")
    if (typeof query.gain === "number") items.push("gain=" + query.gain)
    if (typeof query.decay === "number") items.push("decay=" + query.decay)
  }

  return items
}

function levelBadgeClass(level: PresetLevel): string {
  if (level === "Starter")
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (level === "Intermediate")
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
}

export default function PresetsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [groupFilter, setGroupFilter] = useState("all")
  const [featuredOnly, setFeaturedOnly] = useState(false)

  const allPresetsCount = useMemo(() => {
    return PRESET_GROUPS.reduce((acc, group) => acc + group.presets.length, 0)
  }, [])

  const featuredPresets = useMemo(() => {
    const all = PRESET_GROUPS.flatMap((group) =>
      group.presets.map((preset) => ({
        ...preset,
        groupId: group.id,
        groupTitle: group.title,
      }))
    )
    return all.filter((preset) => preset.featured).slice(0, 8)
  }, [])

  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredGroups = useMemo(() => {
    return PRESET_GROUPS.map((group) => {
      const matchesGroup = groupFilter === "all" || group.id === groupFilter

      const presets = group.presets.filter((preset) => {
        if (!matchesGroup) return false
        if (featuredOnly && !preset.featured) return false

        if (!normalizedSearch) return true

        const haystack = (
          preset.name +
          " " +
          preset.description +
          " " +
          preset.realWorld +
          " " +
          preset.tags.join(" ")
        ).toLowerCase()

        return haystack.includes(normalizedSearch)
      })

      return {
        ...group,
        presets,
      }
    }).filter((group) => group.presets.length > 0)
  }, [groupFilter, featuredOnly, normalizedSearch])

  const visibleCount = useMemo(() => {
    return filteredGroups.reduce((acc, group) => acc + group.presets.length, 0)
  }, [filteredGroups])

  return (
    <main className="relative min-h-screen overflow-hidden pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.68_0.18_25/0.12),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_100%,oklch(0.70_0.16_300/0.08),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-[0.04]" />

      <div className="relative mx-auto w-full max-w-6xl px-6 pt-10 sm:px-8 sm:pt-12">
        <header className="mb-10">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="inter h-9 px-3"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 size-3.5" />
                Back Home
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="inter h-9 px-3"
            >
              <Link href="/lab">Open Empty Lab</Link>
            </Button>
          </div>

          <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
            <CardContent className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1.35fr,1fr] md:gap-10">
              <div>
                <h1 className="space text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                  Presets for fast classroom and lab demos
                </h1>
                <p className="inter mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Curated, practical, and transformation-rich presets for
                  communication, audio, control, power, biomedical, and
                  convolution use cases.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <StatTile
                  label="Total Presets"
                  value={String(allPresetsCount)}
                  icon={Layers}
                />
                <StatTile
                  label="Featured"
                  value={String(featuredPresets.length)}
                  icon={Sparkles}
                />
                <StatTile
                  label="Categories"
                  value={String(PRESET_GROUPS.length)}
                  icon={Filter}
                />
                <StatTile
                  label="Visible Now"
                  value={String(visibleCount)}
                  icon={Waves}
                />
              </div>
            </CardContent>
          </Card>
        </header>


        <section className="mb-12">
          <div className="mb-5 flex items-center gap-2">
            <h2 className="space text-xl font-semibold sm:text-2xl md:text-3xl lg:text-4xl">
              Top Picks
            </h2>
          </div>

          <motion.div
            variants={cardContainer}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {featuredPresets.map((preset) => (
              <motion.div key={preset.id} variants={cardItem}>
                <PresetCard preset={preset} compact />
              </motion.div>
            ))}
          </motion.div>
        </section>

        <motion.div
          variants={cardContainer}
          initial="hidden"
          animate="show"
          className="space-y-12"
        >
          {filteredGroups.length === 0 ? (
            <Card className="border-border/60 bg-card/70">
              <CardContent className="p-10 text-center">
                <p className="inter text-sm text-muted-foreground">
                  No presets matched your current filters. Try clearing search
                  or selecting All Categories.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredGroups.map((group) => {
              const Icon = group.icon

              return (
                <motion.section key={group.id} variants={cardItem}>
                  <div className="mb-4 flex items-center justify-between border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      <h2 className="space text-xl font-semibold sm:text-2xl">
                        {group.title}
                      </h2>
                    </div>
                    <Badge variant="outline" className="inter">
                      {group.presets.length} presets
                    </Badge>
                  </div>

                  <p className="inter mb-5 text-sm text-muted-foreground">
                    {group.subtitle}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {group.presets.map((preset) => (
                      <PresetCard key={preset.id} preset={preset} />
                    ))}
                  </div>
                </motion.section>
              )
            })
          )}
        </motion.div>

        <section className="mt-14">
          <Card className="border-border/60 bg-card/70 shadow-sm backdrop-blur-xl">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
              <div>
                <p className="space text-lg font-semibold">
                  Need a custom scenario?
                </p>
                <p className="inter text-sm text-muted-foreground">
                  Open the lab and tune parameters manually, then share query
                  presets with your team.
                </p>
              </div>
              <Button asChild className="inter">
                <Link href="/lab">
                  Open Lab
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="border border-border/60 bg-background/70 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className="inter text-[11px]">{label}</span>
      </div>
      <p className="jet text-2xl leading-none font-semibold">{value}</p>
    </div>
  )
}

function PresetCard({
  preset,
  compact = false,
}: {
  preset: Preset
  compact?: boolean
}) {
  const href = "/lab?" + toQueryString(preset.query)
  const queryTags = summarizeQuery(preset.query)

  return (
    <Card className="group relative overflow-hidden border border-border/55 bg-card/60 transition-[border-color,background-color,box-shadow] duration-250 hover:border-primary/40 hover:bg-card/85 hover:shadow-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-chart-1/60 via-chart-3/60 to-chart-5/60 opacity-0 transition-opacity duration-250 group-hover:opacity-100" />

      <CardHeader className="">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={levelBadgeClass(preset.level)}>
            {preset.level}
          </Badge>
          {preset.featured ? (
            <Badge variant="secondary" className="inter text-xs">
              <Sparkles className="mr-1 size-3" />
              Featured
            </Badge>
          ) : null}
        </div>

        <CardTitle
          className={
            compact
              ? "text-lg sm:text-xl font-semibold"
              : "text-xl font-semibold"
          }
        >
          {preset.name}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="inter mb-4 text-base leading-relaxed text-muted-foreground">
          {preset.description}
        </p>

        <div className="mb-4 border border-border/60 bg-muted/30 p-4">
          <p className="inter mb-1 text-[11px] tracking-wide text-muted-foreground uppercase">
            Real-world context
          </p>
          <p className="inter text-sm text-foreground/90">{preset.realWorld}</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {preset.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="inter text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap gap-1.5">
          {queryTags.slice(0, compact ? 3 : 5).map((item) => (
            <Badge key={item} variant="secondary" className="jet text-xs">
              {item}
            </Badge>
          ))}
        </div>

        <Button asChild className="inter h-11 w-full text-base">
          <Link href={href}>
            Load Preset
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
