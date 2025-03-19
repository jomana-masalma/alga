"use client";

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/components/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/components/tabs"
import { Input } from "../components/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/components/select"
import { Badge } from "../components/ui/components/badge"
import { Button } from "../components/ui/components/button"
import { Download, Filter, RefreshCw } from "lucide-react"
import AlgaeTable from "./algae-table"
import GenusDistributionChart from "./genus-distribution-chart"
import ColorDistributionChart from "./color-distribution-chart"
import ProducersChart from "./producers-chart"
import AlgaeMap from "./algae-map"

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

export default function Dashboard() {
  const [algaeData, setAlgaeData] = useState<AlgaeSpecies[]>([])
  const [filteredData, setFilteredData] = useState<AlgaeSpecies[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenus, setSelectedGenus] = useState<string>("all")
  const [selectedColor, setSelectedColor] = useState<string>("all")
  const [selectedProducer, setSelectedProducer] = useState<string>("all")
  const [uniqueGenera, setUniqueGenera] = useState<string[]>([])
  const [uniqueColors, setUniqueColors] = useState<string[]>([])
  const [uniqueProducers, setUniqueProducers] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Algae%20species-All%20species-3kQmN2dbgA7cshCWVPgNjmBu5Or6FM.csv",
        )
        const csvText = await response.text()
        const parsedData = parseCSV(csvText)
        setAlgaeData(parsedData)
        setFilteredData(parsedData)

        // Extract unique values for filters
        const genera = [...new Set(parsedData.map((item) => item.Genus).filter(Boolean))]
        const colors = [...new Set(parsedData.map((item) => item.Color).filter(Boolean))]
        const producers = [
          ...new Set(
            parsedData.flatMap((item) =>
              item.Producers
                ? item.Producers.split(",")
                    .map((p) => p.trim())
                    .filter(Boolean)
                : [],
            ),
          ),
        ]

        setUniqueGenera(genera)
        setUniqueColors(colors)
        setUniqueProducers(producers)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Apply filters
    let result = algaeData

    if (searchTerm) {
      result = result.filter(
        (item) =>
          item["Algae species"].toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item["Common name"] && item["Common name"].toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (selectedGenus !== "all") {
      result = result.filter((item) => item.Genus === selectedGenus)
    }

    if (selectedColor !== "all") {
      result = result.filter((item) => item.Color === selectedColor)
    }

    if (selectedProducer !== "all") {
      result = result.filter((item) => item.Producers && item.Producers.includes(selectedProducer))
    }

    setFilteredData(result)
  }, [searchTerm, selectedGenus, selectedColor, selectedProducer, algaeData])

  const parseCSV = (csvText: string): AlgaeSpecies[] => {
    const lines = csvText.split("\n")
    const headers = lines[0].split(",").map((header) => header.trim())

    return lines
      .slice(1)
      .filter((line) => line.trim())
      .map((line) => {
        const values = line.split(",")
        const entry: any = {}

        headers.forEach((header, index) => {
          entry[header] = values[index] ? values[index].trim() : ""
        })

        return entry as AlgaeSpecies
      })
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedGenus("all")
    setSelectedColor("all")
    setSelectedProducer("all")
  }

  const downloadCSV = () => {
    const headers = Object.keys(filteredData[0] || {}).join(",")
    const rows = filteredData.map((item) => Object.values(item).join(","))
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inspiration Algae Species Dashboard</h1>
          <p className="text-muted-foreground">Explore and analyze {algaeData.length} algae species</p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

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
                        ? item.Producers.split(",")
                            .map((p) => p.trim())
                            .filter(Boolean)
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

      <div className="bg-card rounded-lg p-4 mb-6">
        <div className="flex items-center mb-4">
          <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <Input
              placeholder="Search by species or common name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Select value={selectedGenus} onValueChange={setSelectedGenus}>
              <SelectTrigger>
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
            <Select value={selectedColor} onValueChange={setSelectedColor}>
              <SelectTrigger>
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
            <Select value={selectedProducer} onValueChange={setSelectedProducer}>
              <SelectTrigger>
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
        {(selectedGenus !== "all" || selectedColor !== "all" || selectedProducer !== "all" || searchTerm) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="text-sm text-muted-foreground mr-2">Active filters:</div>
            {selectedGenus !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                Genus: {selectedGenus}
              </Badge>
            )}
            {selectedColor !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                Color: {selectedColor}
              </Badge>
            )}
            {selectedProducer !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                Producer: {selectedProducer}
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="outline" className="flex items-center gap-1">
                Search: {searchTerm}
              </Badge>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="table" className="mb-6">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Algae Species Data</CardTitle>
              <CardDescription>
                Showing {filteredData.length} of {algaeData.length} species
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlgaeTable data={filteredData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="charts" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribution by Genus</CardTitle>
                <CardDescription>Top genera by number of species</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <GenusDistributionChart data={filteredData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Distribution by Color</CardTitle>
                <CardDescription>Species grouped by color</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ColorDistributionChart data={filteredData} />
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Top Producers</CardTitle>
                <CardDescription>Number of species by producer</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ProducersChart data={filteredData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="map" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Approximate locations of producers and species</CardDescription>
            </CardHeader>
            <CardContent className="h-[600px]">
              <AlgaeMap data={filteredData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

