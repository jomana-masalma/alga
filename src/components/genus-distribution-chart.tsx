"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/chart"

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

interface GenusDistributionChartProps {
  data: AlgaeSpecies[]
}

export default function GenusDistributionChart({ data }: GenusDistributionChartProps) {
  const chartData = useMemo(() => {
    // Count species by genus
    const genusCounts: Record<string, number> = {}

    data.forEach((item) => {
      if (item.Genus) {
        genusCounts[item.Genus] = (genusCounts[item.Genus] || 0) + 1
      }
    })

    // Convert to array and sort by count (descending)
    const sortedGenera = Object.entries(genusCounts)
      .map(([genus, count]) => ({ genus, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Take top 10

    return sortedGenera
  }, [data])

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>
  }

  return (
    <ChartContainer
      config={{
        count: {
          label: "Species Count",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-full"
    >
      <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 60, left: 40 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="genus" tickLine={false} axisLine={true} angle={-45} textAnchor="end" height={60} />
        <YAxis tickLine={false} axisLine={true} tickFormatter={(value) => value.toString()} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" name="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
