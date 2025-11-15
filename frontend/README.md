# SafeMarket - AI-Powered Negotiation Marketplace

A scalable Next.js 14 frontend for a Visa-style, AI-assisted negotiation marketplace. Features intelligent buyer/seller flows, agentic AI marketplace navigation, multi-listing selection, and real-time negotiation with price transparency.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** FastAPI (API client layer ready)

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Role selection screen (buyer/seller)
│   ├── buyer/             
│   │   └── page.tsx       # Main buyer marketplace
│   └── seller/
│       └── page.tsx       # Seller portal (placeholder)
├── components/            # Reusable React components
│   ├── Header.tsx         # App header with branding
│   ├── FiltersPanel.tsx   # AI agent + manual filters
│   ├── ListingCard.tsx    # Individual listing display
│   └── NegotiationPanel.tsx # Negotiation chat drawer
├── lib/                   # Core utilities and API
│   ├── types.ts           # TypeScript interfaces
│   ├── mockData.ts        # Mock listings data
│   ├── api.ts             # API client functions
│   └── utils.ts           # Helper functions
└── public/                # Static assets
```

## 🎯 Features

### Role Selection (`/`)
- Clean landing page with buyer/seller choice
- Hero copy explaining AI + Visa security
- Mobile-responsive design

### Buyer Marketplace (`/buyer`)
- **Natural Language Agent:** Ask questions like "Find me bikes within 5 miles under $1000"
- **Manual Filters:** Price range, distance, condition, brand selection
- **Listing Grid:** Responsive cards with images, metadata, and confidence scores
- **Multi-Selection:** Select multiple listings for batch negotiation
- **AI Negotiation:** Automated price negotiation with transparent results
- **Price Transparency:** Strike-through original prices, show savings
- **Negotiation Chat:** View detailed conversation transcripts

### Seller Portal (`/seller`)
- Placeholder page for future features
- Upcoming: listing management, Visa confidence scores, AI negotiation

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Current Implementation

The frontend is fully functional with **mock data** and ready for backend integration:

- ✅ Complete UI/UX flow from role selection to negotiation
- ✅ Filter listings by price, distance, condition, and brand
- ✅ Natural language agent (client-side parsing for now)
- ✅ Multi-listing selection and batch negotiation
- ✅ Negotiation results with price updates and savings
- ✅ Detailed negotiation chat transcripts
- ✅ Responsive design (mobile, tablet, desktop)

## 🔌 API Integration

The API client layer (`lib/api.ts`) is structured for easy FastAPI integration:

### Current Mock Endpoints
```typescript
// Parse natural language queries into filters
parseAgentQuery(query: string): Promise<Filters>
// TODO: POST ${API_BASE_URL}/agent/parse

// Negotiate prices for selected listings
negotiateListings(listingIds: string[]): Promise<NegotiationResult[]>
// TODO: POST ${API_BASE_URL}/negotiation
```

### Integration Steps
1. Update `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
2. Replace mock implementations in `lib/api.ts` with actual fetch calls
3. Update request/response types as needed

## 📝 Data Models

### Listing
```typescript
interface Listing {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  distanceMiles: number;
  price: number;
  negotiatedPrice?: number;
  savings?: number;
  brand?: string;
  condition?: "new" | "like-new" | "used";
  confidenceScore?: number;
  fraudStatus?: "clear" | "warning" | "failed";
}
```

### NegotiationResult
```typescript
interface NegotiationResult {
  listingId: string;
  originalPrice: number;
  negotiatedPrice: number;
  messages: NegotiationMessage[];
}
```

## 🎨 Design Philosophy

- **Server-first:** Server components by default, client components only where needed
- **Type-safe:** Strongly typed with TypeScript throughout
- **Scalable:** Modular component architecture
- **Accessible:** Semantic HTML and ARIA patterns
- **Responsive:** Mobile-first Tailwind design

## 🚧 Future Enhancements

- [ ] Connect to FastAPI backend
- [ ] Real-time negotiation updates (WebSockets)
- [ ] User authentication and profiles
- [ ] Complete seller portal functionality
- [ ] Payment integration with Visa
- [ ] Advanced filtering and search
- [ ] Saved searches and favorites
- [ ] Notification system

## 📄 License

This project is part of HackNYU 2026.

---

Built with ❤️ using Next.js 14, TypeScript, and Tailwind CSS

