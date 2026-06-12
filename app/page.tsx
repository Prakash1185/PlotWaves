import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_20%,var(--chart-1)/0.16,transparent),radial-gradient(80%_70%_at_80%_0%,var(--chart-3)/0.14,transparent)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">ECE Simulations</p>
            <h1 className="text-2xl font-semibold tracking-tight">Signal Systems Lab</h1>
          </div>
          <ThemeToggle />
        </header>

        <section className="grid flex-1 items-center gap-6 md:grid-cols-2">
          <Card className="border-border/70 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-3xl leading-tight">
                Build intuition for Signals and Systems through live transformations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="max-w-prose text-sm text-muted-foreground">
                Generate core signals, apply time and amplitude transformations, and read the
                corresponding equation and explanation instantly.
              </p>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/lab">
                  Open Lab
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle>V1 Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Signal Generator</p>
              <p>2. Transformation Engine</p>
              <p>3. Dual Graph View</p>
              <p>4. Dynamic Equation</p>
              <p>5. Concept Explanation</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}