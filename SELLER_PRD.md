# DealScout Seller Dashboard - Product Requirements Document

## Overview
The Seller Dashboard is where sellers manage their product listings, track negotiations, and manage their inventory on the DealScout marketplace.

## Key Features

### 1. Seller Dashboard (`/seller`)
- Display seller's account information
- Quick stats (total listings, active listings, sold items)
- Navigation to different seller sections

### 2. Listings Management
#### Create New Listing
- Product details form with fields:
  - Product title
  - Description
  - Category (mountain-bike, macbook, electronics)
  - Asking price
  - Minimum selling price
  - Location
  - Zip code
  - Condition (new, like-new, good, fair, poor)
  - Image upload/gallery
- Form validation
- Success confirmation

#### View All Listings
- Table/Grid view of seller's products
- Show: Title, Price, Status, Created Date, Actions
- Status badges (active, sold, delisted)
- Quick actions: Edit, Delete, View Details

#### Edit Listing
- Edit existing product details
- Update asking price
- Modify product description
- Change status (active → sold → delisted)

#### Delete Listing
- Confirmation dialog
- Remove from marketplace

### 3. Negotiation Management
- View ongoing negotiations for each product
- See buyer's offers in real-time
- Accept/Reject final offer
- View full negotiation transcript

### 4. Design System
- Use Vercel's design (same as buyer page)
- Font family: Geist Sans (default), Geist Mono (code)
- Dark theme with OKLch colors
- Tailwind CSS v4
- Consistent button styles, badges, cards

## Technical Requirements

### Frontend Stack
- Next.js 15 with React 19
- TypeScript
- Tailwind CSS v4
- Shadcn/ui components

### API Endpoints Used
- `POST /api/seller/product/create` - Create listing
- `GET /api/seller/products/{seller_id}` - Get seller's products
- `PUT /api/seller/product/update-price` - Update price
- `PUT /api/seller/product/update-status` - Update status
- `DELETE /api/seller/product/{item_id}` - Delete listing

### Database
- MongoDB (sellers_collection)
- Product schema already defined in db.py

## Page Structure

```
/seller
├── /seller (Dashboard/Overview)
├── /seller/listings (All listings)
├── /seller/listings/new (Create new)
├── /seller/listings/[id] (View/Edit)
└── /seller/negotiations (View negotiations)
```

## Design Consistency
- Same color palette as buyer page
- Same typography (Geist Sans)
- Consistent button styles
- Card-based layouts
- Responsive design (mobile-first)
- Dark theme with proper contrast

## Priority Features
1. Seller Dashboard (overview)
2. Listings management (CRUD)
3. Negotiations view
4. Status management
5. Analytics/Stats

## Success Criteria
- Sellers can create listings with all required fields
- Full CRUD operations on listings
- Responsive design on all devices
- Real-time status updates
- Consistent with buyer page design
