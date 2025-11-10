/**
 * DEBUG VERSION - VEVOR Discount Filter
 * This version logs detailed information to help fix the detection
 */

(function() {
    'use strict';

    console.log('🔍 DEBUG MODE - Starting discount filter...');

    // Find all product listings (try common selectors)
    const productSelectors = [
        '.product-item',
        '.product-card',
        '.product',
        '[class*="product-"]',
        '[class*="item-"]',
        '.goods-item',
        '.list-item',
        '.flex_box'  // Added based on your output
    ];

    let products = [];
    let usedSelector = '';
    for (let selector of productSelectors) {
        products = document.querySelectorAll(selector);
        if (products.length > 0) {
            usedSelector = selector;
            console.log(`✓ Found ${products.length} products using selector: ${selector}`);
            break;
        }
    }

    if (products.length === 0) {
        console.error('❌ No products found');
        return;
    }

    // Debug first product in detail
    console.log('\n🔬 DEBUGGING FIRST PRODUCT:');
    console.log('='.repeat(60));

    const firstProduct = products[0];
    console.log('Full HTML:', firstProduct.outerHTML.substring(0, 500) + '...');
    console.log('\nFull Text Content:', firstProduct.textContent.trim().substring(0, 300));

    // Look for percentages
    console.log('\n📊 Looking for percentage patterns:');
    const allText = firstProduct.textContent;
    const percentMatches = allText.match(/(\d+(?:\.\d+)?)\s*%/gi);
    console.log('Found percentages:', percentMatches);

    // Look for prices
    console.log('\n💰 Looking for prices:');
    const priceMatches = allText.match(/€?\s*\d+[.,]\d+/g);
    console.log('Found price patterns:', priceMatches);

    // Check all elements with prices
    console.log('\n🔍 Checking price elements:');
    const priceElements = firstProduct.querySelectorAll('span, div');
    let priceCount = 0;
    for (let el of priceElements) {
        const text = el.textContent.trim();
        if (text.match(/€?\s*\d+[.,]\d+/)) {
            const computedStyle = window.getComputedStyle(el);
            console.log(`  - "${text}"`);
            console.log(`    Class: ${el.className}`);
            console.log(`    Strikethrough: ${computedStyle.textDecoration.includes('line-through')}`);
            priceCount++;
            if (priceCount >= 5) break; // Limit output
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 PASTE THIS OUTPUT AND SHARE IT');
    console.log('='.repeat(60));

    // Also try second and third product
    if (products.length > 1) {
        console.log('\n🔬 SECOND PRODUCT TEXT:');
        console.log(products[1].textContent.trim().substring(0, 200));
    }

    if (products.length > 2) {
        console.log('\n🔬 THIRD PRODUCT TEXT:');
        console.log(products[2].textContent.trim().substring(0, 200));
    }

})();
