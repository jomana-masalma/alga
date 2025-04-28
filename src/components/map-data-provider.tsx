"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { GBIFOccurrence } from '@/types/gbif-types'
import { fetchTaxonKey, fetchGBIFOccurrences } from '@/services/gbif-occurrences'
import { useAlgaeData } from './algae-data-provider'
import debounce from 'lodash/debounce'

// Cache for GBIF responses
const gbifCache = new Map<string, { taxonKey: number; occurrences: GBIFOccurrence[] }>()

interface MapDataContextType {
  occurrences: GBIFOccurrence[];
  isLoading: boolean;
  error: string | null;
}

const MapDataContext = createContext<MapDataContextType>({
  occurrences: [],
  isLoading: true,
  error: null
})

export function useMapData() {
  return useContext(MapDataContext)
}

export function MapDataProvider({ children }: { children: React.ReactNode }) {
  const [occurrences, setOccurrences] = useState<GBIFOccurrence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)
  const isMountedRef = React.useRef(true)

  const {
    filteredData,
    setFailedSpecies,
    setSpeciesWithGBIFData
  } = useAlgaeData()

  // Get unique species names
  const speciesNames = React.useMemo(() => {
    return [...new Set(filteredData.map(item => item["Algae species"]))]
      .filter(name => name && name.trim() !== '')
  }, [filteredData])

  // Process species function separated for better dependency tracking
  const processSpecies = useCallback(async (
    speciesName: string,
    newOccurrences: GBIFOccurrence[],
    successfulSpecies: string[],
    failedSpeciesList: { name: string; error?: string }[]
  ) => {
    if (!isMountedRef.current) return

    try {
      // Check cache first
      if (gbifCache.has(speciesName)) {
        const cached = gbifCache.get(speciesName)!
        newOccurrences.push(...cached.occurrences)
        successfulSpecies.push(speciesName)
        return
      }

      const taxonKey = await fetchTaxonKey(speciesName)
      if (taxonKey) {
        const occurrences = await fetchGBIFOccurrences(taxonKey)
        if (occurrences && occurrences.length > 0) {
          // Cache the response
          gbifCache.set(speciesName, { taxonKey, occurrences })
          newOccurrences.push(...occurrences)
          successfulSpecies.push(speciesName)
        } else {
          failedSpeciesList.push({ name: speciesName, error: 'No occurrences found' })
        }
      } else {
        failedSpeciesList.push({ name: speciesName, error: 'Species not found in GBIF' })
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error(`Error fetching data for ${speciesName}:`, error)
      failedSpeciesList.push({ name: speciesName, error: 'Error fetching data' })
    }
  }, [])

  // Load occurrences function
  const loadOccurrences = useCallback(async () => {
    if (!isMountedRef.current || speciesNames.length === 0) {
      setIsLoading(false)
      return
    }

    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(null)
    setFailedSpecies([])
    setSpeciesWithGBIFData([])

    const newOccurrences: GBIFOccurrence[] = []
    const successfulSpecies: string[] = []
    const failedSpeciesList: { name: string; error?: string }[] = []

    try {
      // Process species in parallel with a concurrency limit
      const concurrencyLimit = 3
      for (let i = 0; i < speciesNames.length; i += concurrencyLimit) {
        if (!isMountedRef.current) break
        const chunk = speciesNames.slice(i, i + concurrencyLimit)
        await Promise.all(
          chunk.map(speciesName =>
            processSpecies(speciesName, newOccurrences, successfulSpecies, failedSpeciesList)
          )
        )
      }

      if (isMountedRef.current) {
        setSpeciesWithGBIFData(successfulSpecies)
        setFailedSpecies(failedSpeciesList)
        setOccurrences(newOccurrences)
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error loading occurrences:', error)
        setError('Failed to load map data')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [speciesNames, setFailedSpecies, setSpeciesWithGBIFData, processSpecies])

  // Create stable debounced function reference
  const debouncedLoadOccurrences = useMemo(
    () => debounce(loadOccurrences, 1000),
    [loadOccurrences]
  )

  useEffect(() => {
    isMountedRef.current = true
    debouncedLoadOccurrences()

    return () => {
      isMountedRef.current = false
      debouncedLoadOccurrences.cancel()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [debouncedLoadOccurrences])

  const value = {
    occurrences,
    isLoading,
    error
  }

  return (
    <MapDataContext.Provider value={value}>
      {children}
    </MapDataContext.Provider>
  )
}