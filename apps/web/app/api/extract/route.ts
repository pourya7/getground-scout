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

// Schema for extracted property risk data
const PropertyRiskSchema = z.object({
    leaseYears: z.number().nullable().describe('Remaining years on the lease. Null if freehold or not specified.'),
    groundRent: z.number().nullable().describe('Annual ground rent in GBP. Null if not applicable or not specified.'),
    reviewPeriod: z.string().nullable().describe('Ground rent review period (e.g., "every 10 years", "doubles every 25 years"). Null if not specified.'),
    serviceCharge: z.number().nullable().describe('Annual service charge in GBP. Null if not specified.'),
    tenure: z.enum(['freehold', 'leasehold', 'share of freehold', 'unknown']).describe('Property tenure type.')
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
Your task is to extract specific lease and cost terms from property listing text.
Be precise and conservative:
- Only extract values that are explicitly stated
- If information is missing or unclear, return null
- Convert all monetary values to annual GBP amounts
- For lease length, extract the remaining years (not the original term)`,
            prompt: `Extract the following from this property listing:\n\n${text}`
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

