/**
 * Buy-To-Let Investment Calculator
 * 
 * Calculates key metrics for UK property investment analysis including:
 * - Stamp Duty Land Tax (SDLT) with additional property surcharge
 * - Mortgage payments based on LTV and interest rate
 * - Net monthly profit after expenses
 */

// ============================================================================
// Types
// ============================================================================

export interface BTLCalculatorInput {
    /** Property purchase price in GBP */
    price: number
    /** Expected monthly rental income in GBP */
    monthlyRent: number
    /** Loan-to-Value ratio (0-1), default 0.75 */
    ltv?: number
    /** Annual interest rate (0-1), default 0.05 (5%) */
    interestRate?: number
    /** Is this an additional property? Default true for BTL */
    isAdditionalProperty?: boolean
    /** Estimated annual maintenance as % of rent (0-1), default 0.10 */
    maintenancePercent?: number
    /** Annual letting agent fee as % of rent (0-1), default 0.10 */
    agentFeePercent?: number
    /** Estimated annual void period as % (0-1), default 0.0833 (~1 month) */
    voidPercent?: number
    /** Annual buildings insurance in GBP, default 0 (estimate if unknown) */
    annualInsurance?: number
    /** Ground rent for leasehold properties in GBP per year */
    groundRent?: number
    /** Service charge for leasehold properties in GBP per year */
    serviceCharge?: number
}

export interface BTLCalculatorOutput {
    // Purchase costs
    stampDuty: number
    stampDutyBreakdown: StampDutyBreakdown
    deposit: number
    mortgageAmount: number
    totalPurchaseCost: number

    // Monthly figures
    monthlyMortgage: number
    monthlyGrossRent: number
    monthlyExpenses: MonthlyExpenses
    monthlyNetProfit: number

    // Annual figures
    annualGrossRent: number
    annualNetProfit: number

    // Yields
    grossYield: number
    netYield: number
    returnOnCapital: number
}

export interface StampDutyBreakdown {
    baseTax: number
    additionalSurcharge: number
    total: number
    effectiveRate: number
}

export interface MonthlyExpenses {
    mortgage: number
    maintenance: number
    agentFees: number
    voidAllowance: number
    insurance: number
    groundRent: number
    serviceCharge: number
    total: number
}

// ============================================================================
// Stamp Duty Calculator (SDLT)
// ============================================================================

/**
 * UK Stamp Duty Land Tax bands for residential property (2024/25)
 * These are the rates for England and Northern Ireland
 */
const SDLT_BANDS = [
    { threshold: 0, rate: 0 },           // £0 - £250,000: 0%
    { threshold: 250_000, rate: 0.05 },  // £250,001 - £925,000: 5%
    { threshold: 925_000, rate: 0.10 },  // £925,001 - £1,500,000: 10%
    { threshold: 1_500_000, rate: 0.12 } // Above £1,500,000: 12%
]

/** Additional property surcharge rate */
const ADDITIONAL_PROPERTY_SURCHARGE = 0.03 // 3%

/**
 * Calculate Stamp Duty Land Tax for a property purchase
 */
export function calculateStampDuty(
    price: number,
    isAdditionalProperty: boolean = true
): StampDutyBreakdown {
    if (price <= 0) {
        return { baseTax: 0, additionalSurcharge: 0, total: 0, effectiveRate: 0 }
    }

    let baseTax = 0
    let previousThreshold = 0

    for (let i = 0; i < SDLT_BANDS.length; i++) {
        const band = SDLT_BANDS[i]
        const nextThreshold = SDLT_BANDS[i + 1]?.threshold ?? Infinity

        if (price > band.threshold) {
            const taxableInBand = Math.min(price, nextThreshold) - Math.max(previousThreshold, band.threshold)
            baseTax += taxableInBand * band.rate
        }

        previousThreshold = band.threshold
    }

    // Calculate additional property surcharge (3% on entire purchase price)
    const additionalSurcharge = isAdditionalProperty ? price * ADDITIONAL_PROPERTY_SURCHARGE : 0

    const total = baseTax + additionalSurcharge
    const effectiveRate = price > 0 ? total / price : 0

    return {
        baseTax: Math.round(baseTax),
        additionalSurcharge: Math.round(additionalSurcharge),
        total: Math.round(total),
        effectiveRate: Math.round(effectiveRate * 10000) / 10000 // 4 decimal places
    }
}

// ============================================================================
// Mortgage Calculator
// ============================================================================

/**
 * Calculate monthly interest-only mortgage payment
 * BTL mortgages are typically interest-only
 */
export function calculateMonthlyMortgage(
    mortgageAmount: number,
    annualInterestRate: number
): number {
    if (mortgageAmount <= 0 || annualInterestRate <= 0) return 0
    return (mortgageAmount * annualInterestRate) / 12
}

// ============================================================================
// Main BTL Calculator
// ============================================================================

/**
 * Calculate comprehensive Buy-To-Let investment metrics
 * 
 * @param input - Property details and assumptions
 * @returns Complete breakdown of costs, income, and yields
 * 
 * @example
 * ```typescript
 * const metrics = calculateBTLMetrics({
 *   price: 450000,
 *   monthlyRent: 1800,
 *   ltv: 0.75,
 *   interestRate: 0.05
 * })
 * console.log(`Net monthly profit: £${metrics.monthlyNetProfit}`)
 * ```
 */
export function calculateBTLMetrics(input: BTLCalculatorInput): BTLCalculatorOutput {
    // Apply defaults
    const {
        price,
        monthlyRent,
        ltv = 0.75,
        interestRate = 0.05,
        isAdditionalProperty = true,
        maintenancePercent = 0.10,
        agentFeePercent = 0.10,
        voidPercent = 0.0833, // ~1 month per year
        annualInsurance = 0,
        groundRent = 0,
        serviceCharge = 0
    } = input

    // Validate inputs
    if (price <= 0) {
        throw new Error("Property price must be greater than 0")
    }
    if (monthlyRent < 0) {
        throw new Error("Monthly rent cannot be negative")
    }
    if (ltv < 0 || ltv > 1) {
        throw new Error("LTV must be between 0 and 1")
    }

    // Calculate mortgage amounts
    const mortgageAmount = price * ltv
    const deposit = price - mortgageAmount

    // Calculate stamp duty
    const stampDutyBreakdown = calculateStampDuty(price, isAdditionalProperty)

    // Total upfront costs
    const totalPurchaseCost = deposit + stampDutyBreakdown.total

    // Monthly mortgage payment (interest-only)
    const monthlyMortgage = calculateMonthlyMortgage(mortgageAmount, interestRate)

    // Annual rental income
    const annualGrossRent = monthlyRent * 12

    // Calculate monthly expenses
    const monthlyMaintenance = monthlyRent * maintenancePercent
    const monthlyAgentFees = monthlyRent * agentFeePercent
    const monthlyVoidAllowance = monthlyRent * voidPercent
    const monthlyInsurance = annualInsurance / 12
    const monthlyGroundRent = groundRent / 12
    const monthlyServiceCharge = serviceCharge / 12

    const monthlyExpenses: MonthlyExpenses = {
        mortgage: Math.round(monthlyMortgage * 100) / 100,
        maintenance: Math.round(monthlyMaintenance * 100) / 100,
        agentFees: Math.round(monthlyAgentFees * 100) / 100,
        voidAllowance: Math.round(monthlyVoidAllowance * 100) / 100,
        insurance: Math.round(monthlyInsurance * 100) / 100,
        groundRent: Math.round(monthlyGroundRent * 100) / 100,
        serviceCharge: Math.round(monthlyServiceCharge * 100) / 100,
        total: 0
    }

    monthlyExpenses.total = Math.round(
        (monthlyExpenses.mortgage +
            monthlyExpenses.maintenance +
            monthlyExpenses.agentFees +
            monthlyExpenses.voidAllowance +
            monthlyExpenses.insurance +
            monthlyExpenses.groundRent +
            monthlyExpenses.serviceCharge) * 100
    ) / 100

    // Calculate profits
    const monthlyNetProfit = Math.round((monthlyRent - monthlyExpenses.total) * 100) / 100
    const annualNetProfit = Math.round(monthlyNetProfit * 12 * 100) / 100

    // Calculate yields
    const grossYield = price > 0 ? Math.round((annualGrossRent / price) * 10000) / 100 : 0 // As percentage
    const netYield = price > 0 ? Math.round((annualNetProfit / price) * 10000) / 100 : 0
    const returnOnCapital = totalPurchaseCost > 0
        ? Math.round((annualNetProfit / totalPurchaseCost) * 10000) / 100
        : 0

    return {
        // Purchase costs
        stampDuty: stampDutyBreakdown.total,
        stampDutyBreakdown,
        deposit: Math.round(deposit),
        mortgageAmount: Math.round(mortgageAmount),
        totalPurchaseCost: Math.round(totalPurchaseCost),

        // Monthly figures
        monthlyMortgage: monthlyExpenses.mortgage,
        monthlyGrossRent: monthlyRent,
        monthlyExpenses,
        monthlyNetProfit,

        // Annual figures
        annualGrossRent,
        annualNetProfit,

        // Yields (as percentages)
        grossYield,
        netYield,
        returnOnCapital
    }
}
