# Google Maps API Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name (e.g., "Travel Buddy")
5. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - **Places API** (for searching places)
   - **Maps JavaScript API** (optional, for displaying maps)
   - **Geocoding API** (optional, for address conversion)

## Step 3: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Recommended) Click "Restrict Key" to add restrictions:
   - Under "API restrictions", select "Restrict key"
   - Choose "Places API" and "Maps JavaScript API"
   - Under "Application restrictions", you can restrict by HTTP referrer or IP

## Step 4: Add API Key to Project

1. Open `server/.env` file (create it if it doesn't exist)
2. Add your API key:
   ```
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

## Step 5: Test the Integration

1. Start your server: `npm run server`
2. Go to the "Nearby Places" page in your app
3. Check "Use Google Maps Recommendations"
4. Enter a destination (e.g., "Paris", "New York")
5. Select a type (Lodge, Restaurant, Tourist Spot)
6. Click search or wait for automatic search

## Features Enabled

With Google Maps API, you can now:
- ✅ Search places by destination name
- ✅ Get real places from Google Maps
- ✅ See ratings and reviews
- ✅ View photos of places
- ✅ Check if places are open now
- ✅ Get contact information
- ✅ Open places in Google Maps
- ✅ Find places near your location

## Cost Information

- Google Maps Platform offers $200 free credit per month
- Places API (Text Search): $32 per 1,000 requests
- Places API (Nearby Search): $32 per 1,000 requests
- For most small projects, the free tier should be sufficient

## Troubleshooting

**Error: "Google Maps API key not configured"**
- Make sure you've added `GOOGLE_MAPS_API_KEY` to `server/.env`
- Restart your server after adding the key

**Error: "This API project is not authorized to use this API"**
- Make sure you've enabled "Places API" in Google Cloud Console
- Wait a few minutes after enabling for changes to propagate

**No results returned**
- Check if the destination name is correct
- Try a more specific location (e.g., "Paris, France" instead of just "Paris")
- Check your API key restrictions

