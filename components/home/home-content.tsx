"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Atom,
  BookOpen,
  ChartLine,
  Code2,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
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
    description: "Apply time shift, scaling, reversal, and amplitude scaling — all composed into one unified expression.",
  },
  {
    icon: ChartLine,
    title: "Dual Visualization",
    description: "View original and transformed signals side-by-side or overlaid on a single chart.",
  },
  {
    icon: Code2,
    title: "Live Equation",
    description: "See the mathematical equation update in real-time as you adjust every parameter.",
  },
  {
    icon: BookOpen,
    title: "Concept Explanations",
    description: "Rule-based insights explain what each parameter change means — building intuition, not memorization.",
  },
  {
    icon: Sparkles,
    title: "Manual Mode",
    description: "Write your own y(t) expression and see it rendered instantly alongside the parametric output.",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.2,
    },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const } },
}

export function HomeContent() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_25%_15%,oklch(0.72_0.19_195/0.12),transparent),radial-gradient(60%_60%_at_75%_10%,oklch(0.68_0.19_25/0.08),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_90%,oklch(0.65_0.15_260/0.06),transparent)]" />

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
            <Badge variant="secondary" className="text-xs">
              Signals & Systems Learning Lab
            </Badge>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Build intuition through{" "}
              <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                live transformations
              </span>
            </h1>

            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Generate signals, apply time and amplitude transformations, and
              instantly see the math-to-graph relationship. Designed for ECE
              students who want to see equations come alive.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <Button asChild size="lg" className="gap-2">
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

            <p className="font-mono text-xs text-muted-foreground/40">
              y(t) = A_out · x( a · (t − t₀) )
            </p>
          </motion.div>
        </section>

        {/* Features */}
        <motion.section
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="pb-16"
        >
          <motion.h2
            variants={fadeUp}
            className="mb-6 text-center text-lg font-semibold tracking-tight sm:text-xl"
          >
            Everything you need for signal exploration
          </motion.h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp}>
                <Card className="group h-full border-border/50 bg-card/70 transition-all duration-200 hover:border-border hover:bg-card/90 hover:shadow-sm">
                  <CardContent className="flex items-start gap-3 pt-5">
                    <div className="mt-0.5 rounded-md bg-primary/10 p-2 transition-colors group-hover:bg-primary/15">
                      <feature.icon className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{feature.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <Separator className="opacity-30" />
        <footer className="py-4 text-center text-xs text-muted-foreground/60">
          ECE Signal Systems Lab — Built for learning
        </footer>
      </div>
    </main>
  )
}
