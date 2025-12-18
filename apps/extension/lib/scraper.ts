import type { Property } from "@getground-scout/types"

/**
 * Wraps the main world script extraction with a Promise
 * that waits for the postMessage response from MAIN world
 */
export function extractPropertyData(): Promise<Property | null> {
    return new Promise((resolve) => {
        let resolved = false

        // Set up listener for main world response (postMessage works across world boundaries)
        const handler = (event: MessageEvent) => {
            // Only handle messages from our extension
            if (event.data?.type !== "getground-scout-property-data") return

            if (resolved) return
            resolved = true
            window.removeEventListener("message", handler)

            if (event.data.payload) {
                console.log("[GetGround Scout] Received property data from main world:", event.data.payload)
                resolve(event.data.payload as Property)
            } else {
                console.log("[GetGround Scout] No data received, falling back to DOM")
                resolve(extractFromDOM())
            }
        }

        window.addEventListener("message", handler)

        // Timeout fallback in case main world script hasn't run yet
        setTimeout(() => {
            if (resolved) return
            resolved = true
            window.removeEventListener("message", handler)
            console.log("[GetGround Scout] Timeout waiting for main world, falling back to DOM")
            resolve(extractFromDOM())
        }, 2000)
    })
}

/**
 * Check if current URL is a Rightmove property page
 */
export function isPropertyPage(): boolean {
    return /\/properties\/\d+/.test(window.location.pathname)
}

/**
 * Sanitize price string to number
 */
function sanitizePrice(priceStr: string | undefined): number {
    if (!priceStr) return 0
    const cleaned = priceStr.replace(/[^0-9]/g, "")
    return parseInt(cleaned, 10) || 0
}

/**
 * Map tenure string to type
 */
function mapTenure(tenure: string | undefined): Property["tenure"] {
    if (!tenure) return "unknown"
    const lower = tenure.toLowerCase()

    if (lower.includes("freehold") && lower.includes("share")) return "share of freehold"
    if (lower.includes("freehold")) return "freehold"
    if (lower.includes("leasehold")) return "leasehold"
    return "unknown"
}

/**
 * Extract property ID from URL
 */
function extractPropertyId(): string {
    const match = window.location.pathname.match(/\/properties\/(\d+)/)
    return match ? match[1] : ""
}

/**
 * DOM fallback scraper
 */
function extractFromDOM(): Property | null {
    console.log("[GetGround Scout] DOM scraping fallback")

    try {
        // Price
        const priceEl = document.querySelector('[data-testid="property-price"]') ||
            document.querySelector('._1gfnqJ3Vtd1z40MlC0MzXu') ||
            document.querySelector('[class*="price"]')
        const priceText = priceEl?.textContent || ""

        // Address
        const addressEl = document.querySelector('[data-testid="address"]') ||
            document.querySelector('h1[class*="address"]') ||
            document.querySelector('address')
        const address = addressEl?.textContent?.trim() || ""

        // Description
        const descEl = document.querySelector('[data-testid="property-description"]') ||
            document.querySelector('[class*="description"]')
        const description = descEl?.textContent?.trim() || ""

        // Tenure
        const tenureEl = document.querySelector('[data-testid="tenure"]') ||
            Array.from(document.querySelectorAll('dt, li')).find(el =>
                el.textContent?.toLowerCase().includes('tenure'))
        const tenureText = tenureEl?.nextElementSibling?.textContent ||
            tenureEl?.textContent || ""

        // Bedrooms/Bathrooms
        const bedsMatch = document.body.textContent?.match(/(\d+)\s*bed/i)
        const bathsMatch = document.body.textContent?.match(/(\d+)\s*bath/i)

        if (!address && !priceText) {
            console.log("[GetGround Scout] DOM scraping failed - no data found")
            return null
        }

        return {
            id: extractPropertyId(),
            address,
            price: sanitizePrice(priceText),
            bedrooms: bedsMatch ? parseInt(bedsMatch[1], 10) : 0,
            bathrooms: bathsMatch ? parseInt(bathsMatch[1], 10) : 0,
            propertyType: "unknown",
            url: window.location.href,
            description,
            tenure: mapTenure(tenureText),
        }
    } catch (error) {
        console.error("[GetGround Scout] DOM scraping error:", error)
        return null
    }
}
