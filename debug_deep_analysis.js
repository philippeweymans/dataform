/**
 * Deep Analysis - Find where product data actually is
 * Run on https://www.vevor.nl/clearance
 */

(function() {
    'use strict';

    console.log('🔬 DEEP ANALYSIS - Finding actual product data...\n');

    // 1. Check what the empty elements actually contain
    console.log('1️⃣ ANALYZING EMPTY ELEMENTS:');
    console.log('='.repeat(60));

    const emptyItems = document.querySelectorAll('[class*="item-"]');
    if (emptyItems.length > 0) {
        const first = emptyItems[0];
        console.log(`Found ${emptyItems.length} elements with [class*="item-"]`);
        console.log('\nFirst element HTML (truncated):');
        console.log(first.outerHTML.substring(0, 500));
        console.log('\nClass name:', first.className);
        console.log('Child count:', first.children.length);
        console.log('Children tags:', Array.from(first.children).map(c => c.tagName).join(', '));
    }

    // 2. Look for elements that actually have prices
    console.log('\n2️⃣ SEARCHING FOR ELEMENTS WITH PRICES:');
    console.log('='.repeat(60));

    const allElements = document.querySelectorAll('*');
    const withPrices = [];

    allElements.forEach(el => {
        const text = el.textContent.trim();
        if (text.match(/€\s*\d{2,}/)) {
            // Has a price
            const priceCount = (text.match(/€/g) || []).length;
            if (priceCount >= 1 && priceCount <= 5) {  // Likely a product
                withPrices.push({
                    element: el,
                    tag: el.tagName,
                    className: el.className,
                    textLength: text.length
                });
            }
        }
    });

    console.log(`Found ${withPrices.length} elements containing prices`);

    if (withPrices.length > 0) {
        // Find most common class pattern
        const classCount = {};
        withPrices.forEach(item => {
            if (item.className) {
                const firstClass = item.className.split(' ')[0];
                classCount[firstClass] = (classCount[firstClass] || 0) + 1;
            }
        });

        console.log('\nMost common classes:');
        Object.entries(classCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([cls, count]) => {
                console.log(`  ${cls}: ${count} elements`);
            });

        console.log('\nFirst 3 elements with prices:');
        withPrices.slice(0, 3).forEach((item, i) => {
            console.log(`\n${i + 1}. Tag: ${item.tag}, Class: ${item.className}`);
            console.log(`   Text (first 150 chars): ${item.element.textContent.trim().substring(0, 150)}`);
        });
    }

    // 3. Look for product grid containers
    console.log('\n3️⃣ LOOKING FOR PRODUCT GRID CONTAINERS:');
    console.log('='.repeat(60));

    const gridPatterns = [
        'grid',
        'list',
        'container',
        'products',
        'items',
        'goods',
        'catalog'
    ];

    const containers = [];
    document.querySelectorAll('div[class], section[class]').forEach(el => {
        const className = el.className.toLowerCase();
        const hasGridPattern = gridPatterns.some(pattern => className.includes(pattern));

        if (hasGridPattern && el.children.length >= 5) {
            containers.push({
                element: el,
                className: el.className,
                childCount: el.children.length
            });
        }
    });

    console.log(`Found ${containers.length} potential product containers`);
    containers.slice(0, 5).forEach((cont, i) => {
        console.log(`${i + 1}. ${cont.className} (${cont.childCount} children)`);
    });

    // 4. Check for iframes or shadow DOM
    console.log('\n4️⃣ CHECKING FOR IFRAMES/SHADOW DOM:');
    console.log('='.repeat(60));

    const iframes = document.querySelectorAll('iframe');
    console.log(`Iframes found: ${iframes.length}`);

    const shadowRoots = [];
    document.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) {
            shadowRoots.push(el);
        }
    });
    console.log(`Shadow DOM roots found: ${shadowRoots.length}`);

    // 5. Look for data attributes or Vue/React roots
    console.log('\n5️⃣ CHECKING FOR JS FRAMEWORK DATA:');
    console.log('='.repeat(60));

    const vueRoot = document.querySelector('[data-v-app], #app, [id*="vue"]');
    const reactRoot = document.querySelector('[data-reactroot], #root, [id*="react"]');

    console.log('Vue root:', vueRoot ? vueRoot.id || vueRoot.className : 'Not found');
    console.log('React root:', reactRoot ? reactRoot.id || reactRoot.className : 'Not found');

    // Look for elements with data attributes
    const withData = document.querySelectorAll('[data-product], [data-goods], [data-item]');
    console.log(`Elements with data-* attributes: ${withData.length}`);

    // 6. RECOMMENDATIONS
    console.log('\n6️⃣ RECOMMENDATIONS:');
    console.log('='.repeat(60));

    if (withPrices.length === 0) {
        console.log('⚠️  NO PRICES FOUND ON PAGE');
        console.log('   → Products might not be loaded yet');
        console.log('   → Try scrolling down first');
        console.log('   → Check if page uses infinite scroll');
    } else if (withPrices.length > 10) {
        console.log('✅ Found elements with prices!');
        console.log('   → Try using the most common class from step 2');
        console.log('   → Or target elements that contain 2 prices (original + sale)');
    }

    if (iframes.length > 0) {
        console.log('⚠️  Page has iframes - products might be inside iframe');
    }

    if (shadowRoots.length > 0) {
        console.log('⚠️  Page uses Shadow DOM - special handling needed');
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Scroll down the page to load products');
    console.log('   2. Run this script again');
    console.log('   3. Share the output showing elements with prices');

})();
