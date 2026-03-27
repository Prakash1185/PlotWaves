import {
  Geist_Mono,
  Instrument_Sans,
  Inter,
  Space_Grotesk,
  JetBrains_Mono,
} from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { AppToaster } from "@/components/app-toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Footer } from "@/components/footer"
import { Metadata } from "next"
import { Analytics } from "@vercel/analytics/react"

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "PlotWaves - ECE simulations made clear.",
  description:
    "Interactive Signals and Systems lab to explore signal generation, transformations, convolution, and analysis.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        fontMono.variable,
        instrumentSans.variable,
        inter.variable,
        spaceGrotesk.variable,
        jetBrainsMono.variable
      )}
    >
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider defaultTheme="system">
          <AppToaster />
          <TooltipProvider>
            {children}
            <Footer />
          </TooltipProvider>
          <Analytics/>
        </ThemeProvider>
      </body>
    </html>
  )
}
