/**
 * WealthKernel Mock Integration
 * 
 * Mock service that simulates WealthKernel's API structure for Money Market Funds.
 * This allows projecting returns on idle cash held in GetGround's cash management feature.
 * 
 * Interfaces are named to mirror WealthKernel's actual API structure.
 * @see https://docs.wealthkernel.com/
 */

// ============================================================================
// WealthKernel API Interfaces
// ============================================================================

/**
 * Represents an asset in the WealthKernel portfolio
 * @interface IWealthKernelAsset
 */
export interface IWealthKernelAsset {
    /** Unique identifier for the asset */
    id: string
    /** Human-readable asset name */
    name: string
    /** ISIN code for the asset */
    isin: string
    /** Asset class type */
    assetClass: 'money_market_fund' | 'equity' | 'bond' | 'etf'
    /** Current yield as a decimal (e.g., 0.051 for 5.1%) */
    currentYield: number
    /** Currency code */
    currency: 'GBP' | 'USD' | 'EUR'
    /** Whether the asset is currently available for investment */
    isActive: boolean
    /** Minimum investment amount in pence/cents */
    minimumInvestment: number
    /** Last updated timestamp */
    updatedAt: string
}

/**
 * Represents a pot/bucket for holding cash or investments
 * @interface IPot
 */
export interface IPot {
    /** Unique identifier for the pot */
    id: string
    /** User-defined pot name */
    name: string
    /** Current balance in pence */
    balance: number
    /** Asset ID if invested, null if cash */
    assetId: string | null
    /** Current value including any returns */
    currentValue: number
    /** Total returns earned */
    totalReturns: number
    /** Currency code */
    currency: 'GBP' | 'USD' | 'EUR'
    /** Pot creation date */
    createdAt: string
}

/**
 * Response from yield calculation
 */
export interface IYieldProjection {
    /** Principal amount in GBP */
    principal: number
    /** Annual yield rate as decimal */
    annualYield: number
    /** Projected annual return in GBP */
    projectedAnnualReturn: number
    /** Projected monthly return in GBP */
    projectedMonthlyReturn: number
}

// ============================================================================
// Mock Data
// ============================================================================

/**
 * Mock Money Market Fund asset
 * Based on typical UK Money Market Fund characteristics
 */
const MOCK_MONEY_MARKET_FUND: IWealthKernelAsset = {
    id: 'mmf-001',
    name: 'GetGround Cash Plus',
    isin: 'GB00MOCK1234',
    assetClass: 'money_market_fund',
    currentYield: 0.051, // 5.1% current yield
    currency: 'GBP',
    isActive: true,
    minimumInvestment: 100, // £1 minimum
    updatedAt: new Date().toISOString()
}

// ============================================================================
// Mock Service
// ============================================================================

/**
 * Mock WealthKernel client for development/demo purposes
 */
export class WealthKernelMockClient {
    private assets: IWealthKernelAsset[] = [MOCK_MONEY_MARKET_FUND]

    /**
     * Get all available Money Market Funds
     */
    async getMoneyMarketFunds(): Promise<IWealthKernelAsset[]> {
        // Simulate API latency
        await this.simulateLatency()
        return this.assets.filter(a => a.assetClass === 'money_market_fund' && a.isActive)
    }

    /**
     * Get the current yield for the primary Money Market Fund
     * @returns Current yield as a percentage (e.g., 5.1)
     */
    async getCurrentYield(): Promise<number> {
        await this.simulateLatency()
        const mmf = this.assets.find(a => a.assetClass === 'money_market_fund')
        return mmf ? mmf.currentYield * 100 : 0
    }

    /**
     * Project returns for a given amount
     * @param principalGBP - Amount in GBP to project returns for
     */
    async projectReturns(principalGBP: number): Promise<IYieldProjection> {
        await this.simulateLatency()
        const mmf = this.assets.find(a => a.assetClass === 'money_market_fund')
        const annualYield = mmf?.currentYield ?? 0

        const projectedAnnualReturn = principalGBP * annualYield
        const projectedMonthlyReturn = projectedAnnualReturn / 12

        return {
            principal: principalGBP,
            annualYield,
            projectedAnnualReturn: Math.round(projectedAnnualReturn * 100) / 100,
            projectedMonthlyReturn: Math.round(projectedMonthlyReturn * 100) / 100
        }
    }

    /**
     * Create a mock pot for cash management
     * @param name - Pot name
     * @param initialBalance - Initial balance in pence
     */
    async createPot(name: string, initialBalance: number): Promise<IPot> {
        await this.simulateLatency()
        return {
            id: `pot-${Date.now()}`,
            name,
            balance: initialBalance,
            assetId: null,
            currentValue: initialBalance,
            totalReturns: 0,
            currency: 'GBP',
            createdAt: new Date().toISOString()
        }
    }

    private simulateLatency(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, 100))
    }
}

// Export singleton instance for convenience
export const wealthKernelClient = new WealthKernelMockClient()
