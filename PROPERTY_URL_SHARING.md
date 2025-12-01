# Property URL Sharing Feature

## ✅ Implemented

Each property now has a unique URL that can be shared. When someone opens the link, the site will automatically open with that property's modal displayed.

## How It Works

### URL Format
- **Format:** `https://www.finlay-brewer-international.com/#property-1`
- **Example:** `https://www.finlay-brewer-international.com/#property-5`

The property ID (e.g., `property-1`, `property-5`) comes from the `id` field in `public/data/properties.json`.

### Automatic Behavior

1. **When Opening a Property Modal:**
   - The URL automatically updates to include the property hash
   - Example: Clicking property "property-3" updates URL to `#property-3`

2. **When Closing a Property Modal:**
   - The URL hash is automatically removed
   - URL returns to the base URL

3. **When Opening a Shared Link:**
   - If someone opens `https://www.finlay-brewer-international.com/#property-2`
   - The site automatically loads and opens the property modal for "property-2"

4. **Browser Navigation:**
   - Browser back/forward buttons work correctly
   - Users can navigate between properties using browser history

## How to Share a Property

### Method 1: Copy URL After Opening
1. Open any property modal on the site
2. The URL in the browser address bar will automatically update
3. Copy the URL and share it

### Method 2: Manual URL Construction
1. Find the property ID in `public/data/properties.json`
2. Construct the URL: `https://www.finlay-brewer-international.com/#[property-id]`
3. Example: For property with `id: "property-1"`, the URL is:
   ```
   https://www.finlay-brewer-international.com/#property-1
   ```

## Technical Details

### Implementation
- Uses URL hash fragments (`#property-id`) for clean URLs
- Uses `history.pushState` for smooth navigation (no page reload)
- Listens for `popstate` events to handle browser back/forward buttons
- Automatically checks URL hash on page load

### Property IDs
- Property IDs are defined in `public/data/properties.json`
- Each property must have a unique `id` field
- Format: `"property-1"`, `"property-2"`, etc.

### Browser Compatibility
- Works in all modern browsers
- Falls back gracefully for older browsers

## Example URLs

```
https://www.finlay-brewer-international.com/#property-1
https://www.finlay-brewer-international.com/#property-2
https://www.finlay-brewer-international.com/#property-3
```

## Use Cases

1. **Email Marketing:** Send direct links to specific properties
2. **Social Media:** Share individual properties on social platforms
3. **Referrals:** Send clients direct links to properties they're interested in
4. **SEO:** Each property can be indexed with its unique URL
5. **Analytics:** Track which properties are being shared most

## Notes

- If a property ID in the URL doesn't exist, the hash is automatically removed
- The modal opens smoothly without page reload
- Works with all property sources (hero carousel, property grid, etc.)

