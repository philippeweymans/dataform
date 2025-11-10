/**
 * DEBUG - Check clearance page structure
 * Run this on https://www.vevor.nl/clearance
 */

(function() {
    'use strict';

    console.log('🔍 DEBUG MODE - Analyzing clearance page...');

    // Try all product selectors
    const productSelectors = [
        '.product-item',
        '.product-card',
        '.product',
        '[class*="product-"]',
        '[class*="item-"]',
        '.goods-item',
        '.list-item',
        '.flex_box'
    ];

    console.log('\n📦 Testing product selectors:');
    let products = [];
    let usedSelector = '';

    for (let selector of productSelectors) {
        const found = document.querySelectorAll(selector);
        console.log(`  ${selector}: ${found.length} elements`);
        if (found.length > 0 && products.length === 0) {
            products = found;
            usedSelector = selector;
        }
    }

    if (products.length === 0) {
        console.error('❌ No products found with any selector');
        console.log('\n💡 Try inspecting the page and looking for product container class names');
        return;
    }

    console.log(`\n✅ Using selector: ${usedSelector} (${products.length} products)`);

    // Analyze first 3 products
    console.log('\n🔬 ANALYZING FIRST 3 PRODUCTS:\n');

    for (let i = 0; i < Math.min(3, products.length); i++) {
        const product = products[i];
        console.log(`${'='.repeat(60)}`);
        console.log(`PRODUCT ${i + 1}:`);
        console.log(`${'='.repeat(60)}`);

        // Get text content
        const text = product.textContent.trim().substring(0, 300);
        console.log('Text content:', text);

        // Look for percentages
        const percentMatches = text.match(/(\d+)\s*%/g);
        console.log('\n% patterns found:', percentMatches);

        // Look for "korting" keyword
        const kortingMatch = text.match(/korting/gi);
        console.log('Has "korting":', kortingMatch ? 'YES' : 'NO');

        // Look for prices
        const priceMatches = text.match(/€\s*\d+[.,]\d{2}/g);
        console.log('Price patterns found:', priceMatches);

        // Check for discount badges
        const discountBadges = product.querySelectorAll('[class*="discount"], [class*="Discount"], [class*="badge"], [class*="sale"], [class*="Sale"]');
        console.log('Discount badge elements:', discountBadges.length);

        if (discountBadges.length > 0) {
            console.log('Badge texts:');
            discountBadges.forEach((badge, idx) => {
                console.log(`  ${idx + 1}. "${badge.textContent.trim().substring(0, 50)}"`);
            });
        }

        console.log('\n');
    }

    console.log('\n📊 SUMMARY:');
    console.log(`Total products: ${products.length}`);
    console.log(`Selector used: ${usedSelector}`);
    console.log('\n💡 Check the output above to see how discounts are displayed');

})();
