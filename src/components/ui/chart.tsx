"use client"

import * as React from "react"
import { ChartTooltipProps, TooltipProps } from "recharts"
import { cn } from "@/lib/utils"

const ChartContext = React.createContext<{
  config: Record<string, any> | null
}>({
  config: null,
})

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  config?: Record<string, any>
}) {
  // Set CSS variables for chart colors
  React.useEffect(() => {
    if (!config) return

    Object.entries(config).forEach(([key, value]) => {
      if (value.color) {
        document.documentElement.style.setProperty(`--color-${key}`, value.color)
      }
    })

    return () => {
      Object.keys(config).forEach((key) => {
        document.documentElement.style.removeProperty(`--color-${key}`)
      })
    }
  }, [config])

  return (
    <ChartContext.Provider value={{ config: config || null }}>
      <div className={cn("w-full h-full", className)} {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  )
}

export function ChartTooltip({
  active,
  payload,
  label,
  content,
  ...props
}: TooltipProps<any, any> & {
  content?: React.ReactNode
}) {
  if (!active || !payload?.length) {
    return null
  }

  if (content) {
    return content
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {item.name}
            </span>
            <span className="font-bold tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = "line",
  nameKey,
  hideLabel,
  ...props
}: ChartTooltipProps<any, any> & {
  indicator?: "line" | "dashed" | "none"
  nameKey?: string
  hideLabel?: boolean
}) {
  const { config } = React.useContext(ChartContext)

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-2 shadow-sm",
        className
      )}
      {...props}
    >
      {!hideLabel && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{label}</span>
          {indicator === "line" && (
            <div className="h-px w-4 bg-border" />
          )}
          {indicator === "dashed" && (
            <div className="h-px w-4 border-t border-dashed border-border" />
          )}
        </div>
      )}
      <div className="mt-1 grid gap-0.5">
        {payload.map((item: any, index: number) => {
          const color = item.color || config?.[item.dataKey]?.color

          return (
            <div key={index} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {color && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="text-xs text-muted-foreground">
                  {config?.[item.dataKey]?.label || item.name || nameKey || item.dataKey}
                </span>
              </div>
              <span className="text-xs font-medium tabular-nums">
                {item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}