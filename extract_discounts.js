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
        // Look for discount percentage in various places
        const discountSelectors = [
            '.discount-percentage',
            '.discount-percent',
            '.sale-percent',
            '[class*="discount"]',
            '[class*="percent"]',
            '[class*="save"]'
        ];

        for (let selector of discountSelectors) {
            const discountEl = element.querySelector(selector);
            if (discountEl) {
                const text = discountEl.textContent;
                const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
                if (match) {
                    return parseFloat(match[1]);
                }
            }
        }

        // Calculate from prices if percentage not found
        const priceSelectors = [
            '.price-original, .original-price, .old-price, [class*="original"]',
            '.price-sale, .sale-price, .current-price, [class*="sale"], [class*="current"]'
        ];

        let originalPrice = null;
        let salePrice = null;

        // Try to find prices
        const allPrices = element.querySelectorAll('[class*="price"], [class*="Price"]');
        for (let priceEl of allPrices) {
            const text = priceEl.textContent.replace(/[^\d.,]/g, '').replace(',', '.');
            const price = parseFloat(text);

            if (!isNaN(price)) {
                if (priceEl.className.match(/original|old/i) || priceEl.style.textDecoration === 'line-through') {
                    originalPrice = price;
                } else if (priceEl.className.match(/sale|current|special/i)) {
                    salePrice = price;
                }
            }
        }

        // If we have both prices, calculate discount
        if (originalPrice && salePrice && originalPrice > salePrice) {
            return ((originalPrice - salePrice) / originalPrice) * 100;
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
        const priceEls = element.querySelectorAll('[class*="price"], [class*="Price"]');
        let originalPrice = 'N/A';
        let salePrice = 'N/A';
        let prices = [];

        for (let priceEl of priceEls) {
            const priceText = priceEl.textContent.trim();
            const classes = priceEl.className.toLowerCase();
            const styles = priceEl.style.cssText.toLowerCase();
            const computedStyle = window.getComputedStyle(priceEl);
            const isStrikethrough = computedStyle.textDecoration.includes('line-through') ||
                                   styles.includes('line-through');

            // Check for original/old price indicators
            if (classes.match(/original|old|was|before/i) || isStrikethrough) {
                originalPrice = priceText;
            }
            // Check for sale/current price indicators
            else if (classes.match(/sale|current|special|now|final/i)) {
                salePrice = priceText;
            }
            // Collect all prices if we can't identify them
            else if (priceText.match(/[€$£]\s*\d+|^\d+[.,]\d+/)) {
                prices.push(priceText);
            }
        }

        // If we couldn't identify prices, use heuristic: first is usually sale, second is original
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

    // Filter products with >25% discount
    const highDiscountProducts = [];

    products.forEach((product, index) => {
        const discount = getDiscountPercentage(product);

        if (discount > 25) {
            const info = extractProductInfo(product);
            highDiscountProducts.push({
                discount: discount.toFixed(2),
                ...info
            });

            // Highlight the product visually
            product.style.border = '3px solid #ff4444';
            product.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
            product.style.position = 'relative';

            // Add badge
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

    // Hide products with ≤25% discount completely
    products.forEach(product => {
        const discount = getDiscountPercentage(product);
        if (discount <= 25) {
            product.style.display = 'none';
        }
    });

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

    // Add download button
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

    // Summary overlay
    const summary = document.createElement('div');
    summary.innerHTML = `
        <strong>Discount Filter Results</strong><br>
        Total Products: ${products.length}<br>
        >25% Discount: ${highDiscountProducts.length}<br>
        <small>Showing only >25% discounts</small>
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

    console.log(`\n✅ Done! Showing ${highDiscountProducts.length} products with >25% discount.`);
    console.log('💡 Products with ≤25% discount are hidden.');

    return highDiscountProducts;
})();
