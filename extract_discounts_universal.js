/**
 * VEVOR Universal Discount Filter
 *
 * Works on multiple VEVOR pages:
 * - Black Friday sales
 * - Clearance pages
 * - Regular product listings
 *
 * Usage:
 * 1. Adjust configuration below
 * 2. Open any VEVOR page
 * 3. Open console (F12)
 * 4. Paste and run this script
 */

(function() {
    'use strict';

    // ============ CONFIGURATION ============
    const CONFIG = {
        MIN_DISCOUNT: 25,           // Minimum discount % to show
        PREFER_PRICE_CALC: false,   // If true, calculate from prices instead of reading %
        MAX_DISCOUNT: 90,           // Maximum reasonable discount %
        CURRENCY: '€',              // Currency symbol
        DEBUG_MODE: false           // Show detailed logs
    };
    // =======================================

    console.log('🔍 Starting universal discount filter...');
    console.log(`⚙️  Min discount: ${CONFIG.MIN_DISCOUNT}%`);

    // Function to extract discount percentage (universal)
    function getDiscountPercentage(element) {
        const allText = element.textContent;

        // METHOD 1: Calculate from prices (most reliable for all pages)
        if (CONFIG.PREFER_PRICE_CALC || true) { // Always try this first
            const priceMatches = allText.match(/€\s*\d{1,6}[.,]\d{2}/g);

            if (priceMatches && priceMatches.length >= 2) {
                const prices = priceMatches
                    .map(p => parseFloat(p.replace('€', '').replace(',', '.').trim()))
                    .filter(p => p > 0 && p < 100000);

                if (prices.length >= 2) {
                    prices.sort((a, b) => b - a);
                    const originalPrice = prices[0];
                    const salePrice = prices[1];

                    if (originalPrice > salePrice) {
                        const discount = ((originalPrice - salePrice) / originalPrice) * 100;
                        if (discount >= 5 && discount <= CONFIG.MAX_DISCOUNT) {
                            return discount;
                        }
                    }
                }
            }
        }

        // METHOD 2: Look for explicit percentage display
        const percentPattern = /(?:korting|save|off|sale|clearance)?\s*(\d+)\s*%|(\d+)\s*%\s*(?:korting|save|off|sale|clearance)/gi;
        const matches = allText.match(percentPattern);

        if (matches) {
            const percentages = matches.map(match => {
                const num = match.match(/(\d+)/);
                return num ? parseInt(num[1]) : 0;
            }).filter(p => p >= 5 && p <= CONFIG.MAX_DISCOUNT);

            if (percentages.length > 0) {
                return percentages[0];
            }
        }

        // METHOD 3: Look in specific discount badge elements
        const badges = element.querySelectorAll('[class*="discount"], [class*="Discount"], [class*="sale"], [class*="Sale"], [class*="badge"]');
        for (let badge of badges) {
            const text = badge.textContent.trim();
            const match = text.match(/(\d+)\s*%/);
            if (match) {
                const percent = parseInt(match[1]);
                if (percent >= 5 && percent <= CONFIG.MAX_DISCOUNT) {
                    return percent;
                }
            }
        }

        return 0;
    }

    // Function to extract product info
    function extractProductInfo(element) {
        const titleEl = element.querySelector('[class*="title"], [class*="name"], [class*="Title"], [class*="Name"], h2, h3, h4, a');
        const title = titleEl ? titleEl.textContent.trim() : 'N/A';

        const linkEl = element.querySelector('a[href*="product"], a[href*="item"], a[href]');
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
            const priceMatches = priceText.match(/€\s*\d{1,6}[.,]\d{2}/g);

            if (priceMatches && priceMatches.length >= 2) {
                const validPrices = priceMatches
                    .map(p => p.replace(/\s+/g, ' ').trim())
                    .filter(p => {
                        const num = parseFloat(p.replace('€', '').replace(',', '.').trim());
                        return num > 0 && num < 100000;
                    });

                if (validPrices.length >= 2) {
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
            const computedStyle = window.getComputedStyle(priceEl);
            const isStrikethrough = computedStyle.textDecoration.includes('line-through');

            if ((classes.match(/original|old|was|before/i) || isStrikethrough) && priceMatches) {
                originalPrice = priceMatches[0].replace(/\s+/g, ' ').trim();
            } else if (classes.match(/sale|current|special|now|final/i) && priceMatches) {
                salePrice = priceMatches[0].replace(/\s+/g, ' ').trim();
            }
        }

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

    // Find all product listings with multiple selector strategies
    const productSelectors = [
        '.product-item',
        '.product-card',
        '.product',
        '[class*="product-"]',
        '[class*="item-"]',
        '[class*="goods"]',
        '.goods-item',
        '.list-item',
        '.flex_box',
        '[class*="clearance"]',
        '[class*="sale-item"]'
    ];

    let products = [];
    let usedSelector = '';

    for (let selector of productSelectors) {
        products = document.querySelectorAll(selector);
        if (products.length > 10) { // Need substantial number to be product list
            usedSelector = selector;
            console.log(`✓ Found ${products.length} products using selector: ${selector}`);
            break;
        }
    }

    // Fallback: try to find repeated elements
    if (products.length === 0) {
        console.warn('⚠️ No products found with standard selectors. Trying pattern detection...');
        const allDivs = document.querySelectorAll('div[class]');
        const classCount = {};

        allDivs.forEach(div => {
            const className = div.className.split(' ')[0];
            if (className && div.querySelector('img') && div.textContent.match(/€\s*\d+/)) {
                classCount[className] = (classCount[className] || 0) + 1;
            }
        });

        const maxClass = Object.keys(classCount).reduce((a, b) =>
            classCount[a] > classCount[b] ? a : b, ''
        );

        if (maxClass && classCount[maxClass] > 10) {
            products = document.querySelectorAll(`.${maxClass}`);
            usedSelector = `.${maxClass}`;
            console.log(`✓ Found ${products.length} potential products using pattern: ${usedSelector}`);
        }
    }

    if (products.length === 0) {
        console.error('❌ Could not find product listings.');
        console.log('💡 Try running debug_clearance.js first to analyze the page');
        return;
    }

    // Convert and clean up page
    const productsArray = Array.from(products);
    console.log('🗑️  Cleaning up page...');

    // Find main product container
    let productContainer = products[0]?.parentElement;
    while (productContainer && productContainer !== document.body) {
        const childProducts = Array.from(productContainer.children).filter(child =>
            productsArray.some(p => child.contains(p))
        );
        if (childProducts.length >= productsArray.length * 0.8) {
            break;
        }
        productContainer = productContainer.parentElement;
    }

    // Remove everything except product container
    if (productContainer) {
        const keepElements = new Set();
        let elem = productContainer;
        while (elem && elem !== document.body) {
            keepElements.add(elem);
            elem = elem.parentElement;
        }

        Array.from(document.body.children).forEach(child => {
            if (!keepElements.has(child) && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE') {
                child.remove();
            }
        });

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

    document.body.style.margin = '0';
    document.body.style.padding = '20px';
    document.body.style.backgroundColor = '#f5f5f5';

    // Filter products
    const highDiscountProducts = [];
    const highDiscountElements = [];

    console.log(`🔍 Analyzing discounts (>${CONFIG.MIN_DISCOUNT}%)...`);

    products.forEach((product, index) => {
        const discount = getDiscountPercentage(product);

        if (CONFIG.DEBUG_MODE && index < 3) {
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

    console.log(`Found ${highDiscountProducts.length} products with >${CONFIG.MIN_DISCOUNT}% discount out of ${products.length} total`);

    // Create clean container
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

    // Add download button
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
        a.download = `vevor_discounts_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
    document.body.appendChild(downloadBtn);

    // Add summary
    const summary = document.createElement('div');
    summary.innerHTML = `
        <strong>✅ Discount Filter Active</strong><br>
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

    // Console output
    console.log('\n' + '='.repeat(60));
    console.log(`🎯 Found ${highDiscountProducts.length} items with >${CONFIG.MIN_DISCOUNT}% discount:`);
    console.log('='.repeat(60) + '\n');

    highDiscountProducts.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   💰 Discount: ${item.discount}%`);
        console.log(`   💵 Original: ${item.originalPrice} → Sale: ${item.salePrice}`);
        console.log(`   🔗 ${item.link}`);
        console.log('');
    });

    console.log('\n📊 Export data (copy as JSON):');
    console.log(JSON.stringify(highDiscountProducts, null, 2));

    console.log(`\n✅ Done! Showing ${highDiscountProducts.length} products with >${CONFIG.MIN_DISCOUNT}% discount.`);

    return highDiscountProducts;
})();
