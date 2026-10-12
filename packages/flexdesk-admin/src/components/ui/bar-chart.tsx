"use client"

import * as React from "react"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig,
} from "./chart"
import { cn } from "@/lib/utils"

interface BarChartProps {
  data: Array<Record<string, unknown>>
  config: ChartConfig
  index: string // The key for X-axis labels
  categories: string[] // The keys for bar data
  className?: string
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  yAxisWidth?: number
  layout?: "horizontal" | "vertical"
  stacked?: boolean
  valueFormatter?: (value: number, name: string) => string
  labelFormatter?: (label: string) => string
  barRadius?: number
  barGap?: number
  barCategoryGap?: string | number
  onClick?: (data: Record<string, unknown>, index: number) => void
}

export function BarChart({
  data,
  config,
  index,
  categories,
  className,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  yAxisWidth = 56,
  layout = "horizontal",
  stacked = false,
  valueFormatter,
  labelFormatter,
  barRadius = 4,
  barGap = 4,
  barCategoryGap = "20%",
  onClick,
}: BarChartProps) {
  const isHorizontal = layout === "horizontal"

  return (
    <ChartContainer config={config} className={cn("min-h-[200px]", className)}>
      <RechartsBarChart
        data={data}
        layout={layout}
        barGap={barGap}
        barCategoryGap={barCategoryGap}
        margin={{
          top: 12,
          right: 12,
          bottom: showLegend ? 36 : 12,
          left: 12,
        }}
      >
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={isHorizontal}
            horizontal={!isHorizontal || true}
            stroke="hsl(var(--chart-grid))"
          />
        )}
        {showXAxis && (
          <XAxis
            dataKey={isHorizontal ? index : undefined}
            type={isHorizontal ? "category" : "number"}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={isHorizontal ? (value) => `${value}`.slice(0, 3) : undefined}
          />
        )}
        {showYAxis && (
          <YAxis
            dataKey={!isHorizontal ? index : undefined}
            type={!isHorizontal ? "category" : "number"}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={yAxisWidth}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={
              isHorizontal && valueFormatter
                ? (value) => valueFormatter(value as number, "")
                : undefined
            }
          />
        )}
        {showTooltip && (
          <Tooltip
            cursor={{ fill: "hsl(var(--accent) / 0.3)" }}
            content={
              <ChartTooltipContent
                valueFormatter={valueFormatter}
                labelFormatter={labelFormatter}
                indicator="dot"
              />
            }
          />
        )}
        {showLegend && (
          <Legend
            content={<ChartLegendContent />}
            verticalAlign="bottom"
          />
        )}
        {categories.map((category, idx) => {
          const categoryConfig = config[category]
          const fill = categoryConfig?.color || `hsl(var(--chart-${(idx % 5) + 1}))`

          return (
            <Bar
              key={category}
              dataKey={category}
              fill={fill}
              radius={barRadius}
              stackId={stacked ? "stack" : undefined}
              onClick={
                onClick
                  ? (data, dataIndex) => {
                      if (data) onClick(data as unknown as Record<string, unknown>, dataIndex)
                    }
                  : undefined
              }
              style={{ cursor: onClick ? "pointer" : undefined }}
            />
          )
        })}
      </RechartsBarChart>
    </ChartContainer>
  )
}

// Horizontal bar chart variant
interface HorizontalBarChartProps extends Omit<BarChartProps, "layout"> {}

export function HorizontalBarChart(props: HorizontalBarChartProps) {
  return <BarChart {...props} layout="vertical" />
}

export { type BarChartProps }
