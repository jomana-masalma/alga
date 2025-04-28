"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/chart"
import { parseProducers } from "@/lib/data-processor"

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

interface CustomYAxisTickProps {
  x: number
  y: number
  payload: {
    value: string
  }
}

// Custom tick component for Y-axis labels
const CustomYAxisTick = ({ x, y, payload }: CustomYAxisTickProps) => {
  const maxLength = 25 // Maximum characters before truncating
  const displayText = payload.value.length > maxLength
    ? `${payload.value.substring(0, maxLength)}...`
    : payload.value

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-10}
        y={0}
        dy={4}
        textAnchor="end"
        fill="#888"
        fontSize={12}
        data-tooltip={payload.value}
        style={{
          fontFamily: 'var(--font-sans)',
          fill: 'var(--muted-foreground)'
        }}
      >
        {displayText}
      </text>
    </g>
  )
}

interface ChartDataItem {
  producer: string
  count: number
  percentage: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: ChartDataItem
  }>
}

export default function ProducersChart({ data }: ProducersChartProps) {
  const chartData = useMemo(() => {
    // Count species by producer
    const producerCounts: Record<string, number> = {}

    data.forEach((item) => {
      if (item.Producers) {
        const producers = parseProducers(item.Producers)
        producers.forEach((producer) => {
          producerCounts[producer] = (producerCounts[producer] || 0) + 1
        })
      }
    })

    // Convert to array and sort by count (descending)
    const sortedProducers = Object.entries(producerCounts)
      .map(([producer, count]) => ({
        producer,
        count,
        // Add percentage for better context
        percentage: ((count / data.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15) // Take top 15

    return sortedProducers
  }, [data])

  // Calculate chart dimensions
  const maxProducerLength = useMemo(() => {
    if (chartData.length === 0) return 150
    const longestName = chartData.reduce((max, item) =>
      item.producer.length > max.length ? item.producer : max,
      ""
    )
    // Increase pixels per character for better spacing
    const pixelsPerChar = 7
    return Math.min(Math.max(longestName.length * pixelsPerChar, 150), 300)
  }, [chartData])

  // Calculate bar height and spacing
  const barHeight = 30 // Height of each bar
  const barGap = 15 // Gap between bars
  const totalBars = chartData.length
  const chartHeight = (barHeight + barGap) * totalBars

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>
  }

  // Enhanced tooltip content
  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <div className="font-medium mb-1">{data.producer}</div>
          <div className="text-muted-foreground">
            Species Count: {data.count}
          </div>
          <div className="text-muted-foreground">
            Percentage: {data.percentage}%
          </div>
        </div>
      )
    }
    return null
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
      <ResponsiveContainer width="100%" height={Math.max(400, chartHeight)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 20,
            right: 30,
            bottom: 20,
            left: maxProducerLength
          }}
          barSize={barHeight}
          barGap={barGap}
        >
          <CartesianGrid
            horizontal={false}
            strokeDasharray="3 3"
            opacity={0.3}
          />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={true}
            domain={[0, 'dataMax']}
            tickFormatter={(value: number) => Math.round(value).toString()}
          />
          <YAxis
            type="category"
            dataKey="producer"
            tickLine={false}
            axisLine={true}
            tick={(props: CustomYAxisTickProps) => <CustomYAxisTick {...props} />}
            width={maxProducerLength - 10}
            interval={0} // Force display all ticks
            padding={{ top: 10, bottom: 10 }}
          />
          <ChartTooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
          />
          <Bar
            dataKey="count"
            name="count"
            fill="var(--color-count)"
            radius={[0, 4, 4, 0]}
            label={{
              position: 'right',
              formatter: (value: number) => `${value}`,
              fill: 'var(--foreground)',
              fontSize: 12
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
