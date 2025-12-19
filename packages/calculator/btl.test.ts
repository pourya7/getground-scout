/**
 * Tests for BTL Calculator
 * Run with: npx tsx packages/calculator/btl.test.ts
 */

import { calculateBTLMetrics, calculateStampDuty } from "./btl"

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
// Stamp Duty Tests
// ============================================================================

console.log("\n=== Stamp Duty Tests ===\n")

// Test 1: Property under £250k (first threshold)
{
    const result = calculateStampDuty(200_000, false)
    assert(result.baseTax === 0, "Base tax should be £0 for property under £250k")
    assert(result.additionalSurcharge === 0, "No surcharge for non-additional property")
}

// Test 2: Property under £250k with surcharge
{
    const result = calculateStampDuty(200_000, true)
    assert(result.baseTax === 0, "Base tax should be £0 for property under £250k")
    assert(result.additionalSurcharge === 6000, "3% surcharge on £200k = £6,000")
    assert(result.total === 6000, "Total SDLT = £6,000")
}

// Test 3: £450k property (typical BTL)
{
    const result = calculateStampDuty(450_000, true)
    // Base: (450k - 250k) * 5% = £10,000
    assert(result.baseTax === 10_000, "Base tax for £450k = £10,000")
    // Surcharge: 450k * 3% = £13,500
    assert(result.additionalSurcharge === 13_500, "Surcharge for £450k = £13,500")
    assert(result.total === 23_500, "Total SDLT = £23,500")
}

// Test 4: £1m property
{
    const result = calculateStampDuty(1_000_000, true)
    // Base: (250k * 0%) + (675k * 5%) + (75k * 10%) = £0 + £33,750 + £7,500 = £41,250
    assert(result.baseTax === 41_250, "Base tax for £1m = £41,250")
    assert(result.additionalSurcharge === 30_000, "Surcharge for £1m = £30,000")
    assert(result.total === 71_250, "Total SDLT = £71,250")
}

// ============================================================================
// BTL Metrics Tests
// ============================================================================

console.log("\n=== BTL Metrics Tests ===\n")

// Test 5: Standard BTL calculation
{
    const result = calculateBTLMetrics({
        price: 450_000,
        monthlyRent: 1_800,
        ltv: 0.75,
        interestRate: 0.05
    })

    // Mortgage: 450k * 75% = £337,500
    assert(result.mortgageAmount === 337_500, "Mortgage amount = £337,500")

    // Deposit: 450k * 25% = £112,500
    assert(result.deposit === 112_500, "Deposit = £112,500")

    // Monthly mortgage (interest only): 337,500 * 5% / 12 = £1,406.25
    assertApprox(result.monthlyMortgage, 1406.25, 0.01, "Monthly mortgage ≈ £1,406.25")

    // Stamp duty
    assert(result.stampDuty === 23_500, "Stamp duty = £23,500")

    // Total purchase cost: deposit + stamp duty
    assert(result.totalPurchaseCost === 136_000, "Total purchase cost = £136,000")

    // Gross yield: (1800 * 12) / 450000 = 4.8%
    assertApprox(result.grossYield, 4.8, 0.01, "Gross yield ≈ 4.8%")

    console.log(`  Monthly net profit: £${result.monthlyNetProfit}`)
    console.log(`  Annual net profit: £${result.annualNetProfit}`)
    console.log(`  Return on capital: ${result.returnOnCapital}%`)
}

// Test 6: Low-cost property with no mortgage
{
    const result = calculateBTLMetrics({
        price: 150_000,
        monthlyRent: 700,
        ltv: 0,
        interestRate: 0.05
    })

    assert(result.mortgageAmount === 0, "No mortgage when LTV = 0")
    assert(result.deposit === 150_000, "Full cash purchase")
    assert(result.monthlyMortgage === 0, "No monthly mortgage payment")
    assert(result.monthlyExpenses.mortgage === 0, "Expenses should show £0 mortgage")
}

// Test 7: Leasehold property with ground rent and service charge
{
    const result = calculateBTLMetrics({
        price: 350_000,
        monthlyRent: 1_400,
        groundRent: 400,
        serviceCharge: 2_400
    })

    // Ground rent: £400/year = £33.33/month
    assertApprox(result.monthlyExpenses.groundRent, 33.33, 0.01, "Monthly ground rent ≈ £33.33")

    // Service charge: £2400/year = £200/month
    assert(result.monthlyExpenses.serviceCharge === 200, "Monthly service charge = £200")
}

// Test 8: Edge case - zero price should throw
{
    try {
        calculateBTLMetrics({ price: 0, monthlyRent: 1000 })
        console.log("❌ FAILED: Should throw for zero price")
    } catch (e) {
        console.log("✓ Throws error for zero price")
    }
}

console.log("\n=== All Tests Passed! ===\n")
