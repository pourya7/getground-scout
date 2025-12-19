/**
 * Tests for Section 24 Tax Calculator
 * Run with: npx tsx packages/calculator/section24.test.ts
 */

import { calculateSection24Tax } from "./section24"

// Test helper
function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`❌ FAILED: ${message}`)
    }
    console.log(`✓ ${message}`)
}

function assertApprox(actual: number, expected: number, tolerance: number, message: string) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`❌ FAILED: ${message} - Expected ~${expected}, got ${actual}`)
    }
    console.log(`✓ ${message}`)
}

// ============================================================================
// Section 24 Tests
// ============================================================================

console.log("\n=== Section 24 Tax Comparator Tests ===\n")

// Test 1: Higher-rate taxpayer (40%) - typical scenario
{
    console.log("Test 1: Higher-rate taxpayer (40%)")
    const result = calculateSection24Tax({
        annualRent: 21600,
        annualFinanceCost: 11250,
        annualExpenses: 2000,
        taxBand: 0.40
    })

    // Personal Tax: (21600 - 2000) * 0.40 - (11250 * 0.20) = 7840 - 2250 = 5590
    assertApprox(result.personalTax, 5590, 0.01, "Personal tax = £5,590")

    // Company Tax: (21600 - 2000 - 11250) * 0.25 = 8350 * 0.25 = 2087.50
    assertApprox(result.companyTax, 2087.50, 0.01, "Company tax = £2,087.50")

    // Saving: 5590 - 2087.50 = 3502.50
    assertApprox(result.annualSaving, 3502.50, 0.01, "Annual saving = £3,502.50")

    console.log("")
}

// Test 2: Basic-rate taxpayer (20%) - no Section 24 penalty
{
    console.log("Test 2: Basic-rate taxpayer (20%)")
    const result = calculateSection24Tax({
        annualRent: 21600,
        annualFinanceCost: 11250,
        annualExpenses: 2000,
        taxBand: 0.20
    })

    // Personal Tax: (21600 - 2000) * 0.20 - (11250 * 0.20) = 3920 - 2250 = 1670
    assertApprox(result.personalTax, 1670, 0.01, "Personal tax = £1,670")

    // Company Tax: same = 2087.50
    assertApprox(result.companyTax, 2087.50, 0.01, "Company tax = £2,087.50")

    // Saving: 1670 - 2087.50 = -417.50 (company is WORSE for basic rate)
    assertApprox(result.annualSaving, -417.50, 0.01, "Annual saving = -£417.50 (personal is better)")

    console.log("")
}

// Test 3: Additional-rate taxpayer (45%)
{
    console.log("Test 3: Additional-rate taxpayer (45%)")
    const result = calculateSection24Tax({
        annualRent: 21600,
        annualFinanceCost: 11250,
        annualExpenses: 2000,
        taxBand: 0.45
    })

    // Personal Tax: (21600 - 2000) * 0.45 - (11250 * 0.20) = 8820 - 2250 = 6570
    assertApprox(result.personalTax, 6570, 0.01, "Personal tax = £6,570")

    // Company Tax: same = 2087.50
    assertApprox(result.companyTax, 2087.50, 0.01, "Company tax = £2,087.50")

    // Saving: 6570 - 2087.50 = 4482.50
    assertApprox(result.annualSaving, 4482.50, 0.01, "Annual saving = £4,482.50")

    console.log("")
}

// Test 4: Zero finance costs (no mortgage)
{
    console.log("Test 4: Zero finance costs (no mortgage)")
    const result = calculateSection24Tax({
        annualRent: 12000,
        annualFinanceCost: 0,
        annualExpenses: 1000,
        taxBand: 0.40
    })

    // Personal Tax: (12000 - 1000) * 0.40 - 0 = 4400
    assertApprox(result.personalTax, 4400, 0.01, "Personal tax = £4,400")

    // Company Tax: (12000 - 1000 - 0) * 0.25 = 2750
    assertApprox(result.companyTax, 2750, 0.01, "Company tax = £2,750")

    // Saving: 4400 - 2750 = 1650
    assertApprox(result.annualSaving, 1650, 0.01, "Annual saving = £1,650")

    console.log("")
}

// Test 5: Loss-making company (no Corporation Tax due)
{
    console.log("Test 5: Loss-making company scenario")
    const result = calculateSection24Tax({
        annualRent: 10000,
        annualFinanceCost: 12000,
        annualExpenses: 2000,
        taxBand: 0.40
    })

    // Personal Tax: (10000 - 2000) * 0.40 - (12000 * 0.20) = 3200 - 2400 = 800
    assertApprox(result.personalTax, 800, 0.01, "Personal tax = £800")

    // Company Tax: (10000 - 2000 - 12000) * 0.25 = -4000 * 0.25 = 0 (no negative tax)
    assert(result.companyTax === 0, "Company tax = £0 (loss)")

    console.log("")
}

// Test 6: Edge case - zero rent
{
    console.log("Test 6: Edge case - zero rent")
    const result = calculateSection24Tax({
        annualRent: 0,
        annualFinanceCost: 5000,
        annualExpenses: 0,
        taxBand: 0.40
    })

    // Personal Tax: max(0 * 0.40 - 5000 * 0.20, 0) = max(-1000, 0) = 0
    assert(result.personalTax === 0, "Personal tax = £0 (no negative tax)")
    assert(result.companyTax === 0, "Company tax = £0")

    console.log("")
}

console.log("=== All Section 24 Tests Passed! ===\n")
