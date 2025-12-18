import cssText from "data-text:~style.css"
import { useEffect, useState } from "react"
import type { PlasmoCSConfig } from "plasmo"
import type { Property } from "@getground-scout/types"
import { extractPropertyData } from "../lib/scraper"

export const config: PlasmoCSConfig = {
    matches: ["https://www.rightmove.co.uk/properties/*"],
    all_frames: false,
}

// Inject Tailwind styles into Shadow DOM
export const getStyle = () => {
    const style = document.createElement("style")
    // Replace :root with :host for Shadow DOM compatibility
    style.textContent = cssText.replaceAll(":root", ":host(plasmo-csui)")
    return style
}

// Anchor sidebar to right side of page
export const getShadowHostId = () => "getground-scout-sidebar"

const RightmoveSidebar = () => {
    const [property, setProperty] = useState<Property | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Extract property data on mount (now async)
        extractPropertyData().then((data) => {
            setProperty(data)
            setLoading(false)
        })
    }, [])

    // Format price as currency
    const formatPrice = (price: number) => {
        if (!price) return "N/A"
        return new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0,
        }).format(price)
    }

    // Format tenure for display
    const formatTenure = (tenure: Property["tenure"]) => {
        if (!tenure || tenure === "unknown") return "Unknown"
        return tenure.charAt(0).toUpperCase() + tenure.slice(1)
    }

    return (
        <div className="fixed top-20 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[9999]">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">GG</span>
                    </div>
                    <div>
                        <h2 className="text-white font-semibold text-sm">GetGround Scout</h2>
                        <p className="text-primary-100 text-xs">Property Analysis</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-4">
                        <p className="text-gray-500 text-sm">Extracting property data...</p>
                    </div>
                ) : property ? (
                    <>
                        {/* Property Info */}
                        <div className="space-y-2">
                            <h3 className="text-gray-900 font-medium text-sm">Property Details</h3>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <p className="text-gray-700 text-sm line-clamp-2">{property.address}</p>
                                <p className="text-primary-600 font-semibold text-lg">{formatPrice(property.price)}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{property.bedrooms} bed</span>
                                    <span>{property.bathrooms} bath</span>
                                    <span className="capitalize">{property.propertyType}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tenure */}
                        <div className="space-y-2">
                            <h3 className="text-gray-900 font-medium text-sm">Tenure</h3>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${property.tenure === "freehold"
                                        ? "bg-green-100 text-green-800"
                                        : property.tenure === "leasehold"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-gray-100 text-gray-800"
                                    }`}>
                                    {formatTenure(property.tenure)}
                                </span>
                            </div>
                        </div>

                        {/* Description Preview */}
                        {property.description && (
                            <div className="space-y-2">
                                <h3 className="text-gray-900 font-medium text-sm">Description</h3>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-gray-600 text-xs line-clamp-3">{property.description}</p>
                                </div>
                            </div>
                        )}

                        {/* Placeholder sections */}
                        <div className="space-y-2">
                            <h3 className="text-gray-900 font-medium text-sm">Tax Efficiency</h3>
                            <div className="bg-primary-50 rounded-lg p-3 text-center">
                                <p className="text-primary-600 text-xs">Coming soon...</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-gray-900 font-medium text-sm">Investment Pots</h3>
                            <div className="bg-primary-50 rounded-lg p-3 text-center">
                                <p className="text-primary-600 text-xs">Coming soon...</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-red-500 text-sm">Failed to extract property data</p>
                        <p className="text-gray-400 text-xs mt-1">Please refresh the page</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
                <p className="text-gray-400 text-xs text-center">
                    Powered by GetGround
                </p>
            </div>
        </div>
    )
}

export default RightmoveSidebar
