import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import type { Property } from "@getground-scout/types"

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
    // Placeholder property data - will be extracted from page in future
    const property: Property = {
        id: "",
        address: "Loading...",
        price: 0,
        bedrooms: 0,
        bathrooms: 0,
        propertyType: "unknown",
        url: window.location.href,
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
                {/* Property Info */}
                <div className="space-y-2">
                    <h3 className="text-gray-900 font-medium text-sm">Property Details</h3>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <p className="text-gray-700 text-sm truncate">{property.address}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{property.bedrooms} bed</span>
                            <span>{property.bathrooms} bath</span>
                            <span className="capitalize">{property.propertyType}</span>
                        </div>
                    </div>
                </div>

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
