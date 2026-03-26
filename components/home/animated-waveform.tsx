"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

export function AnimatedWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = 0
    let height = 0

    function resize() {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx!.scale(dpr, dpr)
    }

    resize()
    window.addEventListener("resize", resize)

    function draw(time: number) {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)

      const isDark = resolvedTheme === "dark"
      const baseAlpha = isDark ? 0.12 : 0.08

      const waves = [
        { freq: 0.008, amp: 0.18, speed: 0.0008, color: `oklch(0.72 0.19 195 / ${baseAlpha})`, width: 2 },
        { freq: 0.012, amp: 0.12, speed: 0.0012, color: `oklch(0.68 0.19 25 / ${baseAlpha * 0.8})`, width: 1.5 },
        { freq: 0.006, amp: 0.22, speed: 0.0006, color: `oklch(0.65 0.15 260 / ${baseAlpha * 0.6})`, width: 1.8 },
        { freq: 0.015, amp: 0.08, speed: 0.0015, color: `oklch(0.70 0.18 330 / ${baseAlpha * 0.5})`, width: 1.2 },
      ]

      for (const wave of waves) {
        ctx.beginPath()
        ctx.strokeStyle = wave.color
        ctx.lineWidth = wave.width
        ctx.lineJoin = "round"

        const centerY = height * 0.5

        for (let x = 0; x <= width; x += 2) {
          const y =
            centerY +
            height * wave.amp * Math.sin(x * wave.freq + time * wave.speed) *
            Math.cos(x * wave.freq * 0.3 + time * wave.speed * 0.5)

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        ctx.stroke()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [resolvedTheme])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
