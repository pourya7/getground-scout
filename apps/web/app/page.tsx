import type { Property } from "@getground-scout/types"

export default function Home() {
    // Example usage of shared type
    const exampleProperty: Property = {
        id: "example-123",
        address: "123 Example Street, London",
        price: 500000,
        bedrooms: 3,
        bathrooms: 2,
        propertyType: "house",
        url: "https://rightmove.co.uk/properties/123",
    }

    return (
        <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
                GetGround Scout API
            </h1>
            <p style={{ color: "#666", marginBottom: "2rem" }}>
                Backend API for the GetGround Scout Chrome Extension
            </p>

            <section>
                <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                    API Endpoints
                </h2>
                <ul style={{ listStyle: "disc", paddingLeft: "1.5rem", color: "#444" }}>
                    <li>
                        <code style={{ background: "#f4f4f4", padding: "0.125rem 0.25rem" }}>
                            GET /api/health
                        </code> - Health check
                    </li>
                </ul>
            </section>
        </main>
    )
}
