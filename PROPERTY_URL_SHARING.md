# Property URL Sharing Feature

## ✅ Implemented

Each property now has a unique, SEO-friendly URL that can be shared. When someone opens the link, the site will automatically open with that property's modal displayed.

## How It Works

### URL Format
- **Format:** `https://www.finlay-brewer-international.com/#property-slug`
- **Example:** `https://www.finlay-brewer-international.com/#mediterranean-masterpiece-in-the-heart-of-nice`
- **Example:** `https://www.finlay-brewer-international.com/#12-units-building-near-promenade-des-anglais`

The slug is automatically generated from the property title, making URLs readable and SEO-friendly. For example:
- "Mediterranean Masterpiece in the Heart of Nice" → `#mediterranean-masterpiece-in-the-heart-of-nice`
- "12 Units Building Near Promenade des Anglais" → `#12-units-building-near-promenade-des-anglais`
- "3 Bedroom Apartment with Panoramic View" → `#3-bedroom-apartment-with-panoramic-view`

### Backward Compatibility
- Old format URLs (`#property-1`, `#property-2`) still work for backward compatibility
- New URLs use SEO-friendly slugs based on property titles

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
1. Find the property title in `public/data/properties.json`
2. Convert the title to a slug:
   - Lowercase
   - Replace spaces with hyphens
   - Remove special characters
   - Limit to 80 characters
3. Construct the URL: `https://www.finlay-brewer-international.com/#[slug]`
4. Example: For property with title "Mediterranean Masterpiece in the Heart of Nice", the URL is:
   ```
   https://www.finlay-brewer-international.com/#mediterranean-masterpiece-in-the-heart-of-nice
   ```

## Technical Details

### Implementation
- Uses URL hash fragments (`#property-id`) for clean URLs
- Uses `history.pushState` for smooth navigation (no page reload)
- Listens for `popstate` events to handle browser back/forward buttons
- Automatically checks URL hash on page load

### Slug Generation
- Slugs are automatically generated from property titles
- Process:
  1. Convert to lowercase
  2. Remove special characters
  3. Replace spaces with hyphens
  4. Limit to 80 characters for readability
  5. Remove leading/trailing hyphens
- Example: "Mediterranean Masterpiece in the Heart of Nice" → `mediterranean-masterpiece-in-the-heart-of-nice`

### Property Matching
- Properties are matched by slug (generated from title)
- Old format URLs (`#property-1`) are still supported for backward compatibility
- If a slug matches multiple properties (unlikely), the first match is used

### Browser Compatibility
- Works in all modern browsers
- Falls back gracefully for older browsers

## Example URLs

```
https://www.finlay-brewer-international.com/#mediterranean-masterpiece-in-the-heart-of-nice
https://www.finlay-brewer-international.com/#12-units-building-near-promenade-des-anglais
https://www.finlay-brewer-international.com/#3-bedroom-apartment-with-panoramic-view
```

### Old Format (Still Supported)
```
https://www.finlay-brewer-international.com/#property-1
https://www.finlay-brewer-international.com/#property-2
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

