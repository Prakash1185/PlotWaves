import { GithubIcon, TwitterIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"


export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-5xl px-6 py-5">
        

        <div className="flex flex-col items-center justify-between text-sm gap-4   text-muted-foreground md:flex-row">
          <p className="inter">
            &copy; {new Date().getFullYear()} PlotWaves. All rights reserved.
          </p>
          <p className="inter">
            built by{" "} 
            <Link
              href="https://github.com/Prakash1185"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline decoration-primary/50 underline-offset-4 transition-colors hover:decoration-primary"
            >
              @Prakash
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
