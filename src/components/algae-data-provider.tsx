"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  type AlgaeSpecies,
  extractUniqueValues,
  extractUniqueProducers,
  filterAlgaeData,
  parseCSVString,
  loadLocalCSV,
  analyzeAlgaeData,
} from "@/lib/data-processor"

// Define the context type
interface AlgaeDataContextType {
  algaeData: AlgaeSpecies[]
  filteredData: AlgaeSpecies[]
  uniqueGenera: string[]
  uniqueColors: string[]
  uniqueProducers: string[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedGenus: string
  setSelectedGenus: (genus: string) => void
  selectedColor: string
  setSelectedColor: (color: string) => void
  selectedProducer: string
  setSelectedProducer: (producer: string) => void
  resetFilters: () => void
  loading: boolean
  uploadCSV: (csvText: string) => void
  dataStats: ReturnType<typeof analyzeAlgaeData> | null
}

// Create the context
const AlgaeDataContext = createContext<AlgaeDataContextType | undefined>(undefined)

// Create a provider component
export function AlgaeDataProvider({ children }: { children: ReactNode }) {
  const [algaeData, setAlgaeData] = useState<AlgaeSpecies[]>([])
  const [filteredData, setFilteredData] = useState<AlgaeSpecies[]>([])
  const [uniqueGenera, setUniqueGenera] = useState<string[]>([])
  const [uniqueColors, setUniqueColors] = useState<string[]>([])
  const [uniqueProducers, setUniqueProducers] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenus, setSelectedGenus] = useState("all")
  const [selectedColor, setSelectedColor] = useState("all")
  const [selectedProducer, setSelectedProducer] = useState("all")
  const [loading, setLoading] = useState(true)
  const [dataStats, setDataStats] = useState<ReturnType<typeof analyzeAlgaeData> | null>(null)

  // Load initial data from local CSV file
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const data = await loadLocalCSV()
        processLoadedData(data)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Process loaded data
  const processLoadedData = (data: AlgaeSpecies[]) => {
    setAlgaeData(data)
    setFilteredData(data)

    // Extract unique values for filters
    setUniqueGenera(extractUniqueValues(data, "Genus"))
    setUniqueColors(extractUniqueValues(data, "Color"))
    setUniqueProducers(extractUniqueProducers(data))

    // Analyze data
    setDataStats(analyzeAlgaeData(data))
  }

  // Apply filters when filter criteria change
  useEffect(() => {
    const filtered = filterAlgaeData(algaeData, searchTerm, selectedGenus, selectedColor, selectedProducer)
    setFilteredData(filtered)
  }, [algaeData, searchTerm, selectedGenus, selectedColor, selectedProducer])

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setSelectedGenus("all")
    setSelectedColor("all")
    setSelectedProducer("all")
  }

  // Handle CSV upload
  const uploadCSV = (csvText: string) => {
    try {
      setLoading(true)
      const parsedData = parseCSVString(csvText)
      processLoadedData(parsedData)
    } catch (error) {
      console.error("Error processing CSV:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlgaeDataContext.Provider
      value={{
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
      }}
    >
      {children}
    </AlgaeDataContext.Provider>
  )
}

// Create a hook to use the context
export function useAlgaeData() {
  const context = useContext(AlgaeDataContext)
  if (context === undefined) {
    throw new Error("useAlgaeData must be used within an AlgaeDataProvider")
  }
  return context
}
