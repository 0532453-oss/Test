"use client"

import * as React from "react"
import { ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

// Chart configuration type
export type ChartConfig = Record<
  string,
  {
    label: string
    color?: string
    icon?: React.ComponentType<{ className?: string }>
  }
>

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

export function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a ChartContainer")
  }
  return context
}

interface ChartContainerProps extends React.ComponentProps<"div"> {
  config: ChartConfig
  children: React.ReactNode
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  // Generate CSS variables for chart colors
  const cssVars = React.useMemo(() => {
    const vars: Record<string, string> = {}
    Object.entries(config).forEach(([key, value]) => {
      if (value.color) {
        vars[`--color-${key}`] = value.color
      }
    })
    return vars
  }, [config])

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        className={cn("flex aspect-video justify-center text-xs", className)}
        style={cssVars as React.CSSProperties}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

// Chart tooltip content component
interface ChartTooltipContentProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    dataKey?: string
    payload?: Record<string, unknown>
    color?: string
  }>
  label?: string
  labelFormatter?: (label: string) => string
  valueFormatter?: (value: number, name: string) => string
  hideLabel?: boolean
  indicator?: "line" | "dot" | "dashed"
  className?: string
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  hideLabel = false,
  indicator = "dot",
  className,
}: ChartTooltipContentProps) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  const formattedLabel = labelFormatter ? labelFormatter(label ?? "") : label

  return (
    <div
      data-slot="chart-tooltip"
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-[hsl(var(--chart-tooltip-border))] bg-[hsl(var(--chart-tooltip-bg))] px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {!hideLabel && formattedLabel && (
        <div className="font-medium text-foreground">{formattedLabel}</div>
      )}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = item.dataKey as string
          const itemConfig = config[key]
          const indicatorColor = item.color || itemConfig?.color || "hsl(var(--chart-1))"
          const formattedValue = valueFormatter
            ? valueFormatter(item.value ?? 0, key)
            : item.value?.toLocaleString()

          return (
            <div
              key={`${key}-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-1.5">
                {indicator === "dot" && (
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: indicatorColor }}
                  />
                )}
                {indicator === "line" && (
                  <span
                    className="h-0.5 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: indicatorColor }}
                  />
                )}
                {indicator === "dashed" && (
                  <span
                    className="h-0.5 w-3 shrink-0 border-t-2 border-dashed"
                    style={{ borderColor: indicatorColor }}
                  />
                )}
                <span className="text-muted-foreground">
                  {itemConfig?.label || key}
                </span>
              </div>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {formattedValue}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Chart legend content component
interface ChartLegendContentProps {
  payload?: Array<{
    value?: string
    dataKey?: string
    color?: string
  }>
  verticalAlign?: "top" | "bottom"
  className?: string
}

export function ChartLegendContent({
  payload,
  className,
}: ChartLegendContentProps) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      data-slot="chart-legend"
      className={cn(
        "flex flex-wrap items-center justify-center gap-4 pt-3",
        className
      )}
    >
      {payload.map((item, index) => {
        const key = (item.dataKey || item.value) as string
        const itemConfig = config[key]
        const indicatorColor = item.color || itemConfig?.color || "hsl(var(--chart-1))"

        return (
          <div
            key={`${key}-${index}`}
            className="flex items-center gap-1.5 text-xs"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: indicatorColor }}
            />
            <span className="text-muted-foreground">
              {itemConfig?.label || key}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export { ChartContext }
