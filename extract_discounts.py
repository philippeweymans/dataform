#!/usr/bin/env python3
"""
VEVOR Discount Extractor - Python/Selenium Version

This script opens the page in a browser, extracts all product listings
with >25% discount, and saves them to a file.

Requirements:
    pip install selenium webdriver-manager

Usage:
    python extract_discounts.py
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import json
import time
import re


def extract_number(text):
    """Extract numeric value from text"""
    if not text:
        return 0
    # Remove currency symbols and convert comma to dot
    cleaned = re.sub(r'[^\d.,]', '', text).replace(',', '.')
    try:
        return float(cleaned)
    except ValueError:
        return 0


def get_discount_percentage(product_element, driver):
    """Extract discount percentage from product element"""

    # Try to find explicit discount percentage
    discount_selectors = [
        '.discount-percentage',
        '.discount-percent',
        '.sale-percent',
        '[class*="discount"]',
        '[class*="percent"]'
    ]

    for selector in discount_selectors:
        try:
            elements = product_element.find_elements(By.CSS_SELECTOR, selector)
            for elem in elements:
                text = elem.text
                match = re.search(r'(\d+(?:\.\d+)?)\s*%', text)
                if match:
                    return float(match.group(1))
        except:
            continue

    # Try to calculate from prices
    try:
        price_elements = product_element.find_elements(By.CSS_SELECTOR, '[class*="price"], [class*="Price"]')

        original_price = None
        sale_price = None

        for elem in price_elements:
            text = elem.text
            price = extract_number(text)

            # Check if it's original or sale price
            classes = elem.get_attribute('class').lower()
            style = elem.get_attribute('style') or ''

            if 'original' in classes or 'old' in classes or 'line-through' in style:
                original_price = price
            elif 'sale' in classes or 'current' in classes or 'special' in classes:
                sale_price = price

        # If we have both prices, calculate discount
        if original_price and sale_price and original_price > sale_price:
            return ((original_price - sale_price) / original_price) * 100

    except Exception as e:
        print(f"Error calculating discount: {e}")

    return 0


def extract_product_info(product_element):
    """Extract product information"""
    info = {
        'title': 'N/A',
        'link': '',
        'image': '',
        'original_price': 'N/A',
        'sale_price': 'N/A'
    }

    # Title
    try:
        title_selectors = ['[class*="title"]', '[class*="name"]', 'h2', 'h3', 'h4']
        for selector in title_selectors:
            try:
                title_elem = product_element.find_element(By.CSS_SELECTOR, selector)
                info['title'] = title_elem.text.strip()
                break
            except:
                continue
    except:
        pass

    # Link
    try:
        link_elem = product_element.find_element(By.CSS_SELECTOR, 'a')
        info['link'] = link_elem.get_attribute('href')
    except:
        pass

    # Image
    try:
        img_elem = product_element.find_element(By.TAG_NAME, 'img')
        info['image'] = img_elem.get_attribute('src')
    except:
        pass

    # Prices
    try:
        price_elements = product_element.find_elements(By.CSS_SELECTOR, '[class*="price"], [class*="Price"]')

        for elem in price_elements:
            classes = elem.get_attribute('class').lower()
            style = elem.get_attribute('style') or ''

            if 'original' in classes or 'old' in classes or 'line-through' in style:
                info['original_price'] = elem.text.strip()
            elif 'sale' in classes or 'current' in classes or 'special' in classes:
                info['sale_price'] = elem.text.strip()
    except:
        pass

    return info


def main():
    url = "https://www.vevor.nl/promotion/Vevor-Black-Friday-Sale-special-9877.html"

    print("🚀 Starting VEVOR discount extractor...")

    # Setup Chrome options
    chrome_options = Options()
    # chrome_options.add_argument('--headless')  # Uncomment for headless mode
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    # Initialize driver
    print("🌐 Initializing browser...")
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=chrome_options
    )

    try:
        # Open page
        print(f"📄 Loading page: {url}")
        driver.get(url)

        # Wait for page load
        time.sleep(5)

        # Try to find products with various selectors
        product_selectors = [
            '.product-item',
            '.product-card',
            '.product',
            '[class*="product-"]',
            '.goods-item',
            '.list-item'
        ]

        products = []
        for selector in product_selectors:
            try:
                products = driver.find_elements(By.CSS_SELECTOR, selector)
                if len(products) > 0:
                    print(f"✓ Found {len(products)} products using selector: {selector}")
                    break
            except:
                continue

        if not products:
            print("⚠️  No products found with standard selectors. Taking screenshot for debugging...")
            driver.save_screenshot('page_screenshot.png')
            print("📸 Screenshot saved as 'page_screenshot.png'")
            print("💡 Please inspect the page HTML and update selectors accordingly.")
            return

        # Extract products with >25% discount
        high_discount_products = []

        print("\n🔍 Analyzing products...")
        for i, product in enumerate(products):
            try:
                discount = get_discount_percentage(product, driver)

                if discount > 25:
                    info = extract_product_info(product)
                    info['discount'] = f"{discount:.2f}"
                    high_discount_products.append(info)

                    # Highlight in browser
                    driver.execute_script("""
                        arguments[0].style.border = '3px solid #ff4444';
                        arguments[0].style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
                    """, product)

                    print(f"  ✓ [{i+1}] {info['title'][:50]}... - {discount:.1f}% OFF")
                else:
                    # Fade out low discount items
                    driver.execute_script("""
                        arguments[0].style.opacity = '0.3';
                        arguments[0].style.filter = 'grayscale(100%)';
                    """, product)

            except Exception as e:
                print(f"  ⚠️  Error processing product {i+1}: {e}")
                continue

        # Display results
        print("\n" + "="*60)
        print(f"🎯 Found {len(high_discount_products)} items with >25% discount")
        print("="*60)

        for i, item in enumerate(high_discount_products, 1):
            print(f"\n{i}. {item['title']}")
            print(f"   💰 Discount: {item['discount']}%")
            print(f"   💵 Original: {item['original_price']} → Sale: {item['sale_price']}")
            print(f"   🔗 {item['link']}")

        # Save to JSON
        output_file = 'vevor_discounts.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(high_discount_products, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Results saved to: {output_file}")

        # Save to CSV
        try:
            import csv
            csv_file = 'vevor_discounts.csv'
            if high_discount_products:
                with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=high_discount_products[0].keys())
                    writer.writeheader()
                    writer.writerows(high_discount_products)
                print(f"💾 CSV saved to: {csv_file}")
        except Exception as e:
            print(f"⚠️  Could not save CSV: {e}")

        print("\n✅ Done! Browser window will stay open for 30 seconds...")
        time.sleep(30)

    finally:
        driver.quit()
        print("👋 Browser closed.")


if __name__ == '__main__':
    main()
