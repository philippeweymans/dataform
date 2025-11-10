/**
 * VEVOR Clearance Page Discount Filter
 *
 * Based on analysis showing:
 * - Products in: .listGoods_box
 * - Prices in: .js-userPrice, .compItem_priceWrap
 * - Format: "11999 € 170,99 €"
 */

(function() {
    'use strict';

    const MIN_DISCOUNT = 25;

    console.log('🔍 Starting clearance page filter...');

    // Find actual product container (not skeleton)
    const productContainer = document.querySelector('.listGoods_box, .js-goodsList');

    if (!productContainer) {
        console.error('❌ Could not find .listGoods_box container');
        return;
    }

    const products = Array.from(productContainer.children).filter(child => {
        // Filter out skeleton loaders
        return !child.className.includes('skeleton');
    });

    console.log(`✓ Found ${products.length} real products (excluding skeletons)`);

    if (products.length === 0) {
        console.warn('⚠️ No products loaded yet. Try scrolling down first!');
        return;
    }

    // Extract discount from product
    function getDiscountPercentage(element) {
        const text = element.textContent;

        // Look for explicit percentage
        const percentMatch = text.match(/(\d+)\s*%/);
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

    // Extract product info
    function extractProductInfo(element) {
        const title = element.querySelector('[class*="title"], [class*="name"], a')?.textContent.trim() || 'N/A';
        const link = element.querySelector('a')?.href || '';
        const image = element.querySelector('img')?.src || '';

        const priceBox = element.querySelector('.js-userPrice, .compItem_priceWrap');
        const priceText = priceBox ? priceBox.textContent : '';
        const prices = priceText.match(/€\s*\d{1,6}[.,]\d{2}/g) || [];

        return {
            title,
            link,
            image,
            salePrice: prices[0] || 'N/A',
            originalPrice: prices[1] || 'N/A'
        };
    }

    // Filter products
    const filtered = [];
    const elements = [];

    console.log('\n🔍 Analyzing products...');
    products.forEach((product, i) => {
        const discount = getDiscountPercentage(product);

        if (i < 3) {
            console.log(`Product ${i + 1}: ${discount.toFixed(1)}% off`);
        }

        if (discount > MIN_DISCOUNT) {
            const info = extractProductInfo(product);
            filtered.push({
                discount: discount.toFixed(2),
                ...info
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

    console.log(`\n✅ Found ${filtered.length} products with >${MIN_DISCOUNT}% discount`);

    if (filtered.length === 0) {
        console.warn('⚠️ No high-discount products found');
        return;
    }

    // Clean page
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
        clone.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.5)';
        container.appendChild(clone);
    });

    document.body.innerHTML = '';
    document.body.style.cssText = 'margin:0; padding:20px; background:#f5f5f5;';
    document.body.appendChild(container);

    // Download button
    const btn = document.createElement('button');
    btn.innerHTML = `📥 Download (${filtered.length} items)`;
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
        a.download = `vevor_clearance_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
    document.body.appendChild(btn);

    // Summary
    const summary = document.createElement('div');
    summary.innerHTML = `
        <strong>✅ Clearance Filter</strong><br>
        Showing: ${filtered.length} products<br>
        <small>All with >${MIN_DISCOUNT}% discount</small>
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

    console.log('\n📊 Results:', filtered);
    console.log(`\n✅ Done! Showing ${filtered.length} products with >${MIN_DISCOUNT}% discount.`);

    return filtered;
})();
