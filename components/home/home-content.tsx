"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Atom,
  BarChart3,
  BookOpen,
  ChartLine,
  Code2,
  GitBranch,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { AnimatedWaveform } from "@/components/home/animated-waveform"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const features = [
  {
    icon: Zap,
    title: "Signal Generator",
    description: "Generate sine, cosine, step, ramp, exponential, and square wave signals with tunable parameters.",
  },
  {
    icon: Layers,
    title: "Transformation Engine",
    description: "Apply time shift, scaling, reversal, and amplitude scaling — all composed into y(t) = A·x(a(t − t₀)).",
  },
  {
    icon: ChartLine,
    title: "Dual Visualization",
    description: "View original and transformed signals side-by-side or overlaid on a single chart with export support.",
  },
  {
    icon: Code2,
    title: "Live Equation",
    description: "See the mathematical equation update in real-time. Write your own y(t) in manual mode.",
  },
  {
    icon: BookOpen,
    title: "Concept Insights",
    description: "Rule-based explanations describe what each parameter change means — building intuition, not memorization.",
  },
  {
    icon: BarChart3,
    title: "Signal Analysis",
    description: "Compute RMS, energy, peak-to-peak, zero crossings, period detection, and frequency spectrum in real-time.",
  },
  {
    icon: GitBranch,
    title: "Even/Odd Decomposition",
    description: "Split any signal into its even and odd components and visualize them separately.",
  },
  {
    icon: Sparkles,
    title: "Convolution Preview",
    description: "Convolve your signal with a causal exponential impulse response and see the output live.",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.15,
    },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0, 0, 0.2, 1] as const } },
}

export function HomeContent() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Animated waveform background */}
      <AnimatedWaveform />

      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_25%_15%,oklch(0.72_0.19_195/0.08),transparent),radial-gradient(60%_60%_at_75%_10%,oklch(0.68_0.19_25/0.06),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_90%,oklch(0.65_0.15_260/0.05),transparent)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Atom className="size-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">ECE Simulations</span>
            <Badge variant="outline" className="text-[10px]">V1</Badge>
          </div>
          <ThemeToggle />
        </motion.header>

        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center py-16 text-center sm:py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
            className="max-w-2xl space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Badge variant="secondary" className="text-xs">
                Signals & Systems Learning Lab
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
            >
              Build intuition through{" "}
              <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-1 bg-clip-text text-transparent">
                live transformations
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base"
            >
              Generate signals, apply transformations, analyze frequency spectra,
              and see the math come alive. Designed for ECE students and anyone
              curious about how signals work.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <Button asChild size="lg" className="gap-2 shadow-md shadow-primary/20">
                <Link href="/lab">
                  Open Lab
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/presets">
                  Browse Presets
                </Link>
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="font-mono text-xs text-muted-foreground/30"
            >
              y(t) = A_out · x( a · (t − t₀) )
            </motion.p>
          </motion.div>
        </section>

        {/* Features */}
        <motion.section
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="pb-16"
        >
          <motion.h2
            variants={fadeUp}
            className="mb-2 text-center text-lg font-semibold tracking-tight sm:text-xl"
          >
            Everything you need for signal exploration
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mb-8 max-w-md text-center text-xs text-muted-foreground sm:text-sm"
          >
            From basic signal generation to frequency analysis — a complete toolkit in your browser.
          </motion.p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp}>
                <Card className="group h-full border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-200 hover:border-border/80 hover:bg-card/85 hover:shadow-sm">
                  <CardContent className="flex flex-col gap-2 pt-5">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-primary/10 p-1.5 transition-colors group-hover:bg-primary/15">
                        <feature.icon className="size-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-medium">{feature.title}</p>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Quick start section */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="pb-12"
        >
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left">
              <div className="flex-1 space-y-2">
                <p className="text-base font-semibold">Ready to explore?</p>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  No setup needed. Open the lab, pick a signal, tweak parameters,
                  and watch the graphs update instantly. Every control is documented
                  with tooltips.
                </p>
              </div>
              <Button asChild size="lg" className="shrink-0 gap-2 shadow-md shadow-primary/20">
                <Link href="/lab">
                  Launch Lab
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.section>

        {/* Footer */}
        <Separator className="opacity-30" />
        <footer className="py-4 text-center text-xs text-muted-foreground/50">
          ECE Signal Systems Lab — Built for learning · V1
        </footer>
      </div>
    </main>
  )
}
