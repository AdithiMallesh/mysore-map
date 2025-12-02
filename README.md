# Mysore Interactive Map

An interactive, shareable map of Mysore featuring curated places to eat, stay, explore, and more. Built with Mapbox GL JS and vanilla JavaScript.

## Features

- Interactive map with custom markers
- Category filtering (Food, Coffee, Shopping, Stays, etc.)
- Search functionality
- Detailed place cards with curator notes, timings, trivia, and more
- Mobile-responsive design
- SEO-optimized with Open Graph tags
- Direct links to Google Maps

## Setup Instructions

### 1. Get a Mapbox Access Token

1. Go to [Mapbox](https://www.mapbox.com/) and create a free account
2. Navigate to your [Account Dashboard](https://account.mapbox.com/)
3. Create a new token or copy your default public token
4. Copy the token

### 2. Add Your Mapbox Token

Open `app.js` and replace the placeholder on line 2:

```javascript
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN_HERE';
```

With your actual token:

```javascript
mapboxgl.accessToken = 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwi...';
```

### 3. Update Social Links

Open `index.html` and update your social media links in the header section:

```html
<!-- Around line 35-45 -->
<a href="https://your-instagram.com" target="_blank" aria-label="Instagram">
<a href="https://twitter.com/your-handle" target="_blank" aria-label="Twitter">
<a href="https://www.buymeacoffee.com/yourusername" target="_blank" class="coffee-btn">
```

### 4. Test Locally

Simply open `index.html` in your web browser, or use a local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Then visit http://localhost:8000
```

## Updating Your Data

### Method 1: Export from Notion to CSV

1. Open your Notion database
2. Click the "..." menu in the top right
3. Select "Export" → "CSV"
4. Replace `data.csv` with your new export
5. Refresh your browser

### Method 2: Edit CSV Directly

You can edit `data.csv` directly in any text editor or spreadsheet software (Excel, Google Sheets, etc.)

**Important CSV Columns:**
- `Name` - Place name (required)
- `Link` - Google Maps URL (required for coordinates)
- `Tags` - Categories (comma-separated: "Food, Coffee")
- `Curators Note` - Your personal note
- `Must Try` - Recommended items/experiences
- `Timings` - Operating hours
- `Recommended Time` - Best time to visit
- `Ticket Price` - Entry fees (if applicable)
- `Trivia` - Interesting facts/history
- `Dietary Preference` - Veg/Non-veg

## Deployment

### Option 1: Netlify (Recommended)

1. Create a [Netlify](https://www.netlify.com/) account
2. Drag and drop your project folder to Netlify
3. Your site is live!

To update: Just replace `data.csv` in your folder and drag-drop again.

### Option 2: Vercel

1. Create a [Vercel](https://vercel.com/) account
2. Install Vercel CLI: `npm i -g vercel`
3. Run `vercel` in your project directory
4. Follow the prompts

### Option 3: GitHub Pages

1. Create a GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/mysore-map.git
   git push -u origin main
   ```
3. Go to Settings → Pages → Select "main" branch → Save
4. Your site will be live at `https://yourusername.github.io/mysore-map`

## Customization

### Change Colors

Edit `style.css` at the top (line 8-14):

```css
:root {
    --primary-color: #2c3e50;  /* Main color */
    --accent-color: #e74c3c;   /* Accent color */
    --text-color: #333;         /* Text color */
    --bg-color: #ffffff;        /* Background */
}
```

### Change Map Style

In `app.js` (line 19), change the Mapbox style:

```javascript
style: 'mapbox://styles/mapbox/light-v11',
```

Available styles:
- `mapbox://styles/mapbox/streets-v12`
- `mapbox://styles/mapbox/outdoors-v12`
- `mapbox://styles/mapbox/light-v11`
- `mapbox://styles/mapbox/dark-v11`
- `mapbox://styles/mapbox/satellite-v9`

### Add More Categories

1. Add filter button in `index.html`:
   ```html
   <button class="filter-btn" data-category="YourCategory">Your Label</button>
   ```

2. Add the tag to places in your CSV under the `Tags` column

## Troubleshooting

### Map not showing

- Check that you've added your Mapbox token in `app.js`
- Check browser console for errors (F12)
- Verify your token is valid at mapbox.com

### Places not appearing

- Check that CSV has valid Google Maps links
- Look at browser console for "Could not geocode" warnings
- Verify CSV column names match exactly

### Google Maps short URLs not working

The app will try to geocode by place name. If it still fails:
1. Open the short URL in your browser
2. Copy the full URL from address bar
3. Update your CSV with the full URL

## Technical Details

### Coordinate Extraction

The app extracts coordinates from Google Maps URLs in these formats:
1. Direct coordinates: `?q=12.345,76.789`
2. Place URLs: `/@12.345,76.789`
3. Short URLs: Uses Mapbox Geocoding API as fallback

### Performance

- All data is loaded client-side (no backend required)
- Geocoding is cached in browser
- ~170 places load in under 2 seconds

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Credits

Built with:
- [Mapbox GL JS](https://www.mapbox.com/mapbox-gljs)
- [PapaParse](https://www.papaparse.com/) (CSV parsing)

## License

Feel free to fork and customize for your own city!
