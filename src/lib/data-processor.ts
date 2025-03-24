// Define the interface for algae species data based on the provided schema
export interface AlgaeSpecies {
  "Algae species": string
  "Wikipedia Links": string
  "Algae Base Links": string
  "Number of co's": string
  Producers: string
  Genus: string
  Color: string
  "Common name": string
}

/**
 * Parse CSV data into an array of AlgaeSpecies objects
 * Handles CSV parsing with proper handling of quoted fields and commas
 */
export function parseCSVString(csvText: string): AlgaeSpecies[] {
  // Handle different line endings and split by lines
  const lines = csvText.replace(/\r\n/g, "\n").split("\n")

  // Extract headers from the first line
  const headers = parseCSVLine(lines[0])

  // Process each data line
  return lines
    .slice(1)
    .filter((line) => line.trim()) // Skip empty lines
    .map((line) => {
      const values = parseCSVLine(line)
      const entry: Record<string, string> = {}

      // Map values to headers
      headers.forEach((header, index) => {
        entry[header] = values[index] || ""
      })

      return entry as AlgaeSpecies
    })
}

/**
 * Parse a single CSV line, properly handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let currentValue = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      // Handle escaped quotes (double quotes inside quoted fields)
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        currentValue += '"'
        i++ // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // End of field (only if not in quotes)
      values.push(currentValue)
      currentValue = ""
    } else {
      // Add character to current field
      currentValue += char
    }
  }

  // Add the last field
  values.push(currentValue)

  // Clean up values (remove surrounding quotes and trim)
  return values.map((value) => {
    let cleaned = value.trim()
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.substring(1, cleaned.length - 1)
    }
    return cleaned
  })
}

/**
 * Load and parse CSV data from a local file
 */
export async function loadLocalCSV(): Promise<AlgaeSpecies[]> {
  try {
    // In a Next.js environment, we can use the fs module on the server side
    // but for client-side, we'll use a different approach
    if (typeof window === 'undefined') {
      // Server-side code
      const fs = require('fs');
      const path = require('path');
      const csvPath = path.join(process.cwd(), 'data', 'algae-species.csv');
      const csvText = fs.readFileSync(csvPath, 'utf8');
      return parseCSVString(csvText);
    } else {
      // Client-side code - use a relative path that will be handled by Next.js API routes
      const response = await fetch('/api/csv');
      if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
      }
      const csvText = await response.text();
      return parseCSVString(csvText);
    }
  } catch (error) {
    console.error("Error loading CSV:", error);
    return [];
  }
}

/**
 * Legacy function maintained for compatibility
 * @deprecated Use loadLocalCSV instead
 */
export async function fetchCSVFromURL(url: string): Promise<AlgaeSpecies[]> {
  console.warn("fetchCSVFromURL is deprecated. Use loadLocalCSV instead.");
  return loadLocalCSV();
}

/**
 * Parse producers with proper handling of quoted fields
 */
export function parseProducers(producersString: string): string[] {
  if (!producersString) return []

  const producers: string[] = []
  let currentProducer = ""
  let inQuotes = false

  for (let i = 0; i < producersString.length; i++) {
    const char = producersString[i]

    if (char === '"') {
      // Handle escaped quotes
      if (inQuotes && i + 1 < producersString.length && producersString[i + 1] === '"') {
        currentProducer += '"'
        i++ // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // End of producer (only if not in quotes)
      producers.push(currentProducer.trim())
      currentProducer = ""
    } else {
      // Add character to current producer
      currentProducer += char
    }
  }

  // Add the last producer
  if (currentProducer.trim()) {
    producers.push(currentProducer.trim())
  }

  // Clean up values (remove surrounding quotes)
  return producers
    .map((producer) => {
      let cleaned = producer.trim()
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1)
      }
      return cleaned
    })
    .filter(Boolean) // Remove empty entries
}

/**
 * Extract unique values from a specific field in the data
 */
export function extractUniqueValues(data: AlgaeSpecies[], field: keyof AlgaeSpecies): string[] {
  return [...new Set(data.map((item) => item[field]).filter(Boolean))].sort()
}

/**
 * Extract unique producers from the data
 */
export function extractUniqueProducers(data: AlgaeSpecies[]): string[] {
  const producers = new Set<string>()

  data.forEach((item) => {
    if (item.Producers) {
      parseProducers(item.Producers).forEach((producer) => producers.add(producer))
    }
  })

  return [...producers].sort()
}

/**
 * Filter algae data based on search criteria
 */
export function filterAlgaeData(
  data: AlgaeSpecies[],
  searchTerm = "",
  genus = "all",
  color = "all",
  producer = "all",
): AlgaeSpecies[] {
  let filteredData = [...data]

  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase()
    filteredData = filteredData.filter(
      (item) =>
        item["Algae species"].toLowerCase().includes(searchLower) ||
        (item["Common name"] && item["Common name"].toLowerCase().includes(searchLower)) ||
        (item["Genus"] && item["Genus"].toLowerCase().includes(searchLower)),
    )
  }

  if (genus !== "all") {
    filteredData = filteredData.filter((item) => item.Genus === genus)
  }

  if (color !== "all") {
    filteredData = filteredData.filter((item) => item.Color === color)
  }

  if (producer !== "all") {
    filteredData = filteredData.filter((item) => {
      if (!item.Producers) return false
      const producers = parseProducers(item.Producers)
      return producers.includes(producer)
    })
  }

  return filteredData
}

/**
 * Analyze data to extract statistics and insights
 */
export function analyzeAlgaeData(data: AlgaeSpecies[]) {
  // Count by genus, color, and producer
  const genusCounts: Record<string, number> = {}
  const colorCounts: Record<string, number> = {}
  const producerCounts: Record<string, number> = {}

  data.forEach((item) => {
    // Count by genus
    if (item.Genus) {
      genusCounts[item.Genus] = (genusCounts[item.Genus] || 0) + 1
    }

    // Count by color
    if (item.Color) {
      colorCounts[item.Color] = (colorCounts[item.Color] || 0) + 1
    }

    // Count by producer
    if (item.Producers) {
      parseProducers(item.Producers).forEach((producer) => {
        producerCounts[producer] = (producerCounts[producer] || 0) + 1
      })
    }
  })

  return {
    totalSpecies: data.length,
    uniqueGenera: Object.keys(genusCounts).length,
    uniqueColors: Object.keys(colorCounts).length,
    uniqueProducers: Object.keys(producerCounts).length,
    withWikipedia: data.filter((item) => item["Wikipedia Links"]).length,
    withAlgaeBase: data.filter((item) => item["Algae Base Links"]).length,
    withCommonName: data.filter((item) => item["Common name"]).length,
    genusCounts,
    colorCounts,
    producerCounts,
  }
}
