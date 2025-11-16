"""
MongoDB Database Configuration and Models for DealScout
Handles buyer and seller data persistence
"""

from pymongo import MongoClient
from datetime import datetime
from typing import Dict, List, Optional, Any
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "dealscout")

try:
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]

    # Collections
    sellers_collection = db["sellers"]
    buyers_collection = db["buyers"]

    print(f"✓ Connected to MongoDB: {DATABASE_NAME}")
except Exception as e:
    print(f"✗ MongoDB connection error: {e}")
    db = None


# ============================================================================
# SELLER OPERATIONS
# ============================================================================

class SellerProduct:
    """Represents a product being sold"""

    @staticmethod
    def create(
        seller_id: str,
        asking_price: float,
        min_selling_price: float,
        location: str,
        zip_code: str,
        product_detail: str,
        condition: str,
        item_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new product listing

        Args:
            seller_id: Seller's unique ID
            asking_price: Initial asking price
            min_selling_price: Minimum acceptable price
            location: Physical location
            zip_code: Zip code
            product_detail: Description of product
            condition: Condition (new, like-new, good, fair, poor)
            item_id: Optional item ID (auto-generated if not provided)

        Returns:
            Created product document with _id
        """
        if db is None:
            raise Exception("Database not connected")

        product = {
            "seller_id": seller_id,
            "asking_price": asking_price,
            "min_selling_price": min_selling_price,
            "location": location,
            "zip_code": zip_code,
            "product_detail": product_detail,
            "condition": condition,
            "item_id": item_id or str(ObjectId()),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "status": "active"  # active, sold, delisted
        }

        result = sellers_collection.insert_one(product)
        product["_id"] = result.inserted_id
        return product

    @staticmethod
    def get_by_seller_id(seller_id: str) -> List[Dict[str, Any]]:
        """Get all products by a seller"""
        if db is None:
            raise Exception("Database not connected")

        products = list(sellers_collection.find({"seller_id": seller_id}))
        return products

    @staticmethod
    def get_by_item_id(item_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific product by item ID"""
        if db is None:
            raise Exception("Database not connected")

        product = sellers_collection.find_one({"item_id": item_id})
        return product

    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        """Get all products from all sellers"""
        if db is None:
            raise Exception("Database not connected")

        products = list(sellers_collection.find({}))
        return products

    @staticmethod
    def update_price(item_id: str, new_asking_price: float) -> bool:
        """Update asking price for a product"""
        if db is None:
            raise Exception("Database not connected")

        result = sellers_collection.update_one(
            {"item_id": item_id},
            {
                "$set": {
                    "asking_price": new_asking_price,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0

    @staticmethod
    def update_status(item_id: str, status: str) -> bool:
        """Update product status (active, sold, delisted)"""
        if db is None:
            raise Exception("Database not connected")

        result = sellers_collection.update_one(
            {"item_id": item_id},
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0

    @staticmethod
    def delete(item_id: str) -> bool:
        """Delete a product listing"""
        if db is None:
            raise Exception("Database not connected")

        result = sellers_collection.delete_one({"item_id": item_id})
        return result.deleted_count > 0


# ============================================================================
# BUYER OPERATIONS
# ============================================================================

class BuyerProfile:
    """Represents a buyer's profile"""

    @staticmethod
    def create(
        buyer_id: str,
        max_budget: float,
        target_price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Create a new buyer profile

        Args:
            buyer_id: Buyer's unique ID
            max_budget: Maximum budget for purchases
            target_price: Target price (defaults to 90% of max_budget)

        Returns:
            Created buyer document with _id
        """
        if db is None:
            raise Exception("Database not connected")

        buyer = {
            "buyer_id": buyer_id,
            "max_budget": max_budget,
            "target_price": target_price or (max_budget * 0.9),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = buyers_collection.insert_one(buyer)
        buyer["_id"] = result.inserted_id
        return buyer

    @staticmethod
    def get_by_buyer_id(buyer_id: str) -> Optional[Dict[str, Any]]:
        """Get a buyer's profile"""
        if db is None:
            raise Exception("Database not connected")

        buyer = buyers_collection.find_one({"buyer_id": buyer_id})
        return buyer

    @staticmethod
    def update_budget(buyer_id: str, max_budget: float) -> bool:
        """Update buyer's budget"""
        if db is None:
            raise Exception("Database not connected")

        result = buyers_collection.update_one(
            {"buyer_id": buyer_id},
            {
                "$set": {
                    "max_budget": max_budget,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0

    @staticmethod
    def update_target_price(buyer_id: str, target_price: float) -> bool:
        """Update buyer's target price"""
        if db is None:
            raise Exception("Database not connected")

        result = buyers_collection.update_one(
            {"buyer_id": buyer_id},
            {
                "$set": {
                    "target_price": target_price,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0

    @staticmethod
    def delete(buyer_id: str) -> bool:
        """Delete a buyer profile"""
        if db is None:
            raise Exception("Database not connected")

        result = buyers_collection.delete_one({"buyer_id": buyer_id})
        return result.deleted_count > 0


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """Initialize database indexes"""
    if db is None:
        raise Exception("Database not connected")

    # Create indexes for sellers collection
    sellers_collection.create_index("seller_id")
    sellers_collection.create_index("item_id", unique=True)
    sellers_collection.create_index("status")
    sellers_collection.create_index("created_at")

    # Create indexes for buyers collection
    buyers_collection.create_index("buyer_id", unique=True)
    buyers_collection.create_index("created_at")

    print("✓ Database indexes created")


# ============================================================================
# TEST DATA SEED (Optional)
# ============================================================================

def seed_test_data():
    """Seed database with test data - 30 products (10 bikes, 10 macbooks, 10 other)"""
    if db is None:
        raise Exception("Database not connected")

    # Clear existing data
    sellers_collection.delete_many({})
    buyers_collection.delete_many({})

    # Mountain Bikes (10 entries)
    mountain_bikes = [
        {
            "seller_id": "seller_mb_001",
            "asking_price": 1200,
            "min_selling_price": 1000,
            "location": "Brooklyn, NY",
            "zip_code": "11201",
            "product_detail": "Trek Mountain Bike X-Caliber 8 - Excellent Condition",
            "description": "High-performance Trek mountain bike with 29-inch wheels, perfect for trail riding. Features aluminum frame, hydraulic disc brakes, and full suspension. Recently serviced and in excellent condition. Great for intermediate to advanced riders.",
            "condition": "like-new",
            "item_id": "bike-001",
            "category": "mountain-bike",
            "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1532298996011-933d06a14a0a?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_002",
            "asking_price": 950,
            "min_selling_price": 800,
            "location": "Manhattan, NY",
            "zip_code": "10001",
            "product_detail": "Giant Talon 29 - 2023 Model",
            "description": "2023 Giant Talon 29 with SRAM drivetrain and Fox suspension. Lightweight aluminum frame designed for aggressive trail riding. Well-maintained with fresh service.",
            "condition": "like-new",
            "item_id": "bike-002",
            "category": "mountain-bike",
            "images": ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1553381528-5f8c896b3d5e?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_003",
            "asking_price": 1500,
            "min_selling_price": 1300,
            "location": "Queens, NY",
            "zip_code": "11375",
            "product_detail": "Specialized Epic EVO - Full Suspension",
            "description": "Brand new Specialized Epic EVO XC mountain bike with carbon frame and full suspension. Top-of-the-line components for competitive racing or serious trail enthusiasts.",
            "condition": "new",
            "item_id": "bike-003",
            "category": "mountain-bike",
            "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1532298996011-933d06a14a0a?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1544191ba-d6d99c6e2e15?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_004",
            "asking_price": 1100,
            "min_selling_price": 950,
            "location": "Brooklyn, NY",
            "zip_code": "11202",
            "product_detail": "Cannondale Cujo 3 - Hardtail",
            "description": "Cannondale Cujo 3 hardtail with 27.5 wheels, excellent for enduro and downhill riding. Strong aluminum frame, responsive handling.",
            "condition": "good",
            "item_id": "bike-004",
            "category": "mountain-bike",
            "images": ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1553381528-5f8c896b3d5e?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_005",
            "asking_price": 800,
            "min_selling_price": 700,
            "location": "Astoria, NY",
            "zip_code": "11369",
            "product_detail": "Scott Aspect 750 - Trail Ready",
            "description": "Reliable Scott Aspect 750 hardtail mountain bike. Great beginner to intermediate trail bike with durable components. Trail-ready condition.",
            "condition": "good",
            "item_id": "bike-005",
            "category": "mountain-bike",
            "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1532298996011-933d06a14a0a?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_006",
            "asking_price": 1350,
            "min_selling_price": 1150,
            "location": "Williamsburg, NY",
            "zip_code": "11211",
            "product_detail": "Santa Cruz Blur TR - Enduro Ready",
            "description": "Premium Santa Cruz Blur TR enduro mountain bike with advanced suspension geometry. Perfect for aggressive trail and enduro racing. Barely ridden.",
            "condition": "like-new",
            "item_id": "bike-006",
            "category": "mountain-bike",
            "images": ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1553381528-5f8c896b3d5e?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1544191ba-d6d99c6e2e15?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_007",
            "asking_price": 900,
            "min_selling_price": 750,
            "location": "Park Slope, NY",
            "zip_code": "11215",
            "product_detail": "Yamaha YZ125 Style Mountain Bike",
            "description": "Sport-oriented mountain bike inspired by motocross design. Features aggressive geometry and lightweight frame. Great for technical terrain.",
            "condition": "good",
            "item_id": "bike-007",
            "category": "mountain-bike",
            "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1532298996011-933d06a14a0a?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_008",
            "asking_price": 1700,
            "min_selling_price": 1500,
            "location": "Manhattan, NY",
            "zip_code": "10002",
            "product_detail": "Trek Slash 9.8 - High-End Full Suspension",
            "description": "Brand new Trek Slash 9.8 flagship downhill mountain bike with premium suspension and components. Ultimate bike for serious downhill riders.",
            "condition": "new",
            "item_id": "bike-008",
            "category": "mountain-bike",
            "images": ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1553381528-5f8c896b3d5e?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1544191ba-d6d99c6e2e15?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_009",
            "asking_price": 1050,
            "min_selling_price": 900,
            "location": "Sunset Park, NY",
            "zip_code": "11220",
            "product_detail": "Giant Reign - Downhill Oriented",
            "description": "Giant Reign downhill-oriented mountain bike with excellent suspension performance. Designed for aggressive riding and technical trails.",
            "condition": "like-new",
            "item_id": "bike-009",
            "category": "mountain-bike",
            "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1532298996011-933d06a14a0a?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_010",
            "asking_price": 1200,
            "min_selling_price": 1000,
            "location": "Long Island City, NY",
            "zip_code": "11101",
            "product_detail": "Specialized Rockhopper - Beginner Friendly",
            "description": "Perfect beginner mountain bike. Specialized Rockhopper with reliable components and forgiving geometry. Great for learning trail riding skills.",
            "condition": "good",
            "item_id": "bike-010",
            "category": "mountain-bike",
            "images": ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1553381528-5f8c896b3d5e?w=500&h=500&fit=crop"]
        }
    ]

    # MacBooks (10 entries)
    macbooks = [
        {
            "seller_id": "seller_mb_011",
            "asking_price": 1200,
            "min_selling_price": 1000,
            "location": "Brooklyn, NY",
            "zip_code": "11201",
            "product_detail": "MacBook Pro 16-inch M1 Max - 2023",
            "description": "Powerful 16-inch MacBook Pro with M1 Max chip. Perfect for video editing, 3D rendering, and heavy workloads. Barely used, like new condition.",
            "condition": "like-new",
            "item_id": "macbook-001",
            "category": "macbook",
            "images": ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1425953779944-59a018b5f929?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1505101556388-e86a28dff2aa?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_012",
            "asking_price": 900,
            "min_selling_price": 750,
            "location": "Manhattan, NY",
            "zip_code": "10001",
            "product_detail": "MacBook Air M2 - 13 inch",
            "description": "Lightweight MacBook Air M2 with 13-inch display. Great for students and professionals. Good working condition with minor cosmetic wear.",
            "condition": "good",
            "item_id": "macbook-002",
            "category": "macbook",
            "images": ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1425953779944-59a018b5f929?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_013",
            "asking_price": 1400,
            "min_selling_price": 1200,
            "location": "Queens, NY",
            "zip_code": "11375",
            "product_detail": "MacBook Pro 14-inch M1 Pro - 2023 Edition",
            "description": "Brand new 14-inch MacBook Pro with M1 Pro chip. Excellent for development and content creation.",
            "condition": "new",
            "item_id": "macbook-003",
            "category": "macbook",
            "images": ["https://images.unsplash.com/photo-1505101556388-e86a28dff2aa?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1425953779944-59a018b5f929?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_014",
            "asking_price": 600,
            "min_selling_price": 500,
            "location": "Brooklyn, NY",
            "zip_code": "11202",
            "product_detail": "MacBook Air 2017 - Intel i5",
            "description": "Classic MacBook Air from 2017 with Intel i5 processor. Good for everyday computing and light development.",
            "condition": "good",
            "item_id": "macbook-004",
            "category": "macbook",
            "images": ["https://images.unsplash.com/photo-1425953779944-59a018b5f929?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1505101556388-e86a28dff2aa?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_015",
            "asking_price": 1800,
            "min_selling_price": 1600,
            "location": "Astoria, NY",
            "zip_code": "11369",
            "product_detail": "MacBook Pro 16 M2 Max - Maxed Out",
            "description": "Top-tier 16-inch MacBook Pro M2 Max with maximum specs. Brand new, perfect for professional studios.",
            "condition": "new",
            "item_id": "macbook-005",
            "category": "macbook",
            "images": ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1425953779944-59a018b5f929?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1505101556388-e86a28dff2aa?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_016",
            "asking_price": 750,
            "min_selling_price": 650,
            "location": "Williamsburg, NY",
            "zip_code": "11211",
            "product_detail": "MacBook Air M1 - 2020 Model",
            "description": "First generation M1 MacBook Air from 2020. Excellent performance in like-new condition.",
            "condition": "like-new",
            "item_id": "macbook-006",
            "category": "macbook",
            "images": ["https://images.unsplash.com/photo-1505101556388-e86a28dff2aa?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1425953779944-59a018b5f929?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_017",
            "asking_price": 500,
            "min_selling_price": 400,
            "location": "Park Slope, NY",
            "zip_code": "11215",
            "product_detail": "MacBook Pro 2015 - 15 inch Retina",
            "description": "Classic 15-inch Retina MacBook Pro. Functional but shows signs of age. Great for budget-conscious buyers.",
            "condition": "fair",
            "item_id": "macbook-007",
            "category": "macbook",
            "images": ["https://images.unsplash.com/photo-1425953779944-59a018b5f929?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1505101556388-e86a28dff2aa?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_018",
            "asking_price": 1100,
            "min_selling_price": 950,
            "location": "Manhattan, NY",
            "zip_code": "10002",
            "product_detail": "MacBook Air 13 M2 - Silver",
            "description": "Silver MacBook Air M2 13-inch. Excellent condition with minimal use.",
            "condition": "like-new",
            "item_id": "macbook-008",
            "category": "macbook",
            "images": ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1425953779944-59a018b5f929?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1505101556388-e86a28dff2aa?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_019",
            "asking_price": 1350,
            "min_selling_price": 1150,
            "location": "Sunset Park, NY",
            "zip_code": "11220",
            "product_detail": "MacBook Pro 14 M1 Pro Max - Fully Upgraded",
            "description": "Brand new MacBook Pro 14 with M1 Pro Max and maximum upgrades. Premium option for professionals.",
            "condition": "new",
            "item_id": "macbook-009",
            "category": "macbook",
            "images": ["https://images.unsplash.com/photo-1505101556388-e86a28dff2aa?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1425953779944-59a018b5f929?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_mb_020",
            "asking_price": 1050,
            "min_selling_price": 900,
            "location": "Long Island City, NY",
            "zip_code": "11101",
            "product_detail": "MacBook Air 11 2015 - Compact",
            "description": "Compact 11-inch MacBook Air from 2015. Perfect for travel and portability.",
            "condition": "good",
            "item_id": "macbook-010",
            "category": "macbook",
            "images": ["https://images.unsplash.com/photo-1425953779944-59a018b5f929?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop"]
        }
    ]

    # Other Products - PlayStation 5, AirPods Max, etc (10 entries)
    other_products = [
        {
            "seller_id": "seller_other_001",
            "asking_price": 550,
            "min_selling_price": 500,
            "location": "Brooklyn, NY",
            "zip_code": "11201",
            "product_detail": "PlayStation 5 Console - Disc Edition",
            "description": "Latest PlayStation 5 console with disc drive. Includes controller and all cables. Like-new condition.",
            "condition": "like-new",
            "item_id": "other-001",
            "category": "electronics",
            "images": ["https://images.unsplash.com/photo-1606841839923-d2eae007e6db?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1538108149393-fbbd81895d0f?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1577720643272-265e434b34b2?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_other_002",
            "asking_price": 350,
            "min_selling_price": 300,
            "location": "Manhattan, NY",
            "zip_code": "10001",
            "product_detail": "Apple AirPods Max - Space Gray",
            "description": "Brand new Apple AirPods Max headphones in Space Gray. High-quality audio with spatial sound.",
            "condition": "new",
            "item_id": "other-002",
            "category": "electronics",
            "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_other_003",
            "asking_price": 800,
            "min_selling_price": 700,
            "location": "Queens, NY",
            "zip_code": "11375",
            "product_detail": "iPad Pro 12.9 - M2 Chip 2023",
            "description": "Latest 12.9-inch iPad Pro with M2 chip. Perfect for creative work and productivity.",
            "condition": "like-new",
            "item_id": "other-003",
            "category": "electronics",
            "images": ["https://images.unsplash.com/photo-1544244015-27201734744b?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1541523182286-9ffb6701fec8?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_other_004",
            "asking_price": 450,
            "min_selling_price": 400,
            "location": "Brooklyn, NY",
            "zip_code": "11202",
            "product_detail": "iPhone 14 Pro Max - Silver",
            "description": "iPhone 14 Pro Max in Silver. Good condition with original box.",
            "condition": "good",
            "item_id": "other-004",
            "category": "electronics",
            "images": ["https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1663499482523-1c0d3397ce48?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_other_005",
            "asking_price": 1200,
            "min_selling_price": 1000,
            "location": "Astoria, NY",
            "zip_code": "11369",
            "product_detail": "Sony WH-1000XM5 Headphones",
            "description": "Premium Sony WH-1000XM5 noise-cancelling headphones. Brand new in box.",
            "condition": "new",
            "item_id": "other-005",
            "category": "electronics",
            "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_other_006",
            "asking_price": 300,
            "min_selling_price": 250,
            "location": "Williamsburg, NY",
            "zip_code": "11211",
            "product_detail": "Apple Watch Series 8 - 41mm",
            "description": "Apple Watch Series 8 in 41mm size. Like-new condition with original packaging.",
            "condition": "like-new",
            "item_id": "other-006",
            "category": "electronics",
            "images": ["https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_other_007",
            "asking_price": 900,
            "min_selling_price": 800,
            "location": "Park Slope, NY",
            "zip_code": "11215",
            "product_detail": "Samsung QLED 65 Inch TV - 2023",
            "description": "65-inch Samsung QLED TV from 2023. Great picture quality, good condition.",
            "condition": "good",
            "item_id": "other-007",
            "category": "electronics",
            "images": ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_other_008",
            "asking_price": 200,
            "min_selling_price": 150,
            "location": "Manhattan, NY",
            "zip_code": "10002",
            "product_detail": "GoPro Hero 11 Black",
            "description": "GoPro Hero 11 Black action camera. Brand new, perfect for vlogging and sports.",
            "condition": "new",
            "item_id": "other-008",
            "category": "electronics",
            "images": ["https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1519423550014-d5b7f0c6c5ad?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_other_009",
            "asking_price": 1100,
            "min_selling_price": 950,
            "location": "Sunset Park, NY",
            "zip_code": "11220",
            "product_detail": "DJI Air 3 Drone - Complete Kit",
            "description": "DJI Air 3 drone with complete accessories. Like-new condition, barely flown.",
            "condition": "like-new",
            "item_id": "other-009",
            "category": "electronics",
            "images": ["https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=500&h=500&fit=crop"]
        },
        {
            "seller_id": "seller_other_010",
            "asking_price": 400,
            "min_selling_price": 350,
            "location": "Long Island City, NY",
            "zip_code": "11101",
            "product_detail": "Meta Quest 3 VR Headset - 512GB",
            "description": "Meta Quest 3 512GB VR headset. Brand new, ready to explore virtual worlds.",
            "condition": "new",
            "item_id": "other-010",
            "category": "electronics",
            "images": ["https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=500&h=500&fit=crop", "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=500&h=500&fit=crop"]
        }
    ]

    # Insert all products
    all_products = mountain_bikes + macbooks + other_products

    for product in all_products:
        sellers_collection.insert_one(product)

    # Create test buyers
    test_buyers = [
        {"buyer_id": "buyer_001", "max_budget": 1000},
        {"buyer_id": "buyer_002", "max_budget": 1500},
        {"buyer_id": "buyer_003", "max_budget": 2000}
    ]

    for buyer_data in test_buyers:
        BuyerProfile.create(
            buyer_id=buyer_data["buyer_id"],
            max_budget=buyer_data["max_budget"]
        )

    print(f"✓ Test data seeded - {len(all_products)} products created")


if __name__ == "__main__":
    init_db()
    seed_test_data()
