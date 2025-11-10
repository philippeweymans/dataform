# VEVOR Discount Extractor

Scripts to visually filter and extract product listings with >25% discounts from the VEVOR Black Friday sale page.

## 🚀 Quick Start

### Option 1: Browser Console Script (Easiest)

1. **Open the page**: Navigate to https://www.vevor.nl/promotion/Vevor-Black-Friday-Sale-special-9877.html
2. **Open Developer Console**: Press `F12` (or `Cmd+Option+I` on Mac)
3. **Copy & Paste**: Copy all contents from `extract_discounts.js` and paste into the console
4. **Press Enter**: The script will run and:
   - Highlight products with >25% discount in red
   - Fade out products with ≤25% discount
   - Add discount badges to qualifying items
   - Display results in console
   - Add a download button to save results as JSON

### Option 2: Python/Selenium Script (Automated)

**Prerequisites:**
```bash
pip install selenium webdriver-manager
```

**Run:**
```bash
python extract_discounts.py
```

This will:
- Open the page in a Chrome browser
- Automatically find all products
- Extract and highlight items with >25% discount
- Save results to `vevor_discounts.json` and `vevor_discounts.csv`
- Keep browser open for 30 seconds to review

## 📋 Features

### Visual Filtering
- **Red border + shadow**: Items with >25% discount
- **Discount badge**: Shows exact percentage (e.g., "🔥 35.5% OFF")
- **Faded/grayscale**: Items with ≤25% discount

### Data Extraction
Each product includes:
- Product title
- Discount percentage
- Original price
- Sale price
- Product link
- Image URL

### Export Options
- **JSON**: Structured data for further processing
- **CSV**: Spreadsheet-compatible format
- **Console output**: Immediate viewing in browser

## 🎯 Example Output

```json
[
  {
    "discount": "35.50",
    "title": "VEVOR Wireless Pressure Washer",
    "originalPrice": "€199.99",
    "salePrice": "€129.00",
    "link": "https://www.vevor.nl/...",
    "image": "https://..."
  }
]
```

## 🔧 Customization

### Change Discount Threshold

In `extract_discounts.js`, modify line:
```javascript
if (discount > 25) {  // Change 25 to your threshold
```

In `extract_discounts.py`, modify line:
```python
if discount > 25:  # Change 25 to your threshold
```

### Update Product Selectors

If the script doesn't find products, update the `productSelectors` array:

```javascript
const productSelectors = [
    '.your-product-class',  // Add your selector
    '.product-item',
    // ...
];
```

## 🐛 Troubleshooting

**No products found?**
1. Inspect the page HTML (F12 → Elements)
2. Find the CSS class for product containers
3. Update `productSelectors` in the script

**Discount calculation incorrect?**
1. Check how discounts are displayed on the page
2. Update `discountSelectors` or price extraction logic

**403 Error (Python)?**
- The site has bot protection
- Try running with browser visible (comment out `--headless`)
- Add delays with `time.sleep()`

## 📊 Use Cases

- Find best Black Friday deals (>25% off)
- Price comparison and tracking
- Export deals for sharing
- Automated deal monitoring

## 🔒 Notes

- Scripts run locally in your browser/computer
- No data is sent to external servers
- Respects the website's content (read-only)
- For personal use only

## 📝 License

Free to use and modify for personal purposes.
