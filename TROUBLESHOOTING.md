# Troubleshooting Guide

## Google Maps API Issues

### Error: "Google Maps API key not configured"

**Solution:**
1. Check if `server/.env` file exists
2. Add the following line to `server/.env`:
   ```
   GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```
3. Restart your server after adding the key
4. Make sure there are no spaces around the `=` sign
5. Don't use quotes around the API key value

### Error: "REQUEST_DENIED" or "API key not valid"

**Possible Causes:**
1. API key is incorrect
2. Places API is not enabled in Google Cloud Console
3. API key has restrictions that block the request

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Library"
3. Search for "Places API" and make sure it's **enabled**
4. Go to "APIs & Services" > "Credentials"
5. Check your API key and its restrictions
6. If you have restrictions, temporarily remove them to test, or add your server's IP/domain

### Error: "INVALID_REQUEST"

**Solution:**
- Make sure you've entered a destination name in the search box
- Try a more specific location (e.g., "Paris, France" instead of just "Paris")
- Check that the destination name is spelled correctly

### No Places Found

**Solution:**
- Try a different destination name
- Try a more popular city or location
- Check if the place type filter is too restrictive
- Make sure your API key has the Places API enabled

### App Falls Back to Custom Places

**This is normal behavior!** If Google Maps API is not configured or encounters an error, the app will automatically:
- Show a helpful error message
- Disable the "Use Google Maps Recommendations" option
- Fall back to showing custom places from your database

You can still use the app without Google Maps API - you just won't see Google Maps recommendations.

## Quick Fix Checklist

- [ ] Created `server/.env` file
- [ ] Added `GOOGLE_MAPS_API_KEY` to `.env` file
- [ ] Restarted the server after adding the key
- [ ] Enabled "Places API" in Google Cloud Console
- [ ] API key has no restrictions (or restrictions allow your server)
- [ ] Entered a valid destination name in the search box
- [ ] Selected a place type (Lodge, Restaurant, Tourist Spot)

## Testing Without Google Maps API

The app works perfectly fine without Google Maps API! You can:
- Add custom places manually
- Use the "Add Place" button to create your own places
- View places added by other users
- Use location-based search with your GPS (if places are in database)

## Getting Help

If you're still having issues:
1. Check the server console for detailed error messages
2. Check the browser console (F12) for frontend errors
3. Verify your API key works by testing it directly:
   ```
   https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+Paris&key=YOUR_API_KEY
   ```
4. Make sure you're using the correct API (Places API, not Maps JavaScript API)

