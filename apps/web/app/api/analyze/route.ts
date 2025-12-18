import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(request: Request) {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
        return new Response(JSON.stringify({ error: 'Text payload required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    const result = streamText({
        model: openai('gpt-5-nano'),
        system: `You are a property analysis assistant for UK Buy-To-Let investors.
Your job is to analyze property listing text and identify potential red flags or "scary" details that investors should be aware of.

Focus on:
1. **Lease Length**: Flag if leasehold and lease is under 80 years (very concerning) or under 125 years (worth noting)
2. **Ground Rent**: Flag any ground rent, especially if it's reviewable or increases over time
3. **Service Charges**: Note high or escalating service charges
4. **Restrictions**: Any restrictions on letting, subletting, or short-term rentals
5. **Structural Issues**: Mentions of cladding, EWS1 forms, structural concerns
6. **Legal Issues**: Chancel repair liability, planning restrictions, TPOs

Format your response as:
- Start with a brief summary (1-2 sentences)
- List each finding with a severity indicator: 🔴 Critical, 🟠 Warning, 🟡 Note
- Be concise and actionable`,
        prompt: `Analyze this property listing text for potential red flags:\n\n${text}`
    })

    return result.toTextStreamResponse()
}
