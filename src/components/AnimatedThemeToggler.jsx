import React, { useCallback, useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"

function polygonCollapsed(cx, cy, vertexCount) {
  const pairs = Array.from(
    { length: vertexCount },
    () => `${cx}px ${cy}px`
  ).join(", ")
  return `polygon(${pairs})`
}

function getThemeTransitionClipPaths(variant, cx, cy, maxRadius, viewportWidth, viewportHeight) {
  switch (variant) {
    case "circle":
      return [
        `circle(0px at ${cx}px ${cy}px)`,
        `circle(${maxRadius}px at ${cx}px ${cy}px)`,
      ]
    case "square": {
      const halfW = Math.max(cx, viewportWidth - cx)
      const halfH = Math.max(cy, viewportHeight - cy)
      const halfSide = Math.max(halfW, halfH) * 1.05
      const end = [
        `${cx - halfSide}px ${cy - halfSide}px`,
        `${cx + halfSide}px ${cy - halfSide}px`,
        `${cx + halfSide}px ${cy + halfSide}px`,
        `${cx - halfSide}px ${cy + halfSide}px`,
      ].join(", ")
      return [polygonCollapsed(cx, cy, 4), `polygon(${end})`]
    }
    case "triangle": {
      const scale = maxRadius * 2.2
      const dx = (Math.sqrt(3) / 2) * scale
      const verts = [
        `${cx}px ${cy - scale}px`,
        `${cx + dx}px ${cy + 0.5 * scale}px`,
        `${cx - dx}px ${cy + 0.5 * scale}px`,
      ].join(", ")
      return [polygonCollapsed(cx, cy, 3), `polygon(${verts})`]
    }
    case "diamond": {
      const R = maxRadius * Math.SQRT2
      const end = [
        `${cx}px ${cy - R}px`,
        `${cx + R}px ${cy}px`,
        `${cx}px ${cy + R}px`,
        `${cx - R}px ${cy}px`,
      ].join(", ")
      return [polygonCollapsed(cx, cy, 4), `polygon(${end})`]
    }
    case "hexagon": {
      const R = maxRadius * Math.SQRT2
      const verts = []
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3
        verts.push(`${cx + R * Math.cos(a)}px ${cy + R * Math.sin(a)}px`)
      }
      return [polygonCollapsed(cx, cy, 6), `polygon(${verts.join(", ")})`]
    }
    case "rectangle": {
      const halfW = Math.max(cx, viewportWidth - cx)
      const halfH = Math.max(cy, viewportHeight - cy)
      const end = [
        `${cx - halfW}px ${cy - halfH}px`,
        `${cx + halfW}px ${cy - halfH}px`,
        `${cx + halfW}px ${cy + halfH}px`,
        `${cx - halfW}px ${cy + halfH}px`,
      ].join(", ")
      return [polygonCollapsed(cx, cy, 4), `polygon(${end})`]
    }
    case "star": {
      const R = maxRadius * Math.SQRT2 * 1.03
      const innerRatio = 0.42
      const starPolygon = (radius) => {
        const verts = []
        for (let i = 0; i < 5; i++) {
          const outerA = -Math.PI / 2 + (i * 2 * Math.PI) / 5
          verts.push(
            `${cx + radius * Math.cos(outerA)}px ${cy + radius * Math.sin(outerA)}px`
          )
          const innerA = outerA + Math.PI / 5
          verts.push(
            `${cx + radius * innerRatio * Math.cos(innerA)}px ${cy + radius * innerRatio * Math.sin(innerA)}px`
          )
        }
        return `polygon(${verts.join(", ")})`
      }
      const startR = Math.max(2, R * 0.025)
      return [starPolygon(startR), starPolygon(R)]
    }
    default:
      return [
        `circle(0px at ${cx}px ${cy}px)`,
        `circle(${maxRadius}px at ${cx}px ${cy}px)`,
      ]
  }
}

export const AnimatedThemeToggler = ({
  className = "",
  duration = 400,
  variant,
  fromCenter = false,
  theme,
  onThemeChange,
  children,
  ...props
}) => {
  const shape = variant ?? "circle"
  const isControlled = theme !== undefined
  const [internalIsDark, setInternalIsDark] = useState(false)
  const isDark = isControlled ? theme === "dark" : internalIsDark
  const buttonRef = useRef(null)

  useEffect(() => {
    if (isControlled) return

    const updateTheme = () => {
      setInternalIsDark(document.documentElement.classList.contains("dark"))
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [isControlled])

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const viewportWidth = window.visualViewport?.width ?? window.innerWidth
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight

    let x, y
    if (fromCenter) {
      x = viewportWidth / 2
      y = viewportHeight / 2
    } else {
      const { top, left, width, height } = button.getBoundingClientRect()
      x = left + width / 2
      y = top + height / 2
    }

    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    )

    const applyTheme = () => {
      const newTheme = !isDark
      document.documentElement.classList.toggle("dark")
      if (isControlled) {
        onThemeChange?.(newTheme ? "dark" : "light")
      } else {
        setInternalIsDark(newTheme)
        localStorage.setItem("theme", newTheme ? "dark" : "light")
      }
    }

    if (typeof document.startViewTransition !== "function") {
      applyTheme()
      return
    }

    const clipPath = getThemeTransitionClipPaths(
      shape,
      x,
      y,
      maxRadius,
      viewportWidth,
      viewportHeight
    )

    const root = document.documentElement
    root.dataset.magicuiThemeVt = "active"
    root.style.setProperty(
      "--magicui-theme-toggle-vt-duration",
      `${duration}ms`
    )
    root.style.setProperty("--magicui-theme-vt-clip-from", clipPath[0])
    
    const cleanup = () => {
      delete root.dataset.magicuiThemeVt
      root.style.removeProperty("--magicui-theme-toggle-vt-duration")
      root.style.removeProperty("--magicui-theme-vt-clip-from")
    }

    const transition = document.startViewTransition(() => {
      flushSync(applyTheme)
    })
    
    if (typeof transition?.finished?.finally === "function") {
      transition.finished.finally(cleanup)
    } else {
      cleanup()
    }

    const ready = transition?.ready
    if (ready && typeof ready.then === "function") {
      ready.then(() => {
        document.documentElement.animate(
          {
            clipPath,
          },
          {
            duration,
            easing: shape === "star" ? "linear" : "ease-in-out",
            fill: "forwards",
            pseudoElement: "::view-transition-new(root)",
          }
        )
      })
    }
  }, [shape, fromCenter, duration, isDark, isControlled, onThemeChange])

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className={`relative inline-flex h-10 w-20 shrink-0 cursor-pointer items-center rounded-full border border-theme-border-soft bg-theme-surface shadow-glass transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2 overflow-hidden ${className}`}
      {...props}
    >
      {children}
      <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none z-10">
        <Sun className={`w-4 h-4 transition-colors duration-300 ${!isDark ? 'text-theme-muted/30' : 'text-theme-muted'}`} />
        <Moon className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-theme-muted/30' : 'text-theme-muted'}`} />
      </div>
      <div
        className={`absolute left-1 top-1 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20 ${
          isDark 
            ? 'translate-x-10 bg-theme-surface-elevated text-theme-primary border border-theme-border-soft shadow-glass' 
            : 'translate-x-0 bg-gradient-to-tr from-amber-300 to-yellow-500 text-white shadow-[0_0_10px_rgba(251,191,36,0.6)]'
        }`}
      >
        {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
