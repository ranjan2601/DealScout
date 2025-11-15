# Frontend Integration Guide - DealScout API

This guide explains how to integrate the DealScout negotiation API with your frontend application.

---

## Overview

The frontend performs two main workflows:

1. **Search Workflow**: User searches for items → Frontend calls `/api/search` → Display results
2. **Negotiation Workflow**: User selects items → Frontend calls `/api/negotiate` → Display negotiation results

---

## Workflow 1: Search Listings

### User Interaction Flow

```
User enters search criteria
    ↓
Frontend validates input
    ↓
Frontend calls POST /api/search
    ↓
Backend returns matching listings
    ↓
Frontend displays listings with images, prices, conditions
```

### Frontend Implementation

#### Step 1: Create Search Form

```html
<form id="searchForm">
    <input type="text" id="category" placeholder="Category (e.g., bikes)" required>
    <input type="text" id="location" placeholder="Location (e.g., Brooklyn, NY)" required>
    <input type="number" id="maxBudget" placeholder="Max Budget ($)" required>
    <input type="number" id="minPrice" placeholder="Min Price ($)" value="0">
    <button type="submit">Search</button>
</form>

<div id="searchResults"></div>
```

#### Step 2: Call Search API

```javascript
const API_BASE_URL = 'http://localhost:5000/api';

document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const searchData = {
        category: document.getElementById('category').value,
        location: document.getElementById('location').value,
        max_budget: parseFloat(document.getElementById('maxBudget').value),
        min_price: parseFloat(document.getElementById('minPrice').value)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchData)
        });

        const data = await response.json();

        if (data.status === 'success') {
            displayListings(data.listings);
        } else {
            displayError(data.message);
        }
    } catch (error) {
        displayError('Error searching listings: ' + error.message);
    }
});
```

#### Step 3: Display Listings

```javascript
function displayListings(listings) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '';

    listings.forEach(listing => {
        const listingHTML = `
            <div class="listing-card" data-listing-id="${listing.listing_id}">
                <img src="${listing.image_url}" alt="${listing.title}">
                <h3>${listing.title}</h3>
                <p><strong>Condition:</strong> ${listing.condition}</p>
                <p><strong>Asking Price:</strong> $${listing.asking_price}</p>
                <p><strong>Location:</strong> ${listing.location}</p>
                <p><strong>Description:</strong> ${listing.description}</p>
                ${listing.extras.length > 0 ?
                    `<p><strong>Extras:</strong> ${listing.extras.join(', ')}</p>` : ''}
                <button class="select-btn" onclick="selectListing('${listing.listing_id}', ${listing.asking_price})">
                    Select for Negotiation
                </button>
            </div>
        `;
        resultsDiv.innerHTML += listingHTML;
    });
}

function displayError(message) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = `<div class="error">${message}</div>`;
}
```

---

## Workflow 2: Negotiate Purchase

### User Interaction Flow

```
User selects one or more listings
    ↓
User enters max budget
    ↓
Frontend calls POST /api/negotiate
    ↓
Backend runs AI negotiation (5-10 turns)
    ↓
Frontend displays negotiation progress in real-time
    ↓
Display final result (price, savings, conversation)
```

### Frontend Implementation

#### Step 1: Select Listings and Set Budget

```javascript
let selectedListing = null;
let buyerBudget = null;

function selectListing(listingId, askingPrice) {
    selectedListing = listingId;

    // Prompt for buyer budget
    const budget = prompt(`Enter your max budget for this item (asking price: $${askingPrice}):`);

    if (budget && parseFloat(budget) >= 0) {
        buyerBudget = parseFloat(budget);
        startNegotiation();
    } else {
        alert('Invalid budget amount');
    }
}
```

#### Step 2: Call Negotiation API

```javascript
async function startNegotiation() {
    const negotiationData = {
        buyer_id: generateUserId(), // Generate or get from user session
        buyer_budget: buyerBudget,
        selected_listing_ids: [selectedListing],
        mode: 'single'
    };

    try {
        // Show loading state
        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = '<div class="loading">Negotiation in progress...</div>';

        const response = await fetch(`${API_BASE_URL}/negotiate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(negotiationData)
        });

        const data = await response.json();

        if (data.status === 'success') {
            displayNegotiationResult(data);
        } else {
            displayError(data.message);
        }
    } catch (error) {
        displayError('Error during negotiation: ' + error.message);
    }
}

function generateUserId() {
    // Use actual user ID from your auth system
    // For now, generate a temporary ID
    return 'user_' + Math.random().toString(36).substr(2, 9);
}
```

#### Step 3: Display Negotiation Results

```javascript
function displayNegotiationResult(data) {
    const result = data.result;
    const resultsDiv = document.getElementById('searchResults');

    let historyHTML = '<div class="negotiation-history">';

    result.history.forEach(turn => {
        const party = turn.party === 'buyer' ? 'You (Buyer)' : 'Seller';
        const messageClass = turn.party === 'buyer' ? 'buyer-message' : 'seller-message';

        historyHTML += `
            <div class="turn ${messageClass}">
                <h4>${party} - Turn ${turn.turn}</h4>
                <p class="message">"${turn.message}"</p>
                <p class="offer">Offer: $${turn.offer_price.toFixed(2)} (Confidence: ${(turn.confidence * 100).toFixed(0)}%)</p>
            </div>
        `;
    });

    historyHTML += '</div>';

    let summaryHTML = '';
    if (result.status === 'success') {
        const savings = result.savings;
        summaryHTML = `
            <div class="negotiation-success">
                <h3>Deal Reached!</h3>
                <p class="final-price">Final Price: <strong>$${result.final_price.toFixed(2)}</strong></p>
                <p class="savings">You saved: <strong>$${savings.amount.toFixed(2)} (${savings.percentage.toFixed(1)}%)</strong></p>
                <p class="turns">Negotiation completed in ${result.turns} turns</p>
                <div class="closing-messages">
                    <p><strong>Your comment:</strong> "${result.buyer_comment}"</p>
                    <p><strong>Seller comment:</strong> "${result.seller_comment}"</p>
                </div>
                <button onclick="exportNegotiation(${data.negotiation_id})">Export Negotiation Details</button>
                <button onclick="contact()">Contact Seller</button>
            </div>
        `;
    } else {
        summaryHTML = `
            <div class="negotiation-failed">
                <h3>Negotiation Ended Without Agreement</h3>
                <p>The buyer and seller could not reach an agreement.</p>
                <button onclick="document.getElementById('searchResults').innerHTML = ''">Search Again</button>
            </div>
        `;
    }

    resultsDiv.innerHTML = historyHTML + summaryHTML;
}
```

#### Step 4: Display Conversation Visually

```css
.negotiation-history {
    margin-bottom: 20px;
}

.turn {
    padding: 15px;
    margin: 10px 0;
    border-radius: 8px;
    border-left: 4px solid #ccc;
}

.turn.buyer-message {
    background-color: #e3f2fd;
    border-left-color: #2196F3;
}

.turn.seller-message {
    background-color: #f3e5f5;
    border-left-color: #9C27B0;
}

.turn h4 {
    margin: 0 0 10px 0;
    color: #333;
}

.turn .message {
    font-style: italic;
    margin: 10px 0;
    color: #555;
}

.turn .offer {
    color: #2e7d32;
    font-weight: bold;
}

.negotiation-success {
    background-color: #c8e6c9;
    border: 2px solid #4caf50;
    padding: 20px;
    border-radius: 8px;
}

.final-price {
    font-size: 24px;
    color: #1b5e20;
    margin: 10px 0;
}

.savings {
    color: #2e7d32;
    font-weight: bold;
}
```

---

## Integration Checklist

- [ ] Frontend form created with category, location, max_budget inputs
- [ ] Search API integrated and tested
- [ ] Listing results display with images, prices, conditions
- [ ] User can select listing and enter negotiation budget
- [ ] Negotiation API integrated and tested
- [ ] Negotiation conversation displays turn-by-turn
- [ ] Final result shows clearly with final price and savings
- [ ] Error handling for API failures
- [ ] Loading states during API calls
- [ ] Mobile responsive design

---

## Backend Requirements

Ensure these are running before testing:

1. **Install Python packages**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment**:
   ```bash
   echo "OPENROUTER_API_KEY=your_key_here" > .env
   ```

3. **Start API server**:
   ```bash
   python api.py
   ```

4. **Test API** (optional):
   ```bash
   python test_api.py
   ```

---

## Sample Response Data

### Successful Negotiation Response

```json
{
  "status": "success",
  "negotiation_id": "neg_e23a35197552",
  "listing_id": "bike_001",
  "seller_id": "seller_123",
  "result": {
    "status": "success",
    "final_price": 420.00,
    "turns": 5,
    "history": [
      {
        "party": "buyer",
        "action": "counter",
        "offer_price": 380.0,
        "message": "Hey! I'm really interested...",
        "confidence": 0.7,
        "turn": 1
      },
      {
        "party": "seller",
        "action": "counter",
        "offer_price": 430.0,
        "message": "Hey! Thanks for the interest...",
        "confidence": 0.85,
        "turn": 2
      }
    ],
    "buyer_comment": "Thanks! It was great dealing with you...",
    "seller_comment": "Same here! Thanks for the smooth negotiation...",
    "savings": {
      "amount": 30.0,
      "percentage": 6.7
    }
  }
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS error when calling API | Ensure backend is running and allow CORS in Flask |
| 500 error on negotiate | Check OPENROUTER_API_KEY is set in .env |
| Empty listings from search | Check database has listings for that category/location |
| Negotiation takes forever | Check API key has sufficient credits |

---

## React Component Example

Here's a complete React component for the negotiation workflow:

```jsx
import React, { useState } from 'react';

function NegotiationApp() {
    const [listings, setListings] = useState([]);
    const [negotiationResult, setNegotiationResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target);
        try {
            const response = await fetch('http://localhost:5000/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: formData.get('category'),
                    location: formData.get('location'),
                    max_budget: parseFloat(formData.get('maxBudget')),
                    min_price: parseFloat(formData.get('minPrice') || 0)
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                setListings(data.listings);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNegotiate = async (listingId, budget) => {
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/negotiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buyer_id: 'user_' + Math.random().toString(36).substr(2, 9),
                    buyer_budget: budget,
                    selected_listing_ids: [listingId]
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                setNegotiationResult(data);
            }
        } catch (error) {
            console.error('Negotiation error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app">
            {!negotiationResult ? (
                <>
                    <form onSubmit={handleSearch}>
                        <input name="category" placeholder="Category" required />
                        <input name="location" placeholder="Location" required />
                        <input name="maxBudget" type="number" placeholder="Max Budget" required />
                        <button type="submit" disabled={loading}>Search</button>
                    </form>

                    <div className="listings">
                        {listings.map(listing => (
                            <div key={listing.listing_id} className="listing">
                                <h3>{listing.title}</h3>
                                <p>Price: ${listing.asking_price}</p>
                                <button
                                    onClick={() => {
                                        const budget = prompt('Enter your max budget:');
                                        if (budget) handleNegotiate(listing.listing_id, parseFloat(budget));
                                    }}
                                >
                                    Negotiate
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="result">
                    <h2>Deal Reached!</h2>
                    <p>Final Price: ${negotiationResult.result.final_price}</p>
                    <p>You saved: ${negotiationResult.result.savings.amount.toFixed(2)}</p>
                </div>
            )}
        </div>
    );
}

export default NegotiationApp;
```

---

## Next Steps

1. Copy the API endpoint URLs and authentication details
2. Implement the search form and listing display
3. Implement the negotiation workflow
4. Style the negotiation conversation display
5. Test end-to-end with backend
6. Add error handling and validation
7. Deploy both frontend and backend
