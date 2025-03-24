
"use client"

import type React from "react"
import dynamic from 'next/dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs"
import { Input } from "@/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select"
import { Badge } from "@/components/badge"
import { Button } from "@/components/button"
import { Download, Filter, RefreshCw, Upload, Database, BarChart, MapPin, Info, AlertCircle } from "lucide-react"
import AlgaeTable from "./algae-table"
import GenusDistributionChart from "./genus-distribution-chart"
import ColorDistributionChart from "./color-distribution-chart"
import ProducersChart from "./producers-chart"
// import AlgaeMap from "./algae-map" // Comment out the direct import
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
    dataStats,
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
              {
                [
                  ...new Set(
                    filteredData.flatMap((item) =>
                      item.Producers
                        ? parseProducers(item.Producers)
                        : [],
                    ),
                  ),
                ].length
              }{" "}
              in current filter
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
              placeholder="Search by species or common name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="genus-select" className="text-sm font-medium mb-1 block text-muted-foreground">Genus</label>
            <Select value={selectedGenus} onValueChange={setSelectedGenus} name="genus-select">
              <SelectTrigger id="genus-select">
                <SelectValue placeholder="Select Genus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genera</SelectItem>
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
            <Select value={selectedColor} onValueChange={setSelectedColor} name="color-select">
              <SelectTrigger id="color-select">
                <SelectValue placeholder="Select Color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colors</SelectItem>
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
            <Select value={selectedProducer} onValueChange={setSelectedProducer} name="producer-select">
              <SelectTrigger id="producer-select">
                <SelectValue placeholder="Select Producer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Producers</SelectItem>
                {uniqueProducers.map((producer) => (
                  <SelectItem key={producer} value={producer}>
                    {producer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filters */}
        {(selectedGenus !== "all" || selectedColor !== "all" || selectedProducer !== "all" || searchTerm) && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <div className="text-sm font-medium text-muted-foreground mr-2">Active filters:</div>
            {searchTerm && (
              <Badge variant="outline" className="px-3 py-1 bg-blue-50">
                Search: {searchTerm}
                <button
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search filter"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedGenus !== "all" && (
              <Badge variant="outline" className="px-3 py-1 bg-green-50">
                Genus: {selectedGenus}
                <button
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedGenus("all")}
                  aria-label="Clear genus filter"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedColor !== "all" && (
              <Badge variant="outline" className="px-3 py-1 bg-yellow-50">
                Color: {selectedColor}
                <button
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedColor("all")}
                  aria-label="Clear color filter"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedProducer !== "all" && (
              <Badge variant="outline" className="px-3 py-1 bg-purple-50">
                Producer: {selectedProducer}
                <button
                  className="ml-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedProducer("all")}
                  aria-label="Clear producer filter"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="table" className="mb-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="table" className="flex items-center">
            <Database className="mr-2 h-4 w-4" />
            Table
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            Map
          </TabsTrigger>
        </TabsList>

        {/* Table Tab */}
        <TabsContent value="table" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5 text-primary" />
                Algae Species Data
              </CardTitle>
              <CardDescription>
                Showing {filteredData.length} of {algaeData.length} species
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <AlgaeTable data={filteredData} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-primary" />
                  Distribution by Genus
                </CardTitle>
                <CardDescription>Top genera by number of species</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] p-4">
                <GenusDistributionChart data={filteredData} />
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mr-2"></div>
                  Distribution by Color
                </CardTitle>
                <CardDescription>Species grouped by color</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] p-4">
                <ColorDistributionChart data={filteredData} />
              </CardContent>
            </Card>
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-primary rotate-90" />
                  Top Producers
                </CardTitle>
                <CardDescription>Number of species by producer</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] p-4">
                <ProducersChart data={filteredData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                Geographic Distribution
              </CardTitle>
              <CardDescription>Approximate locations of producers and species</CardDescription>
            </CardHeader>
            <CardContent className="h-[600px] p-0 sm:p-4">
              <div className="relative h-full">
                <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border text-sm">
                  <p className="font-medium mb-1">Map Legend</p>
                  <div className="flex items-center mb-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span>Producer Location</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span>Multiple Species</span>
                  </div>
                </div>
                <AlgaeMap data={filteredData} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
