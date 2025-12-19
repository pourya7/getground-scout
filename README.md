# GetGround Scout 🚀

**An AI-native browser extension that transforms Rightmove into an intelligent Buy-to-Let analysis platform.**

GetGround Scout bridges the gap between property discovery and financial structuring. It injects a "Co-Pilot" overlay into property portals, using **AI to detect leasehold risks** and **real-time algorithms to calculate Section 24 tax impacts**, demonstrating the mathematical advantage of Limited Company (SPV) ownership instantly.

> **Note:** This is a **Technical Proof of Concept (PoC)** designed to demonstrate modern "AI Engineer" capabilities using Next.js, Plasmo, and the Vercel AI SDK. It is not intended for commercial distribution.

---

## 🏗️ Technical Architecture

This project utilizes a **Backend-for-Frontend (BFF)** pattern to keep the extension lightweight while offloading complex AI processing to the edge.mermaid
graph TD
User -->|DOM Injection| Ext
Ext -->|Extract Data| Next[Next.js 15 API Layer]

```
subgraph "Edge Runtime"
    Next -->|Stream Text| AI
    AI -->|Inference| OpenAI
    Next -->|Mock Request| WK
end

subgraph "Browser Client"
    Ext -->|Render UI| Shadow
    Shadow -->|Display| React
end
```

### Monorepo Structure (pnpm workspaces)
- **`apps/extension`**: Built with **Plasmo**. It handles the reliable extraction of property data (via `window.PAGE_MODEL` parsing) and renders the UI into a Shadow DOM to prevent CSS bleeding.
- **`apps/web`**: A **Next.js 15** app hosting the AI orchestration layer. It uses `generateObject` (Vercel AI SDK) to enforce strict JSON schemas on the LLM output, ensuring type safety for the frontend.
- **`packages/calculator`**: A shared TypeScript library containing the **Section 24** tax logic and SDLT algorithms.
- **`packages/wealth-kernel`**: A mock adapter simulating the **WealthKernel API** to project returns on idle cash in Money Market Funds.

---

## ✨ Key Features

### 1. 🧠 AI Leasehold Lawyer
Uses `gpt-4o-mini` to analyze the property description text in real-time.
- **Red Flag Alerting:** Automatically detects keywords related to "short lease" (<80 years), "doubling ground rent", or "cash buyers only".
- **Structured Extraction:** Converts unstructured agent text into typed JSON data (Service Charge: £X, Ground Rent: £Y).

### 2. 📉 Section 24 Reality Check
A real-time tax comparator that educates the user on **Personal vs. Corporate** ownership.
- dynamically calculates the "Tax Trap" for higher-rate taxpayers.
- factors in the 20% basic rate tax credit to show true net profit.

### 3. 💰 "Dead Money" Simulator
Demonstrates GetGround's ecosystem value by calculating the opportunity cost of the deposit.
- **Integration:** Simulates a fetch to a Money Market Fund yield (mocked via WealthKernel).
- **Projected Return:** Shows how much interest the user *could* earn on their deposit while waiting for conveyancing.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- An OpenAI API Key

### Installation

```bash
# Install dependencies
pnpm install

# Setup Environment Variables
cp apps/web/.env.example apps/web/.env.local
# Add your OPENAI_API_KEY to.env.local

```

### Running Locally

1. **Start the API (Backend):**
```bash
cd apps/web
pnpm dev
# Runs on http://localhost:3000

```


2. **Start the Extension (Frontend):**
```bash
cd apps/extension
pnpm dev

```


3. **Load into Chrome:**
* Open Chrome and navigate to `chrome://extensions`
* Enable "Developer Mode" (top right).
* Click "Load Unpacked".
* Select `apps/extension/build/chrome-mv3-dev`.
* Visit any property page on Rightmove to see the Scout Sidebar.



---

## ⚠️ Legal & Compliance Disclaimer

**Educational Use Only:**
This software is a Proof of Concept developed strictly for educational and demonstration purposes. It is **not** an official product of GetGround, Rightmove, or Zoopla.

**Data Scraping:**
This tool extracts data from third-party websites. Users should be aware that automated scraping may violate the Terms of Service of property portals. This code is designed to run locally for personal research and must not be used for commercial data harvesting or high-volume crawling without permission.

**Financial Data:**
All tax calculations, yield projections, and investment estimations are for illustrative purposes only and do not constitute financial advice.

---

## 🛠️ Tech Stack

* **Framework:** Next.js 15 (App Router)
* **Extension SDK:** Plasmo
* **AI Engineering:** Vercel AI SDK, Zod (Structured Output)
* **Styling:** TailwindCSS, Radix UI
* **Language:** TypeScript