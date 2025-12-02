# Deployment Checklist

Before deploying your Mysore map, make sure you've completed these steps:

## Essential Steps

- [ ] **Add Mapbox Token** in `app.js` (line 2)
  - Get it from: https://account.mapbox.com/
  - Free tier: 50,000 map loads/month

- [ ] **Update Social Links** in `index.html` (lines 35-50)
  - [ ] Instagram URL
  - [ ] Twitter/X URL
  - [ ] Buy Me a Coffee URL

- [ ] **Test Locally**
  - Open `index.html` in browser
  - Check that map loads
  - Check that pins appear
  - Click a few places to test cards
  - Try filtering by category
  - Try search functionality

## Optional but Recommended

- [ ] **Custom Domain**
  - Purchase domain (Namecheap, Google Domains, etc.)
  - Add to Netlify/Vercel settings

- [ ] **Preview Image** (for social sharing)
  - Take a screenshot of your map
  - Save as `preview-image.jpg`
  - Update `og:image` in `index.html` (line 19)
  - Use full URL: `https://yourdomain.com/preview-image.jpg`

- [ ] **Analytics** (optional)
  - Add Google Analytics
  - Or use Netlify Analytics
  - Or Plausible (privacy-friendly)

- [ ] **Favicon** (optional)
  - Create 32x32px icon
  - Add to `index.html`: `<link rel="icon" href="favicon.ico">`

- [ ] **Update Title & Description**
  - Line 6: Change "Curated by Adithi" to your name
  - Line 9: Update description if needed

## Data Quality Check

- [ ] **Test Coordinates**
  - Open browser console (F12)
  - Look for "Could not geocode" warnings
  - Fix any problematic entries in CSV

- [ ] **Check All Columns**
  - Name - all places have names?
  - Link - all Google Maps links work?
  - Tags - properly categorized?
  - Notes - proofread for typos?

## Performance

- [ ] **Image Optimization** (if you add images later)
  - Compress images before uploading
  - Use WebP format

- [ ] **Test on Mobile**
  - Check responsive design
  - Test touch interactions
  - Verify card scrolling works

## SEO & Sharing

- [ ] **Test Social Preview**
  - Use: https://www.opengraph.xyz/
  - Enter your URL
  - Check how it looks on Twitter/Facebook

- [ ] **Google Search Console** (after deployment)
  - Submit sitemap
  - Request indexing

## Deployment Platforms

### Netlify (Recommended)
```bash
# Option 1: Drag & Drop
Go to: https://app.netlify.com/drop

# Option 2: CLI
npm install -g netlify-cli
netlify deploy
```

### Vercel
```bash
npm install -g vercel
vercel
```

### GitHub Pages
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/mysore-map.git
git push -u origin main

# Enable Pages in repo settings
```

## Post-Deployment

- [ ] **Share the Link!**
  - Instagram story
  - Twitter
  - WhatsApp groups
  - Reddit (r/Mysore)

- [ ] **Monitor Usage**
  - Check Mapbox usage dashboard
  - Track social engagement
  - Collect feedback

- [ ] **Set Up Updates**
  - Decide update frequency (weekly? monthly?)
  - Set reminder to update CSV
  - Document new places you discover

## Troubleshooting

### Map doesn't load
- Check Mapbox token is correct
- Check browser console for errors
- Verify token has GL JS permissions

### Places missing
- Check CSV for those entries
- Look for Google Maps link format issues
- Check browser console for geocoding errors

### Slow loading
- Normal for 170+ places
- Consider lazy loading if > 500 places
- Use Mapbox clustering for large datasets

## Support

Need help? Check:
- `README.md` - Full documentation
- `QUICK_START.md` - Quick setup guide
- Browser console (F12) - Error messages
- Mapbox docs: https://docs.mapbox.com/

---

**Ready to Deploy?** ✓ Check all boxes above, then go for it!

**Backup Your Data:** Always keep a copy of your original CSV safe!
