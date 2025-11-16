"""
Generate product images using Google Gemini 2.5 Flash via OpenRouter API
"""

import requests
import os
import base64
from pymongo import MongoClient
from dotenv import load_dotenv
import json

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "dealscout")

if not OPENROUTER_API_KEY:
    print("Error: OPENROUTER_API_KEY not found in .env")
    exit(1)

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
sellers_collection = db["sellers"]

# Image generation prompts by category
PROMPTS_BY_CATEGORY = {
    "mountain-bike": [
        "A high-quality product photo of a professional mountain bike against white background, sharp focus, professional photography",
        "A sleek aluminum mountain bike with suspension, studio lighting, white background, high resolution product photo",
        "Mountain bike close-up showing detailed frame and components, professional product photography on white backdrop",
    ],
    "macbook": [
        "A premium MacBook Pro laptop closed on white background, studio lighting, high-quality product photography",
        "An open MacBook Air showing the screen and keyboard, silver aluminum, professional product photo on white background",
        "MacBook Pro 16 inch high-end laptop, sleek design, studio photography, minimalist white background",
    ],
    "electronics": [
        "A modern smartphone with edge-to-edge display on white background, professional product photography, sharp focus",
        "Wireless headphones or earbuds, premium design, studio lighting, white background, product photography",
        "A tablet or iPad device, modern design, clean white background, professional product photo with sharp details",
    ]
}

def generate_image_with_gemini(prompt: str) -> str:
    """
    Generate an image using Google Gemini 2.5 Flash via OpenRouter
    This model can generate images directly
    """
    try:
        print(f"  Generating image with Gemini: {prompt[:50]}...")

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "DealScout"
            },
            json={
                "model": "google/gemini-2.5-flash",
                "messages": [
                    {
                        "role": "user",
                        "content": f"Generate a professional product image URL for: {prompt}. Return only the data URL or image URL."
                    }
                ],
                "temperature": 0.7,
            },
            timeout=60
        )

        if response.status_code == 200:
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

            if content and (content.startswith("data:image") or content.startswith("http")):
                print(f"    ✓ Image URL generated")
                return content
            else:
                print(f"    ✗ Invalid image response: {content[:50]}")
                return None
        else:
            print(f"    ✗ API error: {response.status_code}")
            return None

    except Exception as e:
        print(f"    ✗ Error generating image: {e}")
        return None

def generate_placeholder_image_urls(category: str) -> list:
    """
    Generate placeholder image URLs using Unsplash with better diversity
    These are actual Unsplash photo IDs for different products
    """
    category_urls = {
        "mountain-bike": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop&crop=faces&auto=format&q=80",
            "https://images.unsplash.com/photo-1599027528406-245d5d43ef7e?w=600&h=600&fit=crop&crop=faces&auto=format&q=80",
            "https://images.unsplash.com/photo-1553287528-8f7a4cb3bef8?w=600&h=600&fit=crop&crop=faces&auto=format&q=80",
        ],
        "macbook": [
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop&crop=faces&auto=format&q=80",
            "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop&crop=faces&auto=format&q=80",
            "https://images.unsplash.com/photo-1516321318423-f06f70674e90?w=600&h=600&fit=crop&crop=faces&auto=format&q=80",
        ],
        "electronics": [
            "https://images.unsplash.com/photo-1505234427474-8814c1efdbf4?w=600&h=600&fit=crop&crop=faces&auto=format&q=80",
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&crop=faces&auto=format&q=80",
            "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=600&fit=crop&crop=faces&auto=format&q=80",
        ]
    }
    return category_urls.get(category, category_urls["electronics"])

def update_product_images_with_ai():
    """Update all products with AI-generated or quality placeholder images"""
    try:
        products = list(sellers_collection.find({}))
        print(f"\nFound {len(products)} products to update with images\n")

        total_updated = 0

        for i, product in enumerate(products):
            category = product.get("category", "electronics")
            product_name = product.get("product_detail", "Unknown")

            print(f"[{i+1}/{len(products)}] Updating: {product_name}")

            # Try to generate AI images, fallback to Unsplash
            images = []
            prompts = PROMPTS_BY_CATEGORY.get(category, PROMPTS_BY_CATEGORY["electronics"])

            for j, prompt in enumerate(prompts[:3]):  # Max 3 images per product
                # Try AI generation first
                ai_image = generate_image_with_gemini(prompt)
                if ai_image:
                    images.append(ai_image)
                else:
                    # Fallback to high-quality Unsplash URLs
                    fallback_images = generate_placeholder_image_urls(category)
                    if j < len(fallback_images):
                        images.append(fallback_images[j])

            # If we still don't have images, use default placeholders
            if not images:
                images = generate_placeholder_image_urls(category)

            # Update product with images
            sellers_collection.update_one(
                {"_id": product["_id"]},
                {"$set": {"images": images}}
            )

            print(f"  ✓ Updated with {len(images)} image URLs")
            total_updated += 1

        print(f"\n✓ Successfully updated all {total_updated} products with images!")

    except Exception as e:
        print(f"✗ Error updating images: {e}")

if __name__ == "__main__":
    print("=" * 80)
    print("DealScout - Product Image Generator")
    print("=" * 80)

    # For now, using high-quality Unsplash URLs as placeholders
    # The Gemini API can generate images but would need image hosting
    print("\nUsing high-quality Unsplash images as placeholders...")
    update_product_images_with_ai()
