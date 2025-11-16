"""
Seed MongoDB with sample product data for testing DealScout
"""

from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "dealscout")

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
sellers_collection = db["sellers"]

# Clear existing data
sellers_collection.delete_many({})

# Sample products - focusing on mountain bikes for testing
sample_products = [
    {
        "seller_id": "seller_001",
        "item_id": "bike_001",
        "product_detail": "Trek X-Caliber 8 Mountain Bike 27.5\" 2022",
        "description": "Well-maintained mountain bike with disc brakes and suspension",
        "category": "Sports & Outdoors",
        "asking_price": 850,
        "min_selling_price": 750,
        "condition": "good",
        "location": "New York, NY",
        "zip_code": "10001",
        "extras": ["helmet", "lock"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "status": "active"
    },
    {
        "seller_id": "seller_002",
        "item_id": "bike_002",
        "product_detail": "Giant Talon Mountain Bike 29\" 2023",
        "description": "Lightweight aluminum frame, new tires, excellent condition",
        "category": "Sports & Outdoors",
        "asking_price": 920,
        "min_selling_price": 800,
        "condition": "like-new",
        "location": "Brooklyn, NY",
        "zip_code": "11201",
        "extras": ["original box", "warranty"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "status": "active"
    },
    {
        "seller_id": "seller_003",
        "item_id": "bike_003",
        "product_detail": "Specialized Rockhopper Mountain Bike 27.5\"",
        "description": "Good condition, regularly maintained, ready to ride",
        "category": "Sports & Outdoors",
        "asking_price": 750,
        "min_selling_price": 650,
        "condition": "good",
        "location": "Manhattan, NY",
        "zip_code": "10002",
        "extras": ["lights", "reflectors"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "status": "active"
    },
    {
        "seller_id": "seller_004",
        "item_id": "macbook_001",
        "product_detail": "MacBook Air M3 512GB - Nearly New",
        "description": "Barely used, original packaging, AppleCare included",
        "category": "Electronics",
        "asking_price": 950,
        "min_selling_price": 850,
        "condition": "like-new",
        "location": "Midtown, NY",
        "zip_code": "10022",
        "extras": ["original charger", "original cable"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "status": "active"
    },
    {
        "seller_id": "seller_005",
        "item_id": "ps5_001",
        "product_detail": "PlayStation 5 Console 2023",
        "description": "Complete with controllers and games, excellent condition",
        "category": "Electronics",
        "asking_price": 450,
        "min_selling_price": 400,
        "condition": "like-new",
        "location": "Queens, NY",
        "zip_code": "11375",
        "extras": ["extra controller", "3 games"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "status": "active"
    },
    {
        "seller_id": "seller_006",
        "item_id": "ipad_001",
        "product_detail": "iPad Air 2024 256GB WiFi + Cellular",
        "description": "Latest model, glass screen protector, with Apple Pencil",
        "category": "Electronics",
        "asking_price": 650,
        "min_selling_price": 600,
        "condition": "like-new",
        "location": "Astoria, NY",
        "zip_code": "11369",
        "extras": ["Apple Pencil", "case"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "status": "active"
    },
]

# Insert products
result = sellers_collection.insert_many(sample_products)
print(f"✅ Inserted {len(result.inserted_ids)} sample products into MongoDB")

# Verify insertion
count = sellers_collection.count_documents({})
print(f"📊 Total products in database: {count}")

# List all products
print("\n📦 Seeded Products:")
for product in sellers_collection.find():
    print(f"  - {product['product_detail']} (${product['asking_price']}) - {product.get('seller_id')}")

print("\n✅ Database seeding complete!")
