/**
 * VEVOR Discount Filter - Browser Console Script
 *
 * Usage:
 * 1. Open https://www.vevor.nl/promotion/Vevor-Black-Friday-Sale-special-9877.html
 * 2. Open browser console (F12)
 * 3. Paste and run this script
 *
 * This will highlight and extract all items with >25% discount
 */

(function() {
    'use strict';

    console.log('🔍 Starting discount filter...');

    // Function to extract discount percentage from various formats
    function getDiscountPercentage(element) {
        // FIRST: Try to calculate from prices (most reliable)
        let originalPrice = null;
        let salePrice = null;

        // Extract prices from the text
        const allText = element.textContent;
        const priceMatches = allText.match(/€\s*\d{1,6}[.,]\d{2}/g);

        if (priceMatches && priceMatches.length >= 2) {
            // Clean and parse prices
            const prices = priceMatches
                .map(p => parseFloat(p.replace('€', '').replace(',', '.').trim()))
                .filter(p => p > 0 && p < 100000);

            if (prices.length >= 2) {
                // Sort prices: highest first
                prices.sort((a, b) => b - a);
                originalPrice = prices[0];
                salePrice = prices[1];

                // Calculate discount
                if (originalPrice > salePrice) {
                    const discount = ((originalPrice - salePrice) / originalPrice) * 100;
                    // Only return if it's a reasonable discount (5-90%)
                    if (discount >= 5 && discount <= 90) {
                        return discount;
                    }
                }
            }
        }

        // SECOND: Look for explicit discount percentage (but be strict)
        // Only look in specific discount badge elements, not all text
        const discountBadgeSelectors = [
            '[class*="discount"]',
            '[class*="Discount"]',
            '[class*="badge"]',
            '[class*="label"]'
        ];

        for (let selector of discountBadgeSelectors) {
            const badges = element.querySelectorAll(selector);
            for (let badge of badges) {
                const text = badge.textContent.trim();
                // Must have % and OFF/korting nearby
                const match = text.match(/(\d+)\s*%\s*(?:OFF|off|korting|KORTING)/i);
                if (match) {
                    const percent = parseFloat(match[1]);
                    // Only accept reasonable discounts
                    if (percent >= 5 && percent <= 90) {
                        return percent;
                    }
                }
            }
        }

        return 0;
    }

    // Function to extract product info
    function extractProductInfo(element) {
        const titleEl = element.querySelector('[class*="title"], [class*="name"], h2, h3, h4');
        const title = titleEl ? titleEl.textContent.trim() : 'N/A';

        const linkEl = element.querySelector('a[href*="product"], a[href*="item"]') || element.querySelector('a');
        const link = linkEl ? linkEl.href : '';

        const imgEl = element.querySelector('img');
        const image = imgEl ? imgEl.src : '';

        // Enhanced price extraction
        const priceEls = element.querySelectorAll('[class*="price"], [class*="Price"], span, div');
        let originalPrice = 'N/A';
        let salePrice = 'N/A';
        let prices = [];

        for (let priceEl of priceEls) {
            const priceText = priceEl.textContent.trim();

            // Extract all prices from the text (handles multiple prices in one element)
            // Match € followed by valid price (must have at least 1 digit and proper decimal)
            const priceMatches = priceText.match(/€\s*\d{1,6}[.,]\d{2}/g);

            if (priceMatches && priceMatches.length >= 2) {
                // Clean up whitespace and filter out invalid prices
                const validPrices = priceMatches
                    .map(p => p.replace(/\s+/g, ' ').trim())
                    .filter(p => {
                        const num = parseFloat(p.replace('€', '').replace(',', '.').trim());
                        return num > 0 && num < 100000; // Reasonable price range
                    });

                if (validPrices.length >= 2) {
                    // If we find multiple valid prices, assume first is sale, second is original
                    salePrice = validPrices[0];
                    originalPrice = validPrices[1];
                    break;
                }
            } else if (priceMatches && priceMatches.length === 1) {
                const cleaned = priceMatches[0].replace(/\s+/g, ' ').trim();
                const num = parseFloat(cleaned.replace('€', '').replace(',', '.').trim());
                if (num > 0 && num < 100000) {
                    prices.push(cleaned);
                }
            }

            const classes = priceEl.className.toLowerCase();
            const styles = priceEl.style.cssText.toLowerCase();
            const computedStyle = window.getComputedStyle(priceEl);
            const isStrikethrough = computedStyle.textDecoration.includes('line-through') ||
                                   styles.includes('line-through');

            // Check for original/old price indicators
            if ((classes.match(/original|old|was|before/i) || isStrikethrough) && priceMatches) {
                originalPrice = priceMatches[0];
            }
            // Check for sale/current price indicators
            else if (classes.match(/sale|current|special|now|final/i) && priceMatches) {
                salePrice = priceMatches[0];
            }
        }

        // If we couldn't identify prices, use collected prices
        if (originalPrice === 'N/A' && salePrice === 'N/A' && prices.length >= 2) {
            salePrice = prices[0];
            originalPrice = prices[1];
        } else if (originalPrice === 'N/A' && prices.length >= 1) {
            originalPrice = prices[0];
        } else if (salePrice === 'N/A' && prices.length >= 1) {
            salePrice = prices[0];
        }

        return { title, link, image, originalPrice, salePrice };
    }

    // Find all product listings (try common selectors)
    const productSelectors = [
        '.product-item',
        '.product-card',
        '.product',
        '[class*="product-"]',
        '[class*="item-"]',
        '.goods-item',
        '.list-item'
    ];

    let products = [];
    for (let selector of productSelectors) {
        products = document.querySelectorAll(selector);
        if (products.length > 0) {
            console.log(`✓ Found ${products.length} products using selector: ${selector}`);
            break;
        }
    }

    if (products.length === 0) {
        console.warn('⚠️ No products found with common selectors. Trying alternative approach...');
        // Try to find repeated elements
        const allDivs = document.querySelectorAll('div[class]');
        const classCount = {};

        allDivs.forEach(div => {
            const className = div.className.split(' ')[0];
            if (className && div.querySelector('img') && div.textContent.match(/\d+.*%|€|EUR/)) {
                classCount[className] = (classCount[className] || 0) + 1;
            }
        });

        // Find most common class (likely products)
        let maxClass = Object.keys(classCount).reduce((a, b) =>
            classCount[a] > classCount[b] ? a : b, ''
        );

        if (maxClass) {
            products = document.querySelectorAll(`.${maxClass}`);
            console.log(`✓ Found ${products.length} potential products using pattern: .${maxClass}`);
        }
    }

    if (products.length === 0) {
        console.error('❌ Could not find product listings. Please inspect the page and update selectors.');
        return;
    }

    // Convert NodeList to Array for easier manipulation
    const productsArray = Array.from(products);

    console.log('🗑️  Cleaning up page...');

    // Find the main container that holds all products
    let productContainer = products[0]?.parentElement;
    while (productContainer && productContainer !== document.body) {
        // Check if this container holds most/all products
        const childProducts = Array.from(productContainer.children).filter(child =>
            productsArray.some(p => child.contains(p))
        );
        if (childProducts.length >= productsArray.length * 0.8) {
            break;
        }
        productContainer = productContainer.parentElement;
    }

    console.log('📦 Found product container:', productContainer?.className || productContainer?.tagName);

    // Remove EVERYTHING from body except the product container and its parents
    if (productContainer) {
        // Mark the container and its parents to keep them
        let elem = productContainer;
        const keepElements = new Set();
        while (elem && elem !== document.body) {
            keepElements.add(elem);
            elem = elem.parentElement;
        }

        // Remove all direct children of body that we don't need
        Array.from(document.body.children).forEach(child => {
            if (!keepElements.has(child) && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE') {
                child.remove();
            }
        });

        // Remove siblings of our container path
        keepElements.forEach(keeper => {
            if (keeper.parentElement) {
                Array.from(keeper.parentElement.children).forEach(sibling => {
                    if (!keepElements.has(sibling) && !sibling.contains(productContainer)) {
                        sibling.remove();
                    }
                });
            }
        });
    }

    // Clean up body styling
    document.body.style.margin = '0';
    document.body.style.padding = '20px';
    document.body.style.backgroundColor = '#f5f5f5';

    // Filter products with >25% discount and keep references
    const highDiscountProducts = [];
    const highDiscountElements = [];

    console.log('🔍 Analyzing discounts...');
    products.forEach((product, index) => {
        const discount = getDiscountPercentage(product);

        // Debug: log first 3 products
        if (index < 3) {
            console.log(`Product ${index + 1}: ${discount.toFixed(1)}% discount`);
        }

        if (discount > 25) {
            const info = extractProductInfo(product);
            highDiscountProducts.push({
                discount: discount.toFixed(2),
                ...info
            });

            // Keep reference to the element
            highDiscountElements.push(product);

            // Add discount badge
            const badge = document.createElement('div');
            badge.innerHTML = `🔥 ${discount.toFixed(1)}% OFF`;
            badge.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: #ff4444;
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-weight: bold;
                z-index: 1000;
                font-size: 14px;
            `;
            product.style.position = 'relative';
            product.insertBefore(badge, product.firstChild);
        }
    });

    console.log(`Found ${highDiscountProducts.length} products with >25% discount out of ${products.length} total`);

    // Create a new clean container for high-discount products
    console.log('📐 Reorganizing layout...');
    const newContainer = document.createElement('div');
    newContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    // Move high-discount products to new container
    highDiscountElements.forEach(product => {
        // Clone the product to preserve it
        const clone = product.cloneNode(true);
        // Clean up styling
        clone.style.margin = '0';
        clone.style.display = 'block';
        clone.style.border = '3px solid #ff4444';
        clone.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
        newContainer.appendChild(clone);
    });

    // Replace body content with new container
    document.body.innerHTML = '';
    document.body.appendChild(newContainer);

    // Re-add download button
    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = '📥 Download Results (>25% off)';
    downloadBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 15px 25px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    `;
    downloadBtn.onclick = function() {
        const dataStr = JSON.stringify(highDiscountProducts, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vevor_discounts_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
    document.body.appendChild(downloadBtn);

    // Re-add summary overlay
    const summary = document.createElement('div');
    summary.innerHTML = `
        <strong>✅ Discount Filter Active</strong><br>
        Showing: ${highDiscountProducts.length} products<br>
        <small>All with >25% discount</small>
    `;
    summary.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        padding: 15px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        border-radius: 5px;
        font-size: 14px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(summary);

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 Found ${highDiscountProducts.length} items with >25% discount:`);
    console.log('='.repeat(60) + '\n');

    highDiscountProducts.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   💰 Discount: ${item.discount}%`);
        console.log(`   💵 Original: ${item.originalPrice} → Sale: ${item.salePrice}`);
        console.log(`   🔗 ${item.link}`);
        console.log('');
    });

    // Create exportable data
    console.log('\n📊 Export data (copy as JSON):');
    console.log(JSON.stringify(highDiscountProducts, null, 2));

    console.log(`\n✅ Done! Showing ${highDiscountProducts.length} products with >25% discount.`);
    console.log('💡 Products with ≤25% discount are hidden.');

    return highDiscountProducts;
})();
