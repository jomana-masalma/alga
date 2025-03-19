"use client"

import { useMemo } from "react"
import { Cell, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../components/ui/chart"

interface AlgaeSpecies {
  "Algae species": string
  "Wikipedia Links": string
  "Algae Base Links": string
  "Number of co's": string
  Producers: string
  Genus: string
  Color: string
  "Common name": string
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

  // Color mapping
  const colorMap: Record<string, string> = {
    Green: "#4ade80",
    Red: "#f87171",
    Brown: "#92400e",
    Blue: "#60a5fa",
    Yellow: "#facc15",
    Unknown: "#d1d5db",
  }

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>
  }

  return (
    <ChartContainer className="h-full">
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="color"
          cx="50%"
          cy="50%"
          outerRadius={120}
          label={({ color, value, percent }) => `${color}: ${value} (${(percent * 100).toFixed(0)}%)`}
          labelLine={true}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colorMap[entry.color] || `hsl(${index * 45}, 70%, 60%)`} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
      </PieChart>
    </ChartContainer>
  )
}

