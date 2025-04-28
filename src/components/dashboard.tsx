"use client"

import type React from "react"
import dynamic from 'next/dynamic'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs"
import { Input } from "@/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select"
import { Button } from "@/components/button"
import { Download, Filter, RefreshCw, Upload } from "lucide-react"
import AlgaeTable from "./algae-table"
import GenusDistributionChart from "./genus-distribution-chart"
import ColorDistributionChart from "./color-distribution-chart"
import ProducersChart from "./producers-chart"
import { useAlgaeData } from "./algae-data-provider"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { parseProducers } from "@/lib/data-processor"
import 'leaflet/dist/leaflet.css'

// Dynamically import the map component with no SSR
const AlgaeMap = dynamic(() => import('./algae-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
});

const AlgaeHeatmap = dynamic(() => import('./algae-heatmap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <p className="text-muted-foreground">Loading heatmap...</p>
    </div>
  ),
});

export default function Dashboard() {
  const {
    algaeData,
    filteredData,
    uniqueGenera,
    uniqueColors,
    uniqueProducers,
    searchTerm,
    setSearchTerm,
    selectedGenus,
    setSelectedGenus,
    selectedColor,
    setSelectedColor,
    selectedProducer,
    setSelectedProducer,
    resetFilters,
    loading,
    uploadCSV,
  } = useAlgaeData()

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const csvText = e.target?.result as string
      uploadCSV(csvText)
    }
    reader.readAsText(file)
  }

  // Handle CSV download
  const downloadCSV = () => {
    if (filteredData.length === 0) return

    const headers = Object.keys(filteredData[0]).join(",")
    const rows = filteredData.map((item) =>
      Object.values(item)
        .map((value) => (typeof value === "string" && value.includes(",") ? `"${value}"` : value))
        .join(","),
    )
    const csv = [headers, ...rows].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "filtered_algae_data.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Algae Species Dashboard</h1>
          <p className="text-muted-foreground">Explore and analyze {algaeData.length} algae species</p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCSV} disabled={filteredData.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="csv-upload"
            />
            <Button variant="outline" size="sm" asChild>
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </label>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Species</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{algaeData.length}</div>
            <p className="text-xs text-muted-foreground">{filteredData.length} currently filtered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Genera</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueGenera.length}</div>
            <p className="text-xs text-muted-foreground">
              {[...new Set(filteredData.map((item) => item.Genus))].filter(Boolean).length} in current filter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Color Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueColors.length}</div>
            <p className="text-xs text-muted-foreground">
              {[...new Set(filteredData.map((item) => item.Color))].filter(Boolean).length} in current filter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Producers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueProducers.length}</div>
            <p className="text-xs text-muted-foreground">
              {[...new Set(filteredData.flatMap((item) => item.Producers ? parseProducers(item.Producers) : []))].length} in current filter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-center mb-4">
          <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label htmlFor="search-input" className="text-sm font-medium mb-1 block text-muted-foreground">Search</label>
            <Input
              id="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search species..."
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="genus-select" className="text-sm font-medium mb-1 block text-muted-foreground">Genus</label>
            <Select value={selectedGenus} onValueChange={setSelectedGenus}>
              <SelectTrigger id="genus-select">
                <SelectValue placeholder="Select genus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genera</SelectItem>
                {uniqueGenera.map((genus) => (
                  <SelectItem key={genus} value={genus}>
                    {genus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="color-select" className="text-sm font-medium mb-1 block text-muted-foreground">Color</label>
            <Select value={selectedColor} onValueChange={setSelectedColor}>
              <SelectTrigger id="color-select">
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All colors</SelectItem>
                {uniqueColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="producer-select" className="text-sm font-medium mb-1 block text-muted-foreground">Producer</label>
            <Select value={selectedProducer} onValueChange={setSelectedProducer}>
              <SelectTrigger id="producer-select">
                <SelectValue placeholder="Select producer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All producers</SelectItem>
                {uniqueProducers.map((producer) => (
                  <SelectItem key={producer} value={producer}>
                    {producer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="space-y-4">
          <AlgaeTable data={filteredData} />
        </TabsContent>
        <TabsContent value="map" className="space-y-4">
          <div className="h-[600px]">
            <AlgaeMap />
          </div>
          <div className="h-[400px]">
            <div className="font-medium mb-2">Algae Distribution Heatmap</div>
            <AlgaeHeatmap />
          </div>
        </TabsContent>
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribution by Genus</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <GenusDistributionChart data={filteredData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Distribution by Color</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ColorDistributionChart data={filteredData} />
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Distribution by Producer</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ProducersChart data={filteredData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
