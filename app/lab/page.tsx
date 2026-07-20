import { Suspense } from "react"
import { LabWorkspace } from "../../components/lab/lab-workspace"

export default function LabPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading workspace...</div>}>
      <LabWorkspace />
    </Suspense>
  )
}