# Quick Start Guide

Get your Mysore map up and running in 5 minutes!

## Step 1: Get Mapbox Token (2 minutes)

1. Go to https://www.mapbox.com/
2. Sign up (it's free - 50,000 map loads/month)
3. Copy your "Default public token" from the dashboard
4. Open `app.js` and paste it on line 2

## Step 2: Add Your Links (1 minute)

Open `index.html` and update (lines 35-50):
- Instagram URL
- Twitter/X URL
- Buy Me a Coffee URL

## Step 3: Test It (1 minute)

Double-click `index.html` or run:
```bash
python3 -m http.server 8000
```

Visit: http://localhost:8000

## Step 4: Deploy (1 minute)

### Easiest: Netlify
1. Go to https://app.netlify.com/drop
2. Drag your folder
3. Done! You get a URL like `your-site.netlify.app`

### Custom domain?
Add it in Netlify settings (it's free!)

## Updating Your Data

### From Notion:
1. Export your Notion database as CSV
2. Replace `data.csv`
3. Refresh your site (or re-deploy to Netlify)

### Quick Edit:
- Open `data.csv` in Excel or Google Sheets
- Edit and save
- Refresh

## Need Help?

Check `README.md` for detailed instructions.

## Pro Tips

1. **Better coordinates**: If a place doesn't show up, open its Google Maps link in browser, copy the URL with coordinates, update CSV

2. **Categories**: Use the Tags column - separate with commas: "Food, Coffee"

3. **Preview image**: For better social sharing, create a screenshot of your map and update the `og:image` in `index.html` (line 19)

4. **Performance**: With 170+ places, the map loads in ~2 seconds. That's great!

5. **Mobile**: Everything is responsive and works beautifully on phones

## What's Included

```
mysore-map-page/
├── index.html      # Main page
├── style.css       # Styling
├── app.js          # Map logic (ADD YOUR TOKEN HERE!)
├── data.csv        # Your places data
├── README.md       # Full documentation
└── QUICK_START.md  # This file
```

That's it! Enjoy your map!
