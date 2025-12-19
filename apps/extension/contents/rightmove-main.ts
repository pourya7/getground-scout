/**
 * Main World Script - Extracts PAGE_MODEL data from Rightmove
 * 
 * This script runs in the MAIN world (same context as the page)
 * so it can access window.PAGE_MODEL directly.
 * It sends data back to the content script via CustomEvent.
 */

import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
    matches: ["https://www.rightmove.co.uk/properties/*"],
    world: "MAIN",
    run_at: "document_idle",
}

interface PropertyData {
    id: string
    address: string
    price: number
    bedrooms: number
    bathrooms: number
    propertyType: string
    tenure: string
    description: string
    url: string
}

function sanitizePrice(priceStr: string | undefined): number {
    if (!priceStr) return 0
    const cleaned = priceStr.replace(/[^0-9]/g, "")
    return parseInt(cleaned, 10) || 0
}

function mapPropertyType(type: string | undefined): string {
    if (!type) return "unknown"
    const lower = type.toLowerCase()

    if (lower.includes("flat") || lower.includes("apartment") || lower.includes("maisonette")) {
        return "flat"
    }
    if (lower.includes("bungalow")) return "bungalow"
    if (lower.includes("land") || lower.includes("plot")) return "land"
    if (lower.includes("commercial") || lower.includes("retail") || lower.includes("office")) return "commercial"
    if (lower.includes("house") || lower.includes("terrace") || lower.includes("detached") || lower.includes("semi")) {
        return "house"
    }
    return "unknown"
}

function mapTenure(tenure: string | undefined): string {
    if (!tenure) return "unknown"
    const lower = tenure.toLowerCase()

    if (lower.includes("freehold") && lower.includes("share")) return "share of freehold"
    if (lower.includes("freehold")) return "freehold"
    if (lower.includes("leasehold")) return "leasehold"
    return "unknown"
}

function stripHtml(html: string | undefined): string {
    if (!html) return ""
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function extractPropertyId(): string {
    const match = window.location.pathname.match(/\/properties\/(\d+)/)
    return match ? match[1] : ""
}

function extractPageModelData(): PropertyData | null {
    // @ts-ignore - PAGE_MODEL is added by Rightmove
    const pageModel = window.PAGE_MODEL
    const data = pageModel?.propertyData

    if (!data) {
        console.log("[GetGround Scout Main] PAGE_MODEL.propertyData not found")
        return null
    }

    return {
        id: data.id?.toString() || extractPropertyId(),
        address: data.address?.displayAddress || "",
        price: sanitizePrice(data.prices?.primaryPrice),
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        propertyType: mapPropertyType(data.propertySubType || data.propertyTypeFullDescription),
        tenure: mapTenure(data.tenure?.tenureType),
        description: stripHtml(data.text?.description),
        url: window.location.href,
    }
}

// Execute immediately and store data
const propertyData = extractPageModelData()
console.log("[GetGround Scout Main] Extracted property data:", propertyData)

// Store data on window for content script to access
// @ts-ignore
window.__GETGROUND_SCOUT_DATA__ = propertyData

// Listen for requests from the sidebar (in case it missed the initial postMessage)
window.addEventListener("message", (event) => {
    if (event.data?.type === "getground-scout-request-data") {
        console.log("[GetGround Scout Main] Sidebar requested data, sending current state:", propertyData)
        window.postMessage({
            type: "getground-scout-property-data",
            payload: propertyData
        }, "*")
    }
})

// Use postMessage to communicate across world boundaries (MAIN -> ISOLATED)
window.postMessage({
    type: "getground-scout-property-data",
    payload: propertyData
}, "*")
