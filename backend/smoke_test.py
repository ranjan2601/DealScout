"""
Smoke test script for DealScout Backend v2.0
Tests basic connectivity and endpoint functionality.
"""

import requests
import json
import time
from typing import Dict, Any, Optional

BASE_URL = "http://localhost:8000"


class Colors:
    """ANSI color codes for terminal output."""
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    END = "\033[0m"


def print_section(title: str):
    """Print a test section header."""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}{title}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")


def test_endpoint(method: str, endpoint: str, data: Optional[Dict] = None, description: str = "") -> bool:
    """
    Test an API endpoint and report results.

    Args:
        method: HTTP method (GET, POST, etc.)
        endpoint: API endpoint path
        data: Request body (for POST/PUT)
        description: Test description

    Returns:
        True if successful, False otherwise
    """
    url = f"{BASE_URL}{endpoint}"

    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=30)
        else:
            return False

        status = response.status_code
        is_success = 200 <= status < 300

        # Print result
        color = Colors.GREEN if is_success else Colors.RED
        status_icon = "✓" if is_success else "✗"

        print(f"{color}{status_icon} [{method}] {endpoint} - Status {status}{Colors.END}")
        if description:
            print(f"   {description}")

        # Print response body for debugging
        if not is_success:
            try:
                print(f"   Response: {response.json()}")
            except:
                print(f"   Response: {response.text[:200]}")

        return is_success

    except requests.exceptions.ConnectionError:
        print(f"{Colors.RED}✗ [{method}] {endpoint} - Connection Error{Colors.END}")
        print(f"   {Colors.RED}Backend not running. Start with: python -m uvicorn backend.main:app --reload{Colors.END}")
        return False
    except requests.exceptions.Timeout:
        print(f"{Colors.RED}✗ [{method}] {endpoint} - Timeout{Colors.END}")
        return False
    except Exception as e:
        print(f"{Colors.RED}✗ [{method}] {endpoint} - Error: {str(e)}{Colors.END}")
        return False


def run_smoke_tests():
    """Run all smoke tests."""
    print(f"\n{Colors.BLUE}DealScout Backend v2.0 - Smoke Tests{Colors.END}")
    print(f"{Colors.BLUE}Testing URL: {BASE_URL}{Colors.END}")

    results = {"passed": 0, "failed": 0}

    # Test 1: Health Checks
    print_section("1. Health Checks")

    if test_endpoint("GET", "/", description="API root status"):
        results["passed"] += 1
    else:
        results["failed"] += 1

    if test_endpoint("GET", "/health", description="Database connectivity check"):
        results["passed"] += 1
    else:
        results["failed"] += 1

    if test_endpoint("GET", "/status", description="Service status"):
        results["passed"] += 1
    else:
        results["failed"] += 1

    # Test 2: Listings Endpoints
    print_section("2. Product Listings")

    if test_endpoint("GET", "/listings/", description="List all products"):
        results["passed"] += 1
    else:
        results["failed"] += 1

    if test_endpoint("GET", "/listings/search/products?q=bike", description="Search products"):
        results["passed"] += 1
    else:
        results["failed"] += 1

    # Test 3: Query Parsing
    print_section("3. Query Parsing")

    parse_data = {"query": "Find me a bike under $500"}
    if test_endpoint("POST", "/negotiation/parse", data=parse_data, description="Parse natural language query"):
        results["passed"] += 1
    else:
        results["failed"] += 1

    # Test 4: Negotiation Endpoints (with mock data)
    print_section("4. Negotiation Endpoints")

    # Note: These will fail if no products exist in DB, but they test endpoint connectivity
    negotiation_data = {"listing_ids": ["test_123"]}
    if test_endpoint("POST", "/negotiation/start", data=negotiation_data, description="Start negotiation"):
        results["passed"] += 1
    else:
        results["failed"] += 1

    # Test 5: Contract Endpoints
    print_section("5. Contract Endpoints")

    contract_data = {
        "negotiation_id": "neg_123",
        "buyer_id": "buyer_1",
        "seller_id": "seller_1",
        "listing_id": "listing_123",
        "product": {
            "product_detail": "Test Product",
            "asking_price": 1000,
            "condition": "good"
        },
        "final_price": 850
    }

    if test_endpoint("POST", "/contract/text", data=contract_data, description="Generate contract text"):
        results["passed"] += 1
    else:
        results["failed"] += 1

    # Summary
    print_section("Test Summary")

    total = results["passed"] + results["failed"]
    pass_rate = (results["passed"] / total * 100) if total > 0 else 0

    print(f"{Colors.GREEN}Passed: {results['passed']}/{total}{Colors.END}")
    print(f"{Colors.RED}Failed: {results['failed']}/{total}{Colors.END}")
    print(f"Pass Rate: {pass_rate:.1f}%")

    if results["failed"] == 0:
        print(f"\n{Colors.GREEN}✓ All tests passed!{Colors.END}")
        return True
    else:
        print(f"\n{Colors.YELLOW}⚠ Some tests failed. Check the output above for details.{Colors.END}")
        return False


def test_streaming():
    """Test SSE streaming endpoint."""
    print_section("Bonus: Streaming Test")

    try:
        url = f"{BASE_URL}/negotiation/stream"
        data = {"listing_ids": ["test_123"]}

        print(f"Testing SSE stream: {url}")
        print(f"(This will fail if no products in DB, but tests connectivity)\n")

        response = requests.post(url, json=data, stream=True, timeout=10)

        if response.status_code == 200:
            print(f"{Colors.GREEN}✓ Stream connection established{Colors.END}")
            print(f"  Media Type: {response.headers.get('content-type', 'unknown')}")
            print(f"  First 200 bytes: {response.raw.read(200)}")
        else:
            print(f"{Colors.YELLOW}Stream endpoint returned {response.status_code} (expected for test data){Colors.END}")

    except Exception as e:
        print(f"{Colors.YELLOW}Stream test skipped: {str(e)}{Colors.END}")


if __name__ == "__main__":
    try:
        success = run_smoke_tests()
        test_streaming()

        if success:
            exit(0)
        else:
            exit(1)

    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Tests interrupted by user{Colors.END}")
        exit(1)
    except Exception as e:
        print(f"{Colors.RED}Unexpected error: {e}{Colors.END}")
        exit(1)
