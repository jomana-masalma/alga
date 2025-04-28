export interface GBIFOccurrence {
  key: string;
  scientificName: string;
  decimalLatitude: number;
  decimalLongitude: number;
  eventDate?: string;
  media?: Array<{
    type?: string;
    identifier?: string;
    title?: string;
  }>;
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
  key?: number;
}

export interface GBIFSpecies {
  key: number;
  usageKey: number;
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