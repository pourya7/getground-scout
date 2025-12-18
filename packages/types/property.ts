/**
 * Represents a property from Rightmove
 */
export interface Property {
    /** Rightmove property ID */
    id: string
    /** Full address of the property */
    address: string
    /** Asking price in GBP */
    price: number
    /** Number of bedrooms */
    bedrooms: number
    /** Number of bathrooms */
    bathrooms: number
    /** Type of property */
    propertyType: "house" | "flat" | "bungalow" | "land" | "commercial" | "unknown"
    /** Rightmove URL */
    url: string
    /** Optional image URL */
    imageUrl?: string
    /** Optional description */
    description?: string
    /** Property tenure (freehold/leasehold) */
    tenure?: "freehold" | "leasehold" | "share of freehold" | "unknown"
}

/**
 * Tax efficiency analysis result
 */
export interface TaxAnalysis {
    propertyId: string
    stampDuty: number
    annualTaxSavings: number
    recommendedStructure: "personal" | "ltd" | "partnership"
    notes: string[]
}

/**
 * Investment pot suggestion
 */
export interface InvestmentPot {
    id: string
    name: string
    description: string
    targetAmount: number
    currentAmount: number
    properties: string[]
}
