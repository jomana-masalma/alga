import axios from 'axios'

// Create axios instance with timeout and retry configuration
const gbifAxios = axios.create({
  timeout: 10000, // 10 seconds timeout
  headers: {
    'User-Agent': 'AlgaeDB/1.0', // Custom user agent
  }
})

// Add retry logic for network errors
gbifAxios.interceptors.response.use(undefined, async (error) => {
  // Only retry on network errors, not on 4xx/5xx responses
  if (error.message === 'Network Error' && error.config && !error.config.__isRetry) {
    error.config.__isRetry = true
    console.log('Retrying network request...')
    return gbifAxios(error.config)
  }
  return Promise.reject(error)
})

export interface GBIFOccurrence {
  key: string;
  scientificName: string;
  decimalLatitude: number;
  decimalLongitude: number;
  eventDate?: string;
  media?: {
    identifier: string;
    title?: string;
  }[];
}

export interface GBIFSpeciesMatch {
  usageKey: number;
  scientificName: string;
  canonicalName: string;
  rank: string;
  status: string;
  confidence: number;
  matchType: string;
  kingdom: string;
  phylum: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  kingdomKey: number;
  phylumKey: number;
  classKey?: number;
  orderKey?: number;
  familyKey?: number;
  genusKey?: number;
  speciesKey?: number;
  synonym: boolean;
  taxonID?: string;
}

export interface GBIFSpecies {
  key: number;
  scientificName: string;
  canonicalName: string;
  vernacularNames?: { vernacularName: string; language: string }[];
  descriptions?: { description: string; language: string; type: string }[];
  kingdom: string;
  phylum: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  genusKey?: number;
  familyKey?: number;
  media?: {
    identifier: string;
    title?: string;
    format?: string;
    type?: string;
  }[];
  synonyms?: string[];
}

// Original GBIF API base URL for direct calls
const GBIF_API_BASE = 'https://api.gbif.org/v1'
// Local API route for proxied requests
const LOCAL_API_ROUTE = '/api/gbif'
// Fallback CORS proxy for direct GBIF calls if needed
const CORS_PROXY_URL = 'https://cors-anywhere.herokuapp.com/'

// Cache for API responses to reduce API calls
const speciesMatchCache = new Map<string, GBIFSpeciesMatch>()
const speciesDetailsCache = new Map<number, GBIFSpecies>()
const occurrencesCache = new Map<number, GBIFOccurrence[]>()

// Global in-memory taxonomic database for common species
// This helps speed up common species lookups without API calls
const COMMON_TAXA = {
  "Fucus vesiculosus": { usageKey: 2563239, kingdom: "Plantae", phylum: "Phaeophyta" },
  "Saccharina latissima": { usageKey: 2397026, kingdom: "Chromista", phylum: "Ochrophyta" },
  "Laminaria digitata": { usageKey: 2397025, kingdom: "Chromista", phylum: "Ochrophyta" },
  "Ulva lactuca": { usageKey: 2399815, kingdom: "Plantae", phylum: "Chlorophyta" },
  "Porphyra umbilicalis": { usageKey: 2667199, kingdom: "Plantae", phylum: "Rhodophyta" },
  "Alaria esculenta": { usageKey: 2396889, kingdom: "Chromista", phylum: "Ochrophyta" },
  "Palmaria palmata": { usageKey: 2664150, kingdom: "Plantae", phylum: "Rhodophyta" },
  "Himanthalia elongata": { usageKey: 2397056, kingdom: "Chromista", phylum: "Ochrophyta" },
  "Undaria pinnatifida": { usageKey: 2397034, kingdom: "Chromista", phylum: "Ochrophyta" },
  "Ascophyllum nodosum": { usageKey: 2396916, kingdom: "Chromista", phylum: "Ochrophyta" }
};

// Mapping of taxonomic synonyms to accepted names
// This helps with species that might be in GBIF under a different name
const TAXONOMIC_SYNONYMS: Record<string, string> = {
  // Synonyms for common algae
  "Fucus sp.": "Fucus vesiculosus",
  "Laminaria sp.": "Laminaria digitata",
  "Ulva sp.": "Ulva lactuca",
  "Porphyra sp.": "Porphyra umbilicalis",
  "Chondrus crispus": "Chondrus crispus",
  "Codium fragile": "Codium fragile",
  "Enteromorpha sp.": "Ulva intestinalis", // Enteromorpha is now Ulva
  "Enteromorpha intestinalis": "Ulva intestinalis",
  "Enteromorpha compressa": "Ulva compressa",
  "Laminaria hyperborea": "Laminaria hyperborea",
  "Laminaria saccharina": "Saccharina latissima", // Taxonomic update
  "Sargassum muticum": "Sargassum muticum",
  "Macrocystis pyrifera": "Macrocystis pyrifera",
  "Gracilaria sp.": "Gracilaria gracilis",
  "Gelidium sp.": "Gelidium corneum",
  "Cystoseira sp.": "Cystoseira baccata",
  "Calliblepharis sp.": "Calliblepharis ciliata",
  "Cladophora sp.": "Cladophora rupestris",
  "Mastocarpus stellatus": "Mastocarpus stellatus",
  "Dilsea carnosa": "Dilsea carnosa",
  "Grateloupia turuturu": "Grateloupia turuturu",
  "Chorda filum": "Chorda filum",
  "Bifurcaria bifurcata": "Bifurcaria bifurcata",
  "Ectocarpus sp.": "Ectocarpus siliculosus",
  "Eisenia arborea": "Eisenia arborea",
  "Polysiphonia sp.": "Polysiphonia fucoides",
  "Asparagopsis sp.": "Asparagopsis armata",
  "Ceramium sp.": "Ceramium virgatum",
  "Sphaerotrichia divaricata": "Sphaerotrichia divaricata",
  // Add any additional synonyms here
};

/**
 * Helper function to handle taxonomic synonyms
 */
function resolveSynonym(name: string): string {
  const normalizedName = name.trim();
  return TAXONOMIC_SYNONYMS[normalizedName] || normalizedName;
}

/**
 * Helper function to fetch GBIF data using our local API route first,
 * then fallback to direct API calls with CORS handling if needed
 */
async function fetchGBIFData(endpoint: string, params: Record<string, any> = {}) {
  // Try using our local API route first (preferred method)
  try {
    const searchParams = new URLSearchParams({
      endpoint,
      ...params
    })

    const fullLocalUrl = `${LOCAL_API_ROUTE}?${searchParams.toString()}`
    console.log(`Attempting local API request: ${fullLocalUrl}`)

    const response = await fetch(fullLocalUrl)
    if (!response.ok) {
      throw new Error(`Local API route error: ${response.status} - ${response.statusText}`)
    }
    return await response.json()
  } catch (localApiError) {
    console.warn('Local API route failed, falling back to direct GBIF API call:', localApiError)

    // Fall back to direct API call with CORS handling
    try {
      // Convert params to URL parameters
      const queryParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map(v => `${key}=${encodeURIComponent(v)}`).join('&')
          }
          return `${key}=${encodeURIComponent(String(value))}`
        })
        .join('&')

      const fullUrl = `${GBIF_API_BASE}/${endpoint}${queryParams ? '?' + queryParams : ''}`
      console.log(`Attempting direct GBIF API request: ${fullUrl}`)

      const response = await fetch(fullUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`)
      }
      return await response.json()
    } catch (directApiError) {
      console.error(`Error with direct GBIF API call:`, directApiError)

      // Last resort: try with CORS proxy
      if (directApiError instanceof Error &&
          (directApiError.message.includes('CORS') || directApiError.message === 'Network Error')) {
        console.log('Trying request with CORS proxy...')
        try {
          // Convert params to URL parameters again for the proxy request
          const proxyQueryParams = Object.entries(params)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return value.map(v => `${key}=${encodeURIComponent(v)}`).join('&')
              }
              return `${key}=${encodeURIComponent(String(value))}`
            })
            .join('&')

          const fullProxyUrl = `${GBIF_API_BASE}/${endpoint}${proxyQueryParams ? '?' + proxyQueryParams : ''}`
          console.log(`Attempting CORS proxy request: ${fullProxyUrl}`)

          const proxyResponse = await fetch(CORS_PROXY_URL + fullProxyUrl)
          if (!proxyResponse.ok) {
            throw new Error(`HTTP error with proxy! Status: ${proxyResponse.status} - ${proxyResponse.statusText}`)
          }
          return await proxyResponse.json()
        } catch (proxyError) {
          console.error('Proxy request also failed:', proxyError)
          throw proxyError
        }
      }

      throw directApiError
    }
  }
}

/**
 * Find the best match for a species name using GBIF Species Match API
 * Optimized with predefined common species data
 */
export async function matchSpeciesName(name: string): Promise<GBIFSpeciesMatch | null> {
  if (!name) return null

  // Resolve any known synonyms first
  const resolvedName = resolveSynonym(name);

  // Check for common species first (fastest path)
  const normalizedName = resolvedName.trim();
  if (COMMON_TAXA[normalizedName as keyof typeof COMMON_TAXA]) {
    const commonData = COMMON_TAXA[normalizedName as keyof typeof COMMON_TAXA];
    const matchData = {
      usageKey: commonData.usageKey,
      scientificName: normalizedName,
      canonicalName: normalizedName,
      kingdom: commonData.kingdom,
      phylum: commonData.phylum,
      rank: "SPECIES",
      status: "ACCEPTED",
      matchType: "EXACT",
      confidence: 100,
      synonym: false,
      // Add other required fields with default values
      kingdomKey: 0,
      phylumKey: 0
    } as GBIFSpeciesMatch;

    speciesMatchCache.set(name.trim().toLowerCase(), matchData);
    return matchData;
  }

  // Check cache first (using original name as key)
  const cacheKey = name.trim().toLowerCase();
  if (speciesMatchCache.has(cacheKey)) {
    return speciesMatchCache.get(cacheKey) || null;
  }

  // If the name was resolved to a synonym and is different
  if (resolvedName !== name) {
    // Try to match the resolved name and cache under the original name
    try {
      const matchResult = await matchSpeciesName(resolvedName);
      if (matchResult) {
        // Store in cache under original name
        speciesMatchCache.set(cacheKey, matchResult);
        return matchResult;
      }
    } catch (error) {
      console.warn(`Error matching resolved synonym ${resolvedName}:`, error);
    }
  }

  // Try to exact match variants (with/without author)
  // This helps catch species names with author info
  if (normalizedName.includes(" ")) {
    const parts = normalizedName.split(" ");
    // If it looks like "Genus species var/f./ssp. something"
    if (parts.length > 2) {
      const simplifiedName = parts.slice(0, 2).join(" ");
      // Check if we have a cached version of the simplified name
      if (speciesMatchCache.has(simplifiedName.toLowerCase())) {
        const match = speciesMatchCache.get(simplifiedName.toLowerCase());
        if (match) {
          speciesMatchCache.set(cacheKey, match);
          return match;
        }
      }
    }
  }

  try {
    console.log(`Attempting to match species name: ${normalizedName}`);
    const data = await fetchGBIFData('species/match', { name: normalizedName, verbose: true })

    if (data && data.usageKey) {
      speciesMatchCache.set(cacheKey, data)
      return data
    }

    // Try with fuzzy matching for genus + epithet
    if (normalizedName.includes(" ")) {
      const [genus, ...rest] = normalizedName.split(" ");
      // Try just the genus and first epithet
      const simpleName = `${genus} ${rest[0]}`;

      try {
        console.log(`Attempting fuzzy match for: ${simpleName}`);
        const fuzzyData = await fetchGBIFData('species/match', {
          name: simpleName,
          verbose: true,
          strict: false
        });

        if (fuzzyData && fuzzyData.usageKey) {
          // Store under original name but mark confidence lower
          fuzzyData.confidence = Math.min(fuzzyData.confidence, 80);
          speciesMatchCache.set(cacheKey, fuzzyData);
          return fuzzyData;
        }
      } catch (fuzzyError) {
        console.warn(`Fuzzy matching failed for ${simpleName}`, fuzzyError);
      }
    }

    return null
  } catch (error) {
    console.error(`Error matching species name for "${name}":`, error)
    return null
  }
}

/**
 * Get detailed species information using taxonKey
 */
export async function getSpeciesDetails(taxonKey: number): Promise<GBIFSpecies | null> {
  if (!taxonKey) return null

  // Check cache first
  if (speciesDetailsCache.has(taxonKey)) {
    return speciesDetailsCache.get(taxonKey) || null
  }

  try {
    const data = await fetchGBIFData(`species/${taxonKey}`, { verbose: true })

    if (data && data.key) {
      // Get vernacular names and descriptions if available
      const [vernacularData, descriptionsData] = await Promise.allSettled([
        fetchGBIFData(`species/${taxonKey}/vernacularNames`),
        fetchGBIFData(`species/${taxonKey}/descriptions`)
      ])

      const speciesData: GBIFSpecies = {
        ...data,
        vernacularNames: vernacularData.status === 'fulfilled' ? vernacularData.value.results : [],
        descriptions: descriptionsData.status === 'fulfilled' ? descriptionsData.value.results : []
      }

      speciesDetailsCache.set(taxonKey, speciesData)
      return speciesData
    }
    return null
  } catch (error) {
    console.error(`Error fetching species details for taxonKey ${taxonKey}:`, error)
    return null
  }
}

/**
 * Get the taxon key for a given species name
 * Enhanced to use species match API for better results
 */
export async function fetchTaxonKey(speciesName: string): Promise<number | null> {
  if (!speciesName) return null

  try {
    // Use the matchSpeciesName function for better matching
    const match = await matchSpeciesName(speciesName)

    if (match && match.usageKey) {
      return match.usageKey
    }

    // If no match found, try fallback to the original search endpoint
    const data = await fetchGBIFData('species/search', { q: speciesName, limit: 1 })

    if (data.results && data.results.length > 0) {
      return data.results[0].key
    }

    return null
  } catch (error) {
    console.error(`Error fetching taxon key for ${speciesName}:`, error)
    return null
  }
}

/**
 * Fetch GBIF occurrences for a given taxon key with improved filtering
 */
export async function fetchGBIFOccurrences(
  taxonKey: number,
  limit: number = 50,
  hasCoordinate: boolean = true,
  hasImages: boolean = false
): Promise<GBIFOccurrence[]> {
  if (!taxonKey) return []

  // Check cache first
  if (occurrencesCache.has(taxonKey)) {
    return occurrencesCache.get(taxonKey) || []
  }

  try {
    // Use the improved fetchGBIFData function
    const data = await fetchGBIFData('occurrence/search', {
      taxonKey,
      limit,
      hasCoordinate,
      hasImage: hasImages,
      // Additional parameters for better quality data
      hasGeospatialIssue: false,
      status: 'ACCEPTED'
    })

    if (data.results) {
      const occurrences = data.results.map((occ: any) => ({
        key: occ.key,
        scientificName: occ.scientificName,
        decimalLatitude: occ.decimalLatitude,
        decimalLongitude: occ.decimalLongitude,
        eventDate: occ.eventDate,
        media: occ.media
      }));

      occurrencesCache.set(taxonKey, occurrences)
      return occurrences
    }

    return []
  } catch (error) {
    console.error(`Error fetching GBIF occurrences for taxonKey ${taxonKey}:`, error)
    return []
  }
}

/**
 * Get map tile URL for a taxon
 */
export function getGBIFMapUrl(taxonKey: number, style: 'classic' | 'purpleHeat' | 'greenHeat' = 'classic'): string {
  return `https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@1x.png?taxonKey=${taxonKey}&style=${style}`
}

/**
 * Search for species by name with suggested alternatives
 */
export async function searchSpecies(query: string, limit: number = 10): Promise<GBIFSpeciesMatch[]> {
  if (!query || query.length < 3) return []

  try {
    const data = await fetchGBIFData('species/suggest', { q: query, limit })
    return data || []
  } catch (error) {
    console.error(`Error searching species for query "${query}":`, error)
    return []
  }
}

/**
 * Get a list of related species or higher taxonomy when no occurrences found
 */
export async function getRelatedSpecies(taxonKey: number, limit: number = 10): Promise<GBIFSpecies[]> {
  if (!taxonKey) return []

  try {
    // Get species details first to identify higher taxonomy
    const species = await getSpeciesDetails(taxonKey)
    if (!species) return []

    // Try to get species in the same genus
    const genusKey = species.genusKey
    if (genusKey) {
      const data = await fetchGBIFData('species/search', {
        genusKey,
        limit,
        status: 'ACCEPTED',
        rank: 'SPECIES'
      })

      if (data.results && data.results.length > 0) {
        return data.results
      }
    }

    // Fallback to family if no genus results
    const familyKey = species.familyKey
    if (familyKey) {
      const data = await fetchGBIFData('species/search', {
        familyKey,
        limit,
        status: 'ACCEPTED',
        rank: 'SPECIES'
      })

      if (data.results && data.results.length > 0) {
        return data.results
      }
    }

    return []
  } catch (error) {
    console.error(`Error fetching related species for taxonKey ${taxonKey}:`, error)
    return []
  }
}

/**
 * Clear all caches - useful when reloading data
 */
export function clearGBIFCaches(): void {
  speciesMatchCache.clear()
  speciesDetailsCache.clear()
  occurrencesCache.clear()
}

// Add a bulk matching function for better performance
export async function bulkMatchSpeciesNames(names: string[]): Promise<Record<string, GBIFSpeciesMatch | null>> {
  const results: Record<string, GBIFSpeciesMatch | null> = {};
  const needToFetch: string[] = [];

  // First check cache and common species
  for (const name of names) {
    if (!name) continue;

    const normalizedName = name.trim();
    const cacheKey = normalizedName.toLowerCase();

    // Check common species first
    if (COMMON_TAXA[normalizedName as keyof typeof COMMON_TAXA]) {
      const commonData = COMMON_TAXA[normalizedName as keyof typeof COMMON_TAXA];
      results[normalizedName] = {
        usageKey: commonData.usageKey,
        scientificName: normalizedName,
        canonicalName: normalizedName,
        kingdom: commonData.kingdom,
        phylum: commonData.phylum,
        rank: "SPECIES",
        status: "ACCEPTED",
        matchType: "EXACT",
        confidence: 100,
        synonym: false,
        kingdomKey: 0,
        phylumKey: 0
      } as GBIFSpeciesMatch;

      // Also cache for future use
      speciesMatchCache.set(cacheKey, results[normalizedName]);
      continue;
    }

    // Check cache
    if (speciesMatchCache.has(cacheKey)) {
      results[normalizedName] = speciesMatchCache.get(cacheKey) || null;
      continue;
    }

    // Need to fetch this one
    needToFetch.push(normalizedName);
  }

  // Process remaining species in parallel batches
  if (needToFetch.length > 0) {
    // Process in batches of 10
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 300; // ms between batches

    for (let i = 0; i < needToFetch.length; i += BATCH_SIZE) {
      const batch = needToFetch.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (name) => {
          try {
            console.log(`Batch matching species name: ${name}`);
            const match = await matchSpeciesName(name);
            results[name] = match;
          } catch (error) {
            console.error(`Error in batch matching for ${name}:`, error);
            results[name] = null;
          }
        })
      );

      // Add delay between batches to avoid rate limits
      if (i + BATCH_SIZE < needToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }
  }

  return results;
}
