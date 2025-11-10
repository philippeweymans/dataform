/**
 * Scroll and Filter - For lazy-loaded pages
 *
 * This script:
 * 1. Scrolls down the page to trigger lazy loading
 * 2. Waits for all products to load
 * 3. Then applies the discount filter
 */

(function() {
    'use strict';

    const CONFIG = {
        MIN_DISCOUNT: 25,
        SCROLL_DELAY: 1000,     // Wait 1s between scrolls
        SCROLL_STEPS: 5         // Scroll 5 times
    };

    console.log('🔍 Scroll & Filter starting...');
    console.log('📜 Scrolling page to trigger lazy loading...');

    let currentStep = 0;

    function scrollStep() {
        if (currentStep < CONFIG.SCROLL_STEPS) {
            const scrollAmount = (window.innerHeight * 0.8) * (currentStep + 1);
            window.scrollTo({
                top: scrollAmount,
                behavior: 'smooth'
            });

            currentStep++;
            console.log(`📜 Scroll step ${currentStep}/${CONFIG.SCROLL_STEPS}...`);

            setTimeout(scrollStep, CONFIG.SCROLL_DELAY);
        } else {
            // Scroll back to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            setTimeout(() => {
                console.log('✅ Scrolling complete! Starting filter...\n');
                startFilter();
            }, 1000);
        }
    }

    function startFilter() {
        // Find products
        const selectors = [
            '.product-item',
            '.product-card',
            '[class*="product-"]',
            '[class*="item-"]',
            '.goods-item',
            '.flex_box'
        ];

        let products = [];
        let usedSelector = '';

        for (let selector of selectors) {
            const elements = document.querySelectorAll(selector);
            // Check if elements have content
            const withContent = Array.from(elements).filter(el => {
                return el.textContent.trim().length > 50;
            });

            if (withContent.length >= 10) {
                products = withContent;
                usedSelector = selector;
                console.log(`✓ Found ${products.length} products with content using: ${selector}`);
                break;
            }
        }

        if (products.length === 0) {
            console.error('❌ No products found even after scrolling');
            console.log('💡 The page might use a different structure. Try:');
            console.log('   1. Run debug_clearance.js to analyze the page');
            console.log('   2. Check the page source for product container classes');
            return;
        }

        // Filter by discount
        function getDiscountPercentage(element) {
            const text = element.textContent;

            // Look for percentage
            const percentMatch = text.match(/(\d+)\s*%\s*(?:off|korting|save)?/i);
            if (percentMatch) {
                const percent = parseInt(percentMatch[1]);
                if (percent >= 5 && percent <= 90) {
                    return percent;
                }
            }

            // Calculate from prices
            const prices = text.match(/€\s*\d{1,6}[.,]\d{2}/g);
            if (prices && prices.length >= 2) {
                const nums = prices
                    .map(p => parseFloat(p.replace('€', '').replace(',', '.').trim()))
                    .filter(n => n > 0);

                if (nums.length >= 2) {
                    nums.sort((a, b) => b - a);
                    const discount = ((nums[0] - nums[1]) / nums[0]) * 100;
                    if (discount >= 5 && discount <= 90) {
                        return discount;
                    }
                }
            }

            return 0;
        }

        const filtered = [];
        const elements = [];

        console.log('\n🔍 Analyzing products...');
        products.forEach((product, i) => {
            const discount = getDiscountPercentage(product);

            if (i < 3) {
                console.log(`  Product ${i + 1}: ${discount.toFixed(1)}% off`);
            }

            if (discount > CONFIG.MIN_DISCOUNT) {
                const title = product.querySelector('a, h2, h3, [class*="title"]')?.textContent.trim() || 'N/A';
                const link = product.querySelector('a')?.href || '';

                filtered.push({
                    discount: discount.toFixed(2),
                    title,
                    link
                });

                elements.push(product);

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

        console.log(`\n✅ Found ${filtered.length} products with >${CONFIG.MIN_DISCOUNT}% discount`);

        if (filtered.length === 0) {
            console.warn('⚠️ No high-discount products found');
            console.log('💡 Try lowering MIN_DISCOUNT or check if the page shows discounts');
            return;
        }

        // Reorganize page
        const container = document.createElement('div');
        container.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;

        elements.forEach(el => {
            const clone = el.cloneNode(true);
            clone.style.margin = '0';
            clone.style.border = '3px solid #ff4444';
            container.appendChild(clone);
        });

        document.body.innerHTML = '';
        document.body.style.cssText = 'margin:0; padding:20px; background:#f5f5f5;';
        document.body.appendChild(container);

        // Download button
        const btn = document.createElement('button');
        btn.innerHTML = `📥 Download Results`;
        btn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 15px 25px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;
        btn.onclick = () => {
            const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vevor_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };
        document.body.appendChild(btn);

        console.log('\n📊 Data:', filtered);
    }

    // Start scrolling
    scrollStep();

})();
