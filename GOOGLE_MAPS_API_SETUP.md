# Google Maps API Setup Guide

This document lists all the Google Maps APIs that need to be enabled in Google Cloud Console for the Campus Ride-Sharing app to work properly.

## Required APIs

Enable the following APIs in your Google Cloud Console:

### 1. **Places API (New)** ⭐ REQUIRED
- **Purpose**: Autocomplete for location inputs (pickup/destination)
- **Endpoint**: `places.googleapis.com/v1/places:autocomplete`
- **Used in**: 
  - `/api/places` route
  - Passenger booking form
  - Driver location input

**How to enable:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Library**
3. Search for "Places API (New)"
4. Click **Enable**

### 2. **Places API** ⭐ REQUIRED (Fallback)
- **Purpose**: Place details fallback (getting lat/lng from place ID)
- **Endpoint**: `maps.googleapis.com/maps/api/place/details/json`
- **Used in**: 
  - `/api/places/details` route (fallback)
  - Getting coordinates when user selects a place

**How to enable:**
1. In Google Cloud Console
2. Search for "Places API" (the standard/legacy version)
3. Click **Enable**

**Note**: This is used as a fallback if the new Places API fails.

### 3. **Geocoding API** ⭐ REQUIRED
- **Purpose**: Reverse geocoding (convert lat/lng to address)
- **Endpoint**: `maps.googleapis.com/maps/api/geocode/json`
- **Used in**: 
  - "Use my location" button
  - Converting GPS coordinates to readable addresses

**How to enable:**
1. In Google Cloud Console
2. Search for "Geocoding API"
3. Click **Enable**

### 4. **Routes API (New)** ⭐ REQUIRED
- **Purpose**: Calculate route distance and duration
- **Endpoint**: `routes.googleapis.com/directions/v2:computeRoutes`
- **Used in**: 
  - `/api/route-distance` route
  - `/api/compare` route (fare calculation)
  - Distance calculations for filtering nearby rides

**How to enable:**
1. In Google Cloud Console
2. Search for "Routes API"
3. Click **Enable**

**Note**: This is the new Routes API. If unavailable, you may need to enable "Directions API" as an alternative.

---

## Quick Setup Steps

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project (or create a new one)

2. **Enable APIs**
   - Navigate to **APIs & Services** > **Library**
   - Enable each API listed above

3. **Create API Key**
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **API Key**
   - Copy your API key

4. **Configure API Key Restrictions** (Recommended)
   - Click on your API key to edit
   - Under **API restrictions**, select **Restrict key**
   - Choose the APIs listed above
   - Under **Application restrictions**, you can restrict by:
     - HTTP referrers (for web apps)
     - IP addresses (for server-side)
     - Android/iOS apps (for mobile)

5. **Set Environment Variable**
   - Add to your `.env.local` file:
     ```
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
     ```
   - Or for server-side only:
     ```
     GOOGLE_MAPS_API_KEY=your_api_key_here
     ```

---

## API Usage Summary

| API | Purpose | Used For |
|-----|---------|----------|
| Places API (New) | Autocomplete | Location search suggestions |
| Places API | Place Details | Get coordinates from place ID |
| Geocoding API | Reverse Geocoding | Convert GPS to address |
| Routes API (New) | Route Calculation | Distance & duration |

---

## Troubleshooting

### Error: "API key is invalid"
- ✅ Verify API key is correct
- ✅ Check that all required APIs are enabled
- ✅ Ensure API key restrictions allow the APIs

### Error: "REQUEST_DENIED"
- ✅ Check API key restrictions
- ✅ Verify the specific API is enabled
- ✅ Check billing is enabled for your project

### Error: "OVER_QUERY_LIMIT"
- ✅ Check your API quota limits
- ✅ Verify billing is set up correctly
- ✅ Consider upgrading your plan

### Error: "Places API failed"
- ✅ Enable both Places API (New) and Places API
- ✅ Check API key has access to both
- ✅ Verify billing is enabled

---

## Cost Considerations

All these APIs have free tier limits:
- **Places API**: $200 free credit per month
- **Geocoding API**: $200 free credit per month  
- **Routes API**: $200 free credit per month

After free tier, pay-as-you-go pricing applies. Monitor usage in Google Cloud Console.

---

## Security Best Practices

1. **Restrict API Key**: Always restrict your API key to specific APIs
2. **Use HTTP Referrers**: Restrict web API keys to your domain
3. **Server-Side Key**: Use `GOOGLE_MAPS_API_KEY` (not `NEXT_PUBLIC_`) for server-side calls when possible
4. **Monitor Usage**: Set up billing alerts in Google Cloud Console
5. **Rotate Keys**: Regularly rotate API keys for security

---

## Testing Your Setup

After enabling APIs and setting your key, test:

1. ✅ Autocomplete works (type in pickup/destination fields)
2. ✅ Place selection works (click a suggestion)
3. ✅ "Use my location" works (converts GPS to address)
4. ✅ Distance calculation works (fare estimation)

If all work, your setup is correct! 🎉

## Accepted ride maps

Apply `supabase/migrations/20260219000008_accepted_ride_driver_location.sql` after the earlier ride migrations. It stores the driver's latest location on the accepted ride and clears it when the driver confirms completion or the ride ends.

- Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to a browser key with **Maps JavaScript API** enabled. Restrict it to your site origins. Set `NEXT_PUBLIC_GOOGLE_MAP_ID` to your Google map ID for production markers; the preview uses Google's demo map ID if none is set.
- Set `GOOGLE_MAPS_API_KEY` to a server key with **Routes API** enabled. The app uses one directions request with pickup as the intermediate stop, and shows the two road legs separately.
- The driver shares their selected location when accepting. **Share live location** starts browser GPS updates for that accepted ride. Leaving the ride desk or stopping sharing ends the watch. The passenger sees the last shared position while the driver is still active.
- If in-app maps are unavailable, use **Open in Google Maps** for the full road route.

### Troubleshooting on Vercel

1. For a blank map, check your browser console for the [Google Maps error code](https://developers.google.com/maps/documentation/javascript/error-messages). If you see `RefererNotAllowedMapError`, add your site to the browser key's **Websites** list in Google Cloud. Use `https://rift-noida-fullstack.vercel.app/*` for production or the specific preview hostname you are testing. Confirm that **Maps JavaScript API** is enabled and billing is active on the key's Google Cloud project.
2. If road directions are missing, add `GOOGLE_MAPS_API_KEY` to your Vercel project's environment variables for the deployment you are testing. Use a separate server key and allow **Routes API**. Keep **Places API (New)** and the **Places API** fallback allowed on the server key if you use address search. Website referrer restrictions apply to the browser key. The server key can use an IP restriction if your deployment has a fixed outbound IP.
3. Redeploy after saving Vercel environment changes. Open an accepted ride, share the driver location, and check that both route legs show a distance and ETA.
