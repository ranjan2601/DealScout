"""
Fetch product images from Unsplash and update the database
Uses Unsplash API to get realistic product images
"""

import requests
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "dealscout")

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
sellers_collection = db["sellers"]

# Image URLs from Unsplash (using direct image URLs that don't require API key)
IMAGE_URLS = {
    "mountain-bike": [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1599027528406-245d5d43ef7e?w=500&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1553287528-8f7a4cb3bef8?w=500&h=500&fit=crop&q=80",
    ],
    "macbook": [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1516321318423-f06f70674e90?w=500&h=500&fit=crop&q=80",
    ],
    "electronics": [
        "https://images.unsplash.com/photo-1505234427474-8814c1efdbf4?w=500&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop&q=80",
        "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=500&fit=crop&q=80",
    ]
}

def update_product_images():
    """Update all products with real images from Unsplash"""
    try:
        products = list(sellers_collection.find({}))
        print(f"Found {len(products)} products to update with images")

        for product in products:
            category = product.get("category", "electronics")
            images = IMAGE_URLS.get(category, IMAGE_URLS["electronics"])

            # Update with 3 images
            sellers_collection.update_one(
                {"_id": product["_id"]},
                {"$set": {"images": images[:3]}}
            )
            print(f"✓ Updated {product.get('product_detail', 'Unknown')} with {len(images[:3])} images")

        print(f"\n✓ Successfully updated all {len(products)} products with images!")

    except Exception as e:
        print(f"✗ Error updating images: {e}")

if __name__ == "__main__":
    update_product_images()
