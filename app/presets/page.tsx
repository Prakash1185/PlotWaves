import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function PresetsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-12">
      <Badge variant="secondary" className="mb-4 text-xs">
        Coming Soon
      </Badge>
      <h1 className="text-2xl font-semibold tracking-tight">Signal Presets</h1>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        Curated classroom presets organized by topic will be available here.
        For now, head to the lab to start exploring.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/lab">
          <ArrowLeft className="mr-1 size-4" />
          Back to Lab
        </Link>
      </Button>
    </main>
  )
}
