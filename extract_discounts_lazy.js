/**
 * VEVOR Discount Filter - With Lazy Loading Support
 *
 * Waits for products to load before filtering
 * Works on pages that use lazy loading (like clearance)
 */

(function() {
    'use strict';

    // ============ CONFIGURATION ============
    const CONFIG = {
        MIN_DISCOUNT: 25,
        MAX_WAIT_TIME: 10000,  // Wait up to 10 seconds for products to load
        CHECK_INTERVAL: 500     // Check every 500ms
    };

    console.log('🔍 Starting discount filter with lazy loading support...');
    console.log('⏳ Waiting for products to load...');

    // Function to check if a product has actual content
    function hasContent(element) {
        const text = element.textContent.trim();
        const hasPrice = text.match(/€\s*\d+/);
        const hasImage = element.querySelector('img');
        return text.length > 50 && (hasPrice || hasImage);
    }

    // Function to find products with content
    function findLoadedProducts() {
        const selectors = [
            '.product-item',
            '.product-card',
            '[class*="product-"]',
            '[class*="item-"]',
            '.goods-item',
            '.flex_box'
        ];

        for (let selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 5) {
                // Check if at least some have content
                const withContent = Array.from(elements).filter(hasContent);
                if (withContent.length >= elements.length * 0.5) {
                    console.log(`✓ Found ${elements.length} products (${withContent.length} loaded) using: ${selector}`);
                    return { elements, selector };
                }
            }
        }
        return null;
    }

    // Wait for products to load
    let attempts = 0;
    const maxAttempts = CONFIG.MAX_WAIT_TIME / CONFIG.CHECK_INTERVAL;

    function checkAndStart() {
        const result = findLoadedProducts();

        if (result && result.elements.length > 0) {
            console.log(`✅ Products loaded! Starting filter...`);
            startFiltering(result.elements);
        } else {
            attempts++;
            if (attempts < maxAttempts) {
                console.log(`⏳ Waiting... (attempt ${attempts}/${maxAttempts})`);
                setTimeout(checkAndStart, CONFIG.CHECK_INTERVAL);
            } else {
                console.error('❌ Timeout: Products did not load within 10 seconds');
                console.log('💡 Try scrolling down the page to trigger lazy loading, then run the script again');
            }
        }
    }

    // Start the checking process
    checkAndStart();

    // Main filtering function
    function startFiltering(products) {
        console.log(`Processing ${products.length} products...`);

        // Import the discount extraction logic
        function getDiscountPercentage(element) {
            const allText = element.textContent;

            // Try percentage pattern first
            const percentPattern = /(?:korting|save|off|sale)?\s*(\d+)\s*%|(\d+)\s*%\s*(?:korting|save|off|sale)/gi;
            const matches = allText.match(percentPattern);

            if (matches) {
                const percentages = matches.map(match => {
                    const num = match.match(/(\d+)/);
                    return num ? parseInt(num[1]) : 0;
                }).filter(p => p >= 5 && p <= 90);

                if (percentages.length > 0) {
                    return percentages[0];
                }
            }

            // Calculate from prices
            const priceMatches = allText.match(/€\s*\d{1,6}[.,]\d{2}/g);
            if (priceMatches && priceMatches.length >= 2) {
                const prices = priceMatches
                    .map(p => parseFloat(p.replace('€', '').replace(',', '.').trim()))
                    .filter(p => p > 0 && p < 100000);

                if (prices.length >= 2) {
                    prices.sort((a, b) => b - a);
                    const discount = ((prices[0] - prices[1]) / prices[0]) * 100;
                    if (discount >= 5 && discount <= 90) {
                        return discount;
                    }
                }
            }

            return 0;
        }

        function extractProductInfo(element) {
            const titleEl = element.querySelector('[class*="title"], [class*="name"], h2, h3, h4, a');
            const title = titleEl ? titleEl.textContent.trim() : 'N/A';

            const linkEl = element.querySelector('a[href]');
            const link = linkEl ? linkEl.href : '';

            const imgEl = element.querySelector('img');
            const image = imgEl ? imgEl.src : '';

            const allText = element.textContent;
            const priceMatches = allText.match(/€\s*\d{1,6}[.,]\d{2}/g);

            let originalPrice = 'N/A';
            let salePrice = 'N/A';

            if (priceMatches && priceMatches.length >= 2) {
                salePrice = priceMatches[0];
                originalPrice = priceMatches[1];
            } else if (priceMatches && priceMatches.length === 1) {
                salePrice = priceMatches[0];
            }

            return { title, link, image, originalPrice, salePrice };
        }

        // Filter and display
        const highDiscountProducts = [];
        const highDiscountElements = [];

        products.forEach((product, index) => {
            const discount = getDiscountPercentage(product);

            if (index < 3) {
                console.log(`Product ${index + 1}: ${discount.toFixed(1)}% discount`);
            }

            if (discount > CONFIG.MIN_DISCOUNT) {
                const info = extractProductInfo(product);
                highDiscountProducts.push({
                    discount: discount.toFixed(2),
                    ...info
                });

                highDiscountElements.push(product);

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

        console.log(`Found ${highDiscountProducts.length} products with >${CONFIG.MIN_DISCOUNT}% discount`);

        if (highDiscountProducts.length === 0) {
            console.warn('⚠️ No products found with discount >' + CONFIG.MIN_DISCOUNT + '%');
            console.log('💡 Try lowering MIN_DISCOUNT in the config or check if discounts are displayed differently');
            return;
        }

        // Clean layout
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

        highDiscountElements.forEach(product => {
            const clone = product.cloneNode(true);
            clone.style.margin = '0';
            clone.style.display = 'block';
            clone.style.border = '3px solid #ff4444';
            clone.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
            newContainer.appendChild(clone);
        });

        document.body.innerHTML = '';
        document.body.appendChild(newContainer);
        document.body.style.margin = '0';
        document.body.style.padding = '20px';
        document.body.style.backgroundColor = '#f5f5f5';

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = `📥 Download (>${CONFIG.MIN_DISCOUNT}% off)`;
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
            a.download = `vevor_clearance_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };
        document.body.appendChild(downloadBtn);

        // Summary
        const summary = document.createElement('div');
        summary.innerHTML = `
            <strong>✅ Filter Active</strong><br>
            Showing: ${highDiscountProducts.length} products<br>
            <small>All with >${CONFIG.MIN_DISCOUNT}% discount</small>
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

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Done! Showing ${highDiscountProducts.length} products`);
        console.log('='.repeat(60));
    }

})();
