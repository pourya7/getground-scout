import cssText from "data-text:~style.css"
import { useEffect, useState, useMemo } from "react"
import type { PlasmoCSConfig } from "plasmo"
import type { Property } from "@getground-scout/types"
import { calculateBTLMetrics, calculateSection24Tax, type TaxBand } from "@getground-scout/calculator"
import { extractPropertyData } from "../lib/scraper"

// Risk data type from extraction API
interface PropertyRisk {
    leaseYears: number | null
    groundRent: number | null
    reviewPeriod: string | null
    serviceCharge: number | null
    tenure: 'freehold' | 'leasehold' | 'share of freehold' | 'unknown'
    // Red flag fields
    hasDoublingClause: boolean
    shortLeaseWarning: boolean
    redFlagSummary: string | null
}

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
    const [monthlyRentInput, setMonthlyRentInput] = useState<string>("")
    const [taxBand, setTaxBand] = useState<TaxBand>(0.40)
    const [riskData, setRiskData] = useState<PropertyRisk | null>(null)
    const [riskLoading, setRiskLoading] = useState(false)

    useEffect(() => {
        // Extract property data on mount (now async)
        extractPropertyData().then((data) => {
            setProperty(data)
            setLoading(false)
            // Initial rent estimate (e.g., 5% yield)
            if (data?.price) {
                const estimatedRent = Math.round((data.price * 0.05) / 12)
                setMonthlyRentInput(estimatedRent.toString())
            }
        })
    }, [])

    // Memoize BTL calculations
    const btlMetrics = useMemo(() => {
        if (!property || !property.price) return null
        const rent = parseInt(monthlyRentInput) || 0
        try {
            return calculateBTLMetrics({
                price: property.price,
                monthlyRent: rent,
                ltv: 0.75, // Default assumption
                interestRate: 0.05 // Default assumption
            })
        } catch (e) {
            return null
        }
    }, [property, monthlyRentInput])

    // Memoize Section 24 tax comparison
    const section24Metrics = useMemo(() => {
        if (!btlMetrics) return null
        const annualRent = btlMetrics.annualGrossRent
        const annualFinanceCost = btlMetrics.monthlyMortgage * 12
        const annualExpenses = (btlMetrics.monthlyExpenses.total - btlMetrics.monthlyMortgage) * 12
        try {
            return calculateSection24Tax({
                annualRent,
                annualFinanceCost,
                annualExpenses,
                taxBand
            })
        } catch (e) {
            return null
        }
    }, [btlMetrics, taxBand])

    // Format price as currency
    const formatPrice = (price: number) => {
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

                            {/* Investment Input */}
                            <div className="space-y-2">
                                <h3 className="text-gray-900 font-medium text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                                    Investment Analysis
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-100">
                                    <div className="space-y-1">
                                        <label htmlFor="monthly-rent" className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                            Estimated Monthly Rent
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">£</span>
                                            <input
                                                id="monthly-rent"
                                                type="number"
                                                value={monthlyRentInput}
                                                onChange={(e) => setMonthlyRentInput(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-7 pr-3 text-sm font-medium text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/10 transition-all"
                                                placeholder="e.g. 1800"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Results */}
                            {btlMetrics && (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Stamp Duty</p>
                                            <p className="text-gray-700 font-bold text-sm">{formatPrice(btlMetrics.stampDuty)}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Net Monthly</p>
                                            <p className={`font-bold text-sm ${btlMetrics.monthlyNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatPrice(btlMetrics.monthlyNetProfit)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-primary-50 rounded-xl p-4 border border-primary-100 space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Gross Yield</span>
                                            <span className="text-primary-700 font-bold">{btlMetrics.grossYield}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Effective Stamp Duty</span>
                                            <span className="text-primary-700 font-semibold">{btlMetrics.stampDutyBreakdown.effectiveRate * 100}%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs pt-2 border-t border-primary-100">
                                            <span className="text-gray-600 font-medium">Return on Capital</span>
                                            <span className="text-primary-700 font-bold text-sm">{btlMetrics.returnOnCapital}%</span>
                                        </div>
                                    </div>

                                    {/* Monthly Breakdown */}
                                    <div className="space-y-2">
                                        <h3 className="text-gray-900 font-medium text-sm flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-primary-300 rounded-full"></span>
                                            Monthly Breakdown
                                        </h3>
                                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100 text-[11px]">
                                            <div className="flex justify-between text-gray-500">
                                                <span>Mortgage (75% LTV @ 5%)</span>
                                                <span className="font-medium text-gray-700">-{formatPrice(btlMetrics.monthlyMortgage)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-500">
                                                <span>Running Costs (Est.)</span>
                                                <span className="font-medium text-gray-700">-{formatPrice(btlMetrics.monthlyExpenses.total - btlMetrics.monthlyMortgage)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-500 pt-1 border-t border-gray-200">
                                                <span className="font-medium text-gray-700">Total Expenses</span>
                                                <span className="font-bold text-red-600">-{formatPrice(btlMetrics.monthlyExpenses.total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 24 Tax Comparison */}
                                    {section24Metrics && (
                                        <div className="space-y-2">
                                            <h3 className="text-gray-900 font-medium text-sm flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                                                Personal vs Company Tax
                                            </h3>
                                            <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-100">
                                                {/* Tax Band Toggle */}
                                                <div className="space-y-1">
                                                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                                        Your Tax Band
                                                    </label>
                                                    <div className="flex rounded-lg overflow-hidden border border-gray-200">
                                                        {([0.20, 0.40, 0.45] as TaxBand[]).map((rate) => (
                                                            <button
                                                                key={rate}
                                                                onClick={() => setTaxBand(rate)}
                                                                className={`flex-1 py-1.5 text-xs font-medium transition-all ${taxBand === rate
                                                                    ? 'bg-primary-500 text-white'
                                                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                {rate * 100}%
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Tax Comparison */}
                                                <div className="space-y-2 pt-2 border-t border-gray-200">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-500">Personal Tax (Section 24)</span>
                                                        <span className="font-bold text-red-600">{formatPrice(section24Metrics.personalTax)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-500">Company Tax (SPV)</span>
                                                        <span className="font-bold text-gray-700">{formatPrice(section24Metrics.companyTax)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-200">
                                                        <span className="font-medium text-gray-700">Annual Saving</span>
                                                        <span className={`font-bold text-sm ${section24Metrics.annualSaving > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                                            {section24Metrics.annualSaving > 0 ? '+' : ''}{formatPrice(section24Metrics.annualSaving)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

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

                            {/* Risk Dashboard */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-gray-900 font-medium text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                        Risk Dashboard
                                    </h3>
                                    {!riskData && !riskLoading && property.description && (
                                        <button
                                            onClick={async () => {
                                                setRiskLoading(true)
                                                try {
                                                    const res = await fetch('http://localhost:3000/api/extract', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ text: property.description })
                                                    })
                                                    if (res.ok) {
                                                        const data = await res.json()
                                                        setRiskData(data)
                                                    }
                                                } catch (e) {
                                                    console.error('Risk extraction failed:', e)
                                                } finally {
                                                    setRiskLoading(false)
                                                }
                                            }}
                                            className="text-[10px] px-2 py-1 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors font-medium"
                                        >
                                            Analyze with AI
                                        </button>
                                    )}
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    {riskLoading ? (
                                        <div className="flex items-center justify-center py-2">
                                            <svg className="animate-spin h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="ml-2 text-xs text-gray-500">Analyzing...</span>
                                        </div>
                                    ) : riskData ? (
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Lease Length</span>
                                                <span className={`font-bold ${riskData.leaseYears !== null && riskData.leaseYears < 80 ? 'text-red-600' : riskData.leaseYears !== null && riskData.leaseYears < 125 ? 'text-amber-600' : 'text-gray-700'}`}>
                                                    {riskData.leaseYears !== null ? `${riskData.leaseYears} years` : '—'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Ground Rent</span>
                                                <span className={`font-bold ${riskData.groundRent !== null && riskData.groundRent > 250 ? 'text-red-600' : riskData.groundRent !== null && riskData.groundRent > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                                                    {riskData.groundRent !== null ? formatPrice(riskData.groundRent) + '/yr' : '—'}
                                                </span>
                                            </div>
                                            {riskData.reviewPeriod && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500">Review Period</span>
                                                    <span className="font-medium text-amber-600">{riskData.reviewPeriod}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Service Charge</span>
                                                <span className="font-bold text-gray-700">
                                                    {riskData.serviceCharge !== null ? formatPrice(riskData.serviceCharge) + '/yr' : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-xs text-center py-2">Click "Analyze with AI" to extract risk data</p>
                                    )}
                                </div>

                                {/* Warning Badge for Red Flags */}
                                {riskData && (riskData.hasDoublingClause || riskData.shortLeaseWarning) && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">⚠️</span>
                                            <span className="text-red-700 font-bold text-sm">Warning: Critical Issues Found</span>
                                        </div>
                                        <div className="space-y-1">
                                            {riskData.shortLeaseWarning && (
                                                <div className="flex items-start gap-2 text-xs text-red-700">
                                                    <span className="font-bold">🔴</span>
                                                    <span>Short lease (&lt;80 years) — Most lenders will refuse mortgages. Expensive extension required.</span>
                                                </div>
                                            )}
                                            {riskData.hasDoublingClause && (
                                                <div className="flex items-start gap-2 text-xs text-red-700">
                                                    <span className="font-bold">🔴</span>
                                                    <span>Escalating ground rent — Many lenders now refuse these properties entirely.</span>
                                                </div>
                                            )}
                                        </div>
                                        {riskData.redFlagSummary && (
                                            <p className="text-xs text-red-600 italic pt-1 border-t border-red-200">
                                                {riskData.redFlagSummary}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Dead Money Calculator */}
                            {btlMetrics && btlMetrics.deposit > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-gray-900 font-medium text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                        Dead Money Calculator
                                    </h3>
                                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-200 space-y-3">
                                        <p className="text-xs text-gray-600">
                                            Your <span className="font-bold text-gray-800">{formatPrice(btlMetrics.deposit)}</span> deposit sits idle during conveyancing (typically 3-6 months).
                                        </p>

                                        {/* Interest Calculation at 5.1% yield */}
                                        {(() => {
                                            const yield51 = 0.051 // 5.1% annual yield from WealthKernel
                                            const deposit = btlMetrics.deposit
                                            const interest3mo = Math.round(deposit * yield51 * (3 / 12))
                                            const interest6mo = Math.round(deposit * yield51 * (6 / 12))

                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-500">3 months @ 5.1%</span>
                                                        <span className="font-bold text-green-600">+{formatPrice(interest3mo)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-gray-500">6 months @ 5.1%</span>
                                                        <span className="font-bold text-green-600">+{formatPrice(interest6mo)}</span>
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        <div className="pt-2 border-t border-amber-200">
                                            <p className="text-[11px] text-amber-800 font-medium">
                                                💰 You could earn <span className="font-bold">{formatPrice(Math.round(btlMetrics.deposit * 0.051 * 0.5))}</span> with a GetGround Investment Pot instead of leaving it in a solicitor's account.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
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

                {/* Footer with CTA */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-t border-gray-200 space-y-2">
                    {property && (
                        <a
                            href={`https://www.getground.co.uk/start?price=${encodeURIComponent(property.price)}&address=${encodeURIComponent(property.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                                flex items-center justify-center gap-2
                                w-full py-2.5 px-4
                                bg-gradient-to-r from-primary-500 to-primary-600
                                hover:from-primary-400 hover:to-primary-500
                                text-white text-sm font-semibold
                                rounded-lg shadow-md
                                transition-all duration-200
                                hover:shadow-lg hover:-translate-y-0.5
                            "
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Buy with GetGround
                        </a>
                    )}
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
