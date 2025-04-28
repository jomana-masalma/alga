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
 * Data cleaning utilities for consistent processing across all columns
 */
interface DataCleaningRules {
  trimWhitespace: boolean
  removeQuotes: boolean
  normalizeSpacing: boolean
  standardizeEmpty: boolean
  normalizeCase: 'lower' | 'upper' | 'title' | 'none'
}

const defaultCleaningRules: DataCleaningRules = {
  trimWhitespace: true,
  removeQuotes: true,
  normalizeSpacing: true,
  standardizeEmpty: true,
  normalizeCase: 'none'
}

/**
 * Clean a single string value according to specified rules
 */
export function cleanValue(value: string, rules: Partial<DataCleaningRules> = {}): string {
  const appliedRules = { ...defaultCleaningRules, ...rules }
  let cleaned = value

  if (appliedRules.trimWhitespace) {
    cleaned = cleaned.trim()
  }

  if (appliedRules.removeQuotes) {
    cleaned = cleaned.replace(/^["']|["']$/g, '')
  }

  if (appliedRules.normalizeSpacing) {
    cleaned = cleaned.replace(/\s+/g, ' ')
  }

  if (appliedRules.standardizeEmpty && (!cleaned || cleaned === '-')) {
    cleaned = ''
  }

  switch (appliedRules.normalizeCase) {
    case 'lower':
      cleaned = cleaned.toLowerCase()
      break
    case 'upper':
      cleaned = cleaned.toUpperCase()
      break
    case 'title':
      cleaned = cleaned
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      break
  }

  return cleaned
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
        const value = values[index] || ""

        // Apply specific cleaning based on column type
        switch (header) {
          case "Algae species":
            entry[header] = cleanSpeciesName(value)
            break
          case "Wikipedia Links":
          case "Algae Base Links":
            entry[header] = cleanURL(value)
            break
          case "Number of co's":
            entry[header] = cleanValue(value, { standardizeEmpty: true })
            break
          case "Producers":
            entry[header] = value // Will be cleaned when parsed
            break
          case "Genus":
            entry[header] = cleanGenus(value)
            break
          case "Color":
            entry[header] = cleanColor(value)
            break
          case "Common name":
            entry[header] = cleanCommonName(value)
            break
          default:
            entry[header] = cleanValue(value)
        }
      })

      // Validate that all required fields are present
      const requiredFields: (keyof AlgaeSpecies)[] = [
        "Algae species",
        "Wikipedia Links",
        "Algae Base Links",
        "Number of co's",
        "Producers",
        "Genus",
        "Color",
        "Common name"
      ]

      const isValid = requiredFields.every(field => field in entry)
      if (!isValid) {
        console.warn("Invalid CSV entry:", entry)
        return null
      }

      // Cast to unknown first, then to AlgaeSpecies to satisfy TypeScript
      return (entry as unknown) as AlgaeSpecies
    })
    .filter((entry): entry is AlgaeSpecies => entry !== null)
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
      const { promises: fs } = await import('fs');
      const { join } = await import('path');
      const csvPath = join(process.cwd(), 'data', 'algae-species.csv');
      const csvText = await fs.readFile(csvPath, 'utf8');
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
export async function fetchCSVFromURL(): Promise<AlgaeSpecies[]> {
  console.warn("fetchCSVFromURL is deprecated. Use loadLocalCSV instead.");
  return loadLocalCSV();
}

/**
 * Clean producers with consistent formatting
 */
export function parseProducers(producersString: string): string[] {
  if (!producersString) return []

  // Common company suffixes to handle
  const companySuffixes = ['Ltd', 'Ltd.', 'Limited', 'LLC', 'LLC.', 'Inc', 'Inc.', 'Co', 'Co.', 'Corporation', 'Corp', 'Corp.']
  const suffixPattern = new RegExp(`\\s+(${companySuffixes.join('|')})\.?\\s*$`, 'i')

  // Parse CSV-style producer string with proper quote handling
  const producers: string[] = []
  let currentProducer = ""
  let inQuotes = false

  for (let i = 0; i < producersString.length; i++) {
    const char = producersString[i]

    if (char === '"') {
      // Handle escaped quotes (double quotes inside quoted fields)
      if (inQuotes && i + 1 < producersString.length && producersString[i + 1] === '"') {
        currentProducer += '"'
        i++ // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      // End of producer (only if not in quotes)
      if (currentProducer.trim()) {
        producers.push(currentProducer.trim())
      }
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

  // Clean each producer
  return producers
    .map(producer => {
      let cleaned = cleanValue(producer, {
        trimWhitespace: true,
        removeQuotes: true,
        normalizeSpacing: true,
        standardizeEmpty: true
      })

      // Skip empty values early
      if (!cleaned) return ''

      // Handle special case where Co., Ltd. appears
      if (cleaned.includes('Co., Ltd')) {
        cleaned = cleaned.replace(/\s*Co\.,\s*Ltd\.?/, ' Co., Ltd.')
      }
      // Handle other company suffixes
      else {
        const suffixMatch = cleaned.match(suffixPattern)
        if (suffixMatch) {
          const suffix = suffixMatch[1]
          // Remove the matched suffix and any trailing dots
          cleaned = cleaned.replace(suffixPattern, '')
          // Add back standardized suffix
          if (suffix.toLowerCase().startsWith('ltd')) {
            cleaned += ' Ltd.'
          } else if (suffix.toLowerCase().startsWith('llc')) {
            cleaned += ' LLC'
          } else if (suffix.toLowerCase().startsWith('inc')) {
            cleaned += ' Inc.'
          } else if (suffix.toLowerCase().startsWith('co')) {
            cleaned += ' Co.'
          } else if (suffix.toLowerCase().startsWith('corp')) {
            cleaned += ' Corp.'
          }
        }
      }

      return cleaned
    })
    .filter(Boolean)
}

/**
 * Clean species name with consistent formatting
 */
export function cleanSpeciesName(name: string): string {
  return cleanValue(name, {
    trimWhitespace: true,
    removeQuotes: true,
    normalizeSpacing: true,
    standardizeEmpty: true
  })
}

/**
 * Clean genus with consistent formatting
 */
export function cleanGenus(genus: string): string {
  const cleaned = cleanValue(genus, {
    trimWhitespace: true,
    removeQuotes: true,
    normalizeSpacing: true,
    standardizeEmpty: true,
    normalizeCase: 'title'
  })

  // Log warning for potentially problematic genus names
  if (cleaned && !/^[A-Z][a-z]+$/.test(cleaned)) {
    console.warn(`Unusual genus format detected: ${cleaned}`)
  }

  return cleaned
}

/**
 * Clean color with consistent formatting
 */
export function cleanColor(color: string): string {
  return cleanValue(color, {
    trimWhitespace: true,
    removeQuotes: true,
    normalizeSpacing: true,
    standardizeEmpty: true,
    normalizeCase: 'title'
  })
}

/**
 * Clean common name with consistent formatting
 */
export function cleanCommonName(name: string): string {
  return cleanValue(name, {
    trimWhitespace: true,
    removeQuotes: true,
    normalizeSpacing: true,
    standardizeEmpty: true,
    normalizeCase: 'title'
  })
}

/**
 * Clean URL with consistent formatting
 */
export function cleanURL(url: string): string {
  return cleanValue(url, {
    trimWhitespace: true,
    removeQuotes: true,
    normalizeSpacing: false,
    standardizeEmpty: true
  })
}

/**
 * Extract unique values from a specific field in the data
 */
export function extractUniqueValues(data: AlgaeSpecies[], field: keyof AlgaeSpecies): string[] {
  const values = new Set<string>()
  const emptyCount = { count: 0 }

  data.forEach(item => {
    const value = item[field]
    if (value && value.trim()) {
      values.add(value.trim())
    } else {
      emptyCount.count++
    }
  })

  // Log statistics about empty/missing values
  if (emptyCount.count > 0) {
    console.warn(`Found ${emptyCount.count} empty/missing values for field: ${field}`)
  }

  return [...values].sort()
}

/**
 * Extract unique producers from the data
 */
export function extractUniqueProducers(data: AlgaeSpecies[]): string[] {
  const producers = new Set<string>()
  const beforeCleaning = new Set<string>()
  const afterCleaning = new Set<string>()

  data.forEach((item) => {
    if (item.Producers) {
      // Store raw producers before cleaning
      item.Producers.split(',').forEach(p => beforeCleaning.add(p.trim()))

      // Store cleaned producers
      const cleanedProducers = parseProducers(item.Producers)
      cleanedProducers.forEach(p => {
        afterCleaning.add(p)
        producers.add(p)
      })
    }
  })

  console.log('Producer counts:', {
    rawProducersCount: beforeCleaning.size,
    cleanedProducersCount: afterCleaning.size,
    rawProducers: Array.from(beforeCleaning).sort(),
    cleanedProducers: Array.from(afterCleaning).sort()
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
    // Case-insensitive genus comparison and handle whitespace
    const normalizedGenus = genus.trim().toLowerCase()
    filteredData = filteredData.filter((item) => {
      // Track items with missing genus
      if (!item.Genus) {
        console.debug(`Species missing genus: ${item["Algae species"]}`)
        return false
      }
      return item.Genus.trim().toLowerCase() === normalizedGenus
    })
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
