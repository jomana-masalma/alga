"use client"

import { useMemo } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Legend, Tooltip, TooltipProps } from "recharts"
import { ChartContainer } from "@/components/chart"
import { algaeColorMap } from "@/services/algae-data-service"
import type { AlgaeSpecies } from "@/lib/data-processor"

interface ChartData {
  color: string
  value: number
  total: number
}

interface ColorDistributionChartProps {
  data: AlgaeSpecies[]
}

export default function ColorDistributionChart({ data }: ColorDistributionChartProps) {
  const chartData = useMemo(() => {
    // Count species by color
    const colorCounts: Record<string, number> = {}

    data.forEach((item) => {
      if (item.Color) {
        colorCounts[item.Color] = (colorCounts[item.Color] || 0) + 1
      } else {
        colorCounts["Unknown"] = (colorCounts["Unknown"] || 0) + 1
      }
    })

    // Convert to array
    return Object.entries(colorCounts)
      .map(([color, value]) => ({ color, value }))
      .sort((a, b) => b.value - a.value)
  }, [data])

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartData
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium">{data.color}</p>
          <p className="text-sm">
            {data.value} species ({((data.value / data.total) * 100).toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  // Add total to each data point for percentage calculation
  const totalSpecies = data.length
  const enhancedChartData = chartData.map((item) => ({
    ...item,
    total: totalSpecies,
  }))

  const chartConfig = {
    default: {
      color: "hsl(215, 70%, 60%)"
    }
  }

  return (
    <ChartContainer className="h-full" config={chartConfig}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={enhancedChartData}
            dataKey="value"
            nameKey="color"
            cx="50%"
            cy="50%"
            outerRadius={120}
            label={({ color, value, percent }) => `${color}: ${value} (${(percent * 100).toFixed(0)}%)`}
            labelLine={true}
          >
            {enhancedChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={algaeColorMap[entry.color] || `hsl(${index * 45}, 70%, 60%)`} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
