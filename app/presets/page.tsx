"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, BookOpen, Layers, Activity, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const presets = [
  {
    category: "Basic Signals",
    icon: Activity,
    items: [
      { id: "standard-sine", name: "Standard Sine Wave", description: "A simple unshifted 2 rad/s sine wave.", params: "type=sine&w=2&A=1" },
      { id: "fast-cosine", name: "Fast Cosine", description: "High frequency cosine wave demonstrating oscillations.", params: "type=cosine&w=8&A=1.5" },
      { id: "unit-step", name: "Unit Step u(t)", description: "The standard Heaviside step function at t=0.", params: "type=step&shift=0&A=1" },
    ]
  },
  {
    category: "Transformations",
    icon: Layers,
    items: [
      { id: "time-delay", name: "Time Delay", description: "A square wave delayed by 2 seconds (shift right).", params: "type=square&w=2&shift=2&A=1" },
      { id: "time-scale", name: "Time Compression", description: "A sine wave sped up by a factor of 2 (a=2).", params: "type=sine&w=2&scale=2&A=1" },
      { id: "time-reversal", name: "Time Reversal", description: "An exponential decay signal flipped over the Y-axis.", params: "type=exp&A=1&rev=true" },
    ]
  },
  {
    category: "Advanced Concepts",
    icon: Sparkles,
    items: [
      { id: "aliasing", name: "Sampling / Aliasing", description: "A high-frequency sine wave with low sampling rate showing distortion.", params: "type=sine&w=10&A=2&step=0.6" },
      { id: "even-odd", name: "Even & Odd Decomposition", description: "A shifted step function to clearly see its even and odd parts.", params: "type=step&shift=1&A=2" },
      { id: "convolution", name: "RC Circuit Response", description: "Convolving a square wave with an exponential decay impulse.", params: "type=square&w=2&shift=0&A=1&conv=true&gain=1.5&decay=0.5" },
    ]
  }
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const } }
}

export default function PresetsPage() {
  return (
    <main className="relative min-h-screen pb-24">
      {/* Background patterns */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-[0.05]" />
      
      <div className="mx-auto w-full max-w-5xl px-6 pt-12">
        <header className="mb-12">
          <Button variant="ghost" size="sm" asChild className="mb-6 h-8 px-2">
            <Link href="/">
              <ArrowLeft className="mr-2 size-3.5" />
              Back to Home
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <BookOpen className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Curriculum Presets</h1>
              <p className="text-sm text-muted-foreground">Load standard educational configurations instantly.</p>
            </div>
          </div>
        </header>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-12"
        >
          {presets.map((group) => (
            <motion.section key={group.category} variants={item}>
              <div className="mb-4 flex items-center gap-2 border-b border-border/50 pb-2">
                <group.icon className="size-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{group.category}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((preset) => (
                  <Card key={preset.id} className="group relative overflow-hidden border-border/50 bg-card/40 transition-colors hover:border-primary/30 hover:bg-card/80">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">{preset.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-6 text-xs leading-relaxed text-muted-foreground">
                        {preset.description}
                      </p>
                      <Button asChild size="sm" variant="secondary" className="w-full transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Link href={`/lab?${preset.params}`}>
                          Load Preset
                          <ArrowRight className="ml-1.5 size-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.section>
          ))}
        </motion.div>
      </div>
    </main>
  )
}
