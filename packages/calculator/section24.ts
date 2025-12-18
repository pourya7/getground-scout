/**
 * Section 24 Tax Comparator
 * 
 * Compares Personal vs Company (SPV) tax liability for UK property investors.
 * 
 * Section 24 restricts personal landlords from deducting mortgage interest as an expense.
 * Instead, they only receive a 20% tax credit on finance costs—meaning higher-rate 
 * taxpayers (40%/45%) pay significantly more tax than under the old rules.
 * 
 * Key Formula (Personal Tax):
 *   Personal Tax = (Rental Profit * Tax Rate) - (Finance Costs * 0.20)
 *   Where Rental Profit = Revenue - Non-Finance Expenses (mortgage interest NOT deductible)
 * 
 * Company Tax:
 *   Full mortgage interest remains deductible, then Corporation Tax (25%) applies.
 */

// ============================================================================
// Types
// ============================================================================

export type TaxBand = 0.20 | 0.40 | 0.45

export interface Section24Input {
    /** Annual rental income in GBP */
    annualRent: number
    /** Annual finance costs (mortgage interest) in GBP */
    annualFinanceCost: number
    /** Annual non-finance expenses (maintenance, agent fees, etc.) in GBP */
    annualExpenses?: number
    /** Personal income tax band rate (0.20, 0.40, or 0.45) */
    taxBand: TaxBand
}

export interface Section24Output {
    /** Tax payable if held personally (with Section 24 restrictions) */
    personalTax: number
    /** Tax payable if held in a company (SPV) */
    companyTax: number
    /** Annual saving from using a company (positive = company is better) */
    annualSaving: number
    /** Breakdown of the calculation */
    breakdown: {
        // Personal calculation
        personalRentalProfit: number
        personalTaxBeforeCredit: number
        section24TaxCredit: number
        // Company calculation
        companyProfit: number
    }
}

// ============================================================================
// Constants
// ============================================================================

/** Corporation Tax rate (2024/25) */
const CORPORATION_TAX_RATE = 0.25

/** Section 24 tax credit rate (basic rate) */
const SECTION_24_CREDIT_RATE = 0.20

// ============================================================================
// Calculator
// ============================================================================

/**
 * Calculate and compare Personal vs Company tax liability
 * 
 * @example
 * ```typescript
 * const result = calculateSection24Tax({
 *   annualRent: 21600,
 *   annualFinanceCost: 11250,
 *   annualExpenses: 2000,
 *   taxBand: 0.40
 * })
 * console.log(`Save £${result.annualSaving} with a company`)
 * ```
 */
export function calculateSection24Tax(input: Section24Input): Section24Output {
    const {
        annualRent,
        annualFinanceCost,
        annualExpenses = 0,
        taxBand
    } = input

    // Validate inputs
    if (annualRent < 0) {
        throw new Error("Annual rent cannot be negative")
    }
    if (annualFinanceCost < 0) {
        throw new Error("Annual finance cost cannot be negative")
    }

    // -------------------------------------------------------------------------
    // Personal Tax Calculation (Section 24)
    // -------------------------------------------------------------------------
    // Under Section 24, finance costs are NOT deductible from rental income.
    // You pay tax on: Revenue - Non-Finance Expenses
    // Then receive a tax credit at basic rate (20%) on finance costs

    const personalRentalProfit = annualRent - annualExpenses
    const personalTaxBeforeCredit = personalRentalProfit * taxBand
    const section24TaxCredit = annualFinanceCost * SECTION_24_CREDIT_RATE
    const personalTax = Math.max(0, personalTaxBeforeCredit - section24TaxCredit)

    // -------------------------------------------------------------------------
    // Company Tax Calculation
    // -------------------------------------------------------------------------
    // In a company, full finance costs remain deductible, then Corp Tax applies

    const companyProfit = annualRent - annualExpenses - annualFinanceCost
    const companyTax = companyProfit > 0 ? companyProfit * CORPORATION_TAX_RATE : 0

    // -------------------------------------------------------------------------
    // Savings
    // -------------------------------------------------------------------------
    const annualSaving = personalTax - companyTax

    return {
        personalTax: Math.round(personalTax * 100) / 100,
        companyTax: Math.round(companyTax * 100) / 100,
        annualSaving: Math.round(annualSaving * 100) / 100,
        breakdown: {
            personalRentalProfit: Math.round(personalRentalProfit * 100) / 100,
            personalTaxBeforeCredit: Math.round(personalTaxBeforeCredit * 100) / 100,
            section24TaxCredit: Math.round(section24TaxCredit * 100) / 100,
            companyProfit: Math.round(companyProfit * 100) / 100
        }
    }
}
