import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

// CORS headers for cross-origin requests from browser extension
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

// Handle preflight requests
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders
    })
}

// Schema for extracted property risk data with red flags
const PropertyRiskSchema = z.object({
    leaseYears: z.number().nullable().describe('Remaining years on the lease. Null if freehold or not specified.'),
    groundRent: z.number().nullable().describe('Annual ground rent in GBP. Null if not applicable or not specified.'),
    reviewPeriod: z.string().nullable().describe('Ground rent review period (e.g., "every 10 years", "doubles every 25 years"). Null if not specified.'),
    serviceCharge: z.number().nullable().describe('Annual service charge in GBP. Null if not specified.'),
    tenure: z.enum(['freehold', 'leasehold', 'share of freehold', 'unknown']).describe('Property tenure type.'),
    // Red flag fields
    hasDoublingClause: z.boolean().describe('True if ground rent doubles, escalates, or increases over time (e.g., "doubles every 25 years", "RPI linked"). This is a CRITICAL red flag for mortgageability.'),
    shortLeaseWarning: z.boolean().describe('True if lease is under 80 years remaining. Properties under 80 years are difficult to mortgage and require expensive lease extensions.'),
    redFlagSummary: z.string().nullable().describe('Brief explanation of any critical risks found (1-2 sentences). Null if no major issues.')
})

export type PropertyRisk = z.infer<typeof PropertyRiskSchema>

export async function POST(request: Request) {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
        return new Response(JSON.stringify({ error: 'Text payload required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
    }

    try {
        const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            schema: PropertyRiskSchema,
            system: `You are a conveyancing lawyer specializing in UK property transactions.
Your task is to extract specific lease and cost terms AND identify critical red flags.

DOMAIN EXPERTISE - Why these red flags matter:
1. SHORT LEASE (<80 years): Most lenders refuse mortgages on properties with less than 80 years remaining. Lease extensions are expensive (£10k-50k+) and the "marriage value" kicks in under 80 years.
2. DOUBLING GROUND RENT: Properties with escalating/doubling ground rent are increasingly unmortgageable. Many lenders now refuse these entirely. Look for: "doubles", "RPI", "increases", "escalates".

Be precise:
- Only extract values that are explicitly stated
- If information is missing or unclear, return null
- Convert all monetary values to annual GBP amounts
- For lease length, extract the remaining years (not the original term)
- Set shortLeaseWarning=true if lease is under 80 years
- Set hasDoublingClause=true if ANY escalation mechanism is mentioned`,
            prompt: `Extract lease terms and identify red flags from this property listing:\n\n${text}`
        })

        return new Response(JSON.stringify(object), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
    } catch (error) {
        console.error('Extraction failed:', error)
        return new Response(JSON.stringify({ error: 'Extraction failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
    }
}

