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

interface ProducersChartProps {
  data: AlgaeSpecies[]
}

export default function ProducersChart({ data }: ProducersChartProps) {
  const chartData = useMemo(() => {
    // Count species by producer
    const producerCounts: Record<string, number> = {}

    data.forEach((item) => {
      if (item.Producers) {
        const producers = item.Producers.split(",")
          .map((p) => p.trim())
          .filter(Boolean)
        producers.forEach((producer) => {
          producerCounts[producer] = (producerCounts[producer] || 0) + 1
        })
      }
    })

    // Convert to array and sort by count (descending)
    const sortedProducers = Object.entries(producerCounts)
      .map(([producer, count]) => ({ producer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15) // Take top 15

    return sortedProducers
  }, [data])

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>
  }

  return (
    <ChartContainer
      config={{
        count: {
          label: "Species Count",
          color: "hsl(var(--chart-3))",
        },
      }}
      className="h-full"
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ top: 20, right: 20, bottom: 20, left: 150 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={true} />
        <YAxis type="category" dataKey="producer" tickLine={false} axisLine={true} width={140} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" name="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
