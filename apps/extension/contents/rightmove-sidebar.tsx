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

// Toggle button icon components
const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
    </svg>
)

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
)

const RightmoveSidebar = () => {
    const [property, setProperty] = useState<Property | null>(null)
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(true)

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
        <div className={`fixed top-20 right-0 z-[9999] flex items-start transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-2rem)]'}`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="
                    flex items-center justify-center
                    w-8 h-12 
                    bg-gradient-to-b from-primary-500 to-primary-600
                    hover:from-primary-400 hover:to-primary-500
                    text-white
                    rounded-l-lg
                    shadow-lg
                    transition-colors duration-300 ease-in-out
                    border-y border-l border-primary-400
                "
                title={isOpen ? "Close sidebar" : "Open sidebar"}
                aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
            >
                {isOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </button>

            {/* Sidebar Panel */}
            <div
                className={`
                    w-80 bg-white rounded-l-xl shadow-2xl border border-gray-200 border-r-0 overflow-hidden
                    transition-opacity duration-300 ease-in-out
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                `}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <span className="text-white text-base font-bold">GS</span>
                        </div>
                        <div>
                            <h2 className="text-white font-semibold text-sm tracking-wide">GetGround Scout</h2>
                            <p className="text-primary-100 text-xs">Property Analysis</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-50 rounded-full mb-3">
                                <svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <p className="text-gray-500 text-sm">Extracting property data...</p>
                        </div>
                    ) : property ? (
                        <>
                            {/* Property Info */}
                            <div className="space-y-2">
                                <h3 className="text-gray-900 font-medium text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                                    Property Details
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
                                    <p className="text-gray-700 text-sm line-clamp-2 font-medium">{property.address}</p>
                                    <p className="text-primary-600 font-bold text-xl">{formatPrice(property.price)}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                            {property.bedrooms} bed
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                            </svg>
                                            {property.bathrooms} bath
                                        </span>
                                        <span className="capitalize px-2 py-0.5 bg-gray-200 rounded text-gray-600">{property.propertyType}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tenure */}
                            <div className="space-y-2">
                                <h3 className="text-gray-900 font-medium text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                                    Tenure
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${property.tenure === "freehold"
                                        ? "bg-green-100 text-green-700 border border-green-200"
                                        : property.tenure === "leasehold"
                                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                                            : property.tenure === "share of freehold"
                                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                                : "bg-gray-100 text-gray-600 border border-gray-200"
                                        }`}>
                                        {formatTenure(property.tenure)}
                                    </span>
                                </div>
                            </div>

                            {/* Description Preview */}
                            {property.description && (
                                <div className="space-y-2">
                                    <h3 className="text-gray-900 font-medium text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                                        Description
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                        <p className="text-gray-600 text-xs leading-relaxed line-clamp-4">{property.description}</p>
                                    </div>
                                </div>
                            )}

                            {/* Placeholder sections */}
                            <div className="space-y-2">
                                <h3 className="text-gray-900 font-medium text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-primary-300 rounded-full"></span>
                                    Tax Efficiency
                                </h3>
                                <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-lg p-4 text-center border border-primary-100">
                                    <p className="text-primary-600 text-xs font-medium">Coming soon...</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-gray-900 font-medium text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-primary-300 rounded-full"></span>
                                    Investment Pots
                                </h3>
                                <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-lg p-4 text-center border border-primary-100">
                                    <p className="text-primary-600 text-xs font-medium">Coming soon...</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 rounded-full mb-3">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <p className="text-red-500 text-sm font-medium">Failed to extract property data</p>
                            <p className="text-gray-400 text-xs mt-1">Please refresh the page</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 border-t border-gray-200">
                    <p className="text-gray-400 text-xs text-center">
                        Powered by{" "}
                        <a
                            href="https://www.getground.co.uk"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 font-medium hover:text-primary-700 hover:underline transition-colors"
                        >
                            GetGround
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RightmoveSidebar
