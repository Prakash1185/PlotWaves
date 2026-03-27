"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
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
import { HugeiconsIcon } from "@hugeicons/react"
import { GithubIcon } from "@hugeicons/core-free-icons"
import { Footer } from "@/components/footer"

const features = [
  {
    icon: Zap,
    title: "Signal Generator",
    description:
      "Generate sine, cosine, step, ramp, exponential, and square wave signals with tunable parameters.",
  },
  {
    icon: Layers,
    title: "Transformation Engine",
    description:
      "Apply time shift, scaling, reversal, and amplitude scaling — all composed into y(t) = A·x(a(t − t₀)).",
  },
  {
    icon: ChartLine,
    title: "Dual Visualization",
    description:
      "View original and transformed signals side-by-side or overlaid on a single chart with export support.",
  },
  {
    icon: Code2,
    title: "Live Equation",
    description:
      "See the mathematical equation update in real-time. Write your own y(t) in manual mode.",
  },
  {
    icon: BookOpen,
    title: "Concept Insights",
    description:
      "Rule-based explanations describe what each parameter change means — building intuition, not memorization.",
  },
  {
    icon: BarChart3,
    title: "Signal Analysis",
    description:
      "Compute RMS, energy, peak-to-peak, zero crossings, period detection, and frequency spectrum in real-time.",
  },
  {
    icon: GitBranch,
    title: "Even/Odd Decomposition",
    description:
      "Split any signal into its even and odd components and visualize them separately.",
  },
  {
    icon: Sparkles,
    title: "Convolution Preview",
    description:
      "Convolve your signal with a causal exponential impulse response and see the output live.",
  },
]

// --- SUB-COMPONENTS ---

function HomeHeader() {
  return (
    <div className="fixed top-4 right-0 left-0 z-50 flex justify-center px-6">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex w-full max-w-5xl items-center justify-between rounded-xl  px-4 py-3 bg-background/40 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5 dark:shadow-black/30"
      >
        <span className="text-lg font-bold tracking-tight sm:text-xl md:text-2xl">
          PlotWaves
        </span>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Link href="/" target="_blank" rel="noreferrer">
              <HugeiconsIcon icon={GithubIcon} className="size-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </motion.header>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="mt-10 flex flex-1 flex-col items-center justify-center py-20 text-center sm:py-32">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
        className="max-w-4xl space-y-8 md:space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Badge
            variant="secondary"
            className="space border border-primary/50 px-4 py-3.5 text-sm font-medium"
          >
            <Sparkles className="mr-2 size-3.5" />
            Signals & Systems Learning Lab
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl lg:leading-[1.1] xl:text-[5rem]"
        >
          Build intuition through{" "}
          <span className="bg-gradient-to-r from-chart-2 via-chart-3 to-chart-1 bg-clip-text text-transparent">
            live transformations
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="inter mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Generate signals, apply transformations, analyze frequency spectra,
          and see the math come alive. Designed for anyone curious about how
          signals work.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="inter flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Button
            asChild
            size="lg"
            className="gap-2 px-6 py-5 shadow-lg shadow-primary/20 "
          >
            <Link href="/lab">
              Open Lab
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-6 py-5">
            <Link href="/presets">Browse Presets</Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  )
}

function FeatureSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.15 },
    },
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: [0, 0, 0.2, 1] as const },
    },
  }

  return (
    <motion.section
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      className="pt-12 pb-24"
    >
      <motion.div variants={fadeUp} className="mb-12 space-y-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
          Everything you need for signal exploration
        </h2>
        <p className="inter mx-auto max-w-2xl text-base text-muted-foreground">
          From basic signal generation to frequency analysis — a complete
          toolkit running entirely in your browser.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <motion.div key={feature.title} variants={fadeUp}>
            <Card className="group h-full border-border/40 bg-card/40 backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/5">
              <CardContent className="flex flex-col gap-3 pt-2">
                <div className="mb-2 flex items-center gap-3">
                  <div className="rounded bg-[oklch(0.68_0.18_25/0.1)] text-[oklch(0.68_0.18_25)] p-2.5 ring-1 ring-primary/20 transition-colors group-hover:bg-primary/20">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="inter text-base font-semibold">
                    {feature.title}
                  </h3>
                </div>
                <p className="space text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}

function CtaSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="pb-20"
    >
      <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-card/60 to-muted/30 backdrop-blur-xl">
        <CardContent className="flex flex-col items-center justify-between gap-8 py-5 md:flex-row md:px-12">
          <div className="space-y-3 text-center md:max-w-xl md:text-left">
            <h3 className="text-2xl font-bold">Ready to explore?</h3>
            <p className="space text-base text-muted-foreground">
              No setup needed. Open the lab, pick a signal, tweak parameters,
              and watch the graphs update instantly.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="inter shrink-0 gap-2 shadow-lg shadow-primary/20"
          >
            <Link href="/lab">
              Launch Lab
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.section>
  )
}

// --- MAIN EXPORT ---

export function HomeContent() {
  return (
    <main className="relative min-h-screen overflow-hidden selection:bg-primary/20">
      {/* Animated waveform background */}
      <AnimatedWaveform />

      {/* Modern Gradient Overlays */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.68_0.18_25/0.12),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_100%,oklch(0.70_0.16_300/0.08),transparent)]" />

      <div className="relative mx-auto min-h-screen w-full max-w-6xl px-6">
        <HomeHeader />
        <HeroSection />
        <FeatureSection />
        <CtaSection />
      </div>
    </main>
  )
}
