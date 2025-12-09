# Enable Firestore for Your Project

## ✅ Good News: Firebase is Configured!

Your Firebase credentials are now in `firebase-config.js` and the connection works.

## ⚠️ Next Step: Enable Firestore Database

You need to enable the Firestore database for your project.

### Option 1: Direct Link (Easiest)

Click this link (it will open directly to enable Firestore for your project):

**https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=thestranger-3ff8a**

Then:
1. Click **"Enable"** button
2. Wait a few seconds for it to activate
3. Done!

### Option 2: Via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **thestranger-3ff8a**
3. Click **"Build"** in left sidebar
4. Click **"Firestore Database"**
5. Click **"Create database"** button
6. Choose **"Start in test mode"** (for development)
7. Select a location (choose closest to you):
   - `us-central1` (Iowa)
   - `us-east1` (South Carolina)
   - `europe-west1` (Belgium)
   - `asia-northeast1` (Tokyo)
8. Click **"Enable"**

### Set Security Rules

After Firestore is enabled:

1. In Firestore Database, go to **"Rules"** tab
2. Replace the rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global glyphs pool - anyone can read, anyone can create
    match /globalGlyphs/{glyphId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if false; // Glyphs are immutable
    }

    // User-specific glyph mappings
    match /userGlyphs/{userId} {
      allow read: if true;  // Anyone can read to get global glyphs
      allow write: if true; // Anyone can write their own mappings
    }
  }
}
```

3. Click **"Publish"**

## Verify It Works

Run the diagnostic again:

```bash
node diagnose-firebase.js
```

You should see:
```
✅ Firebase IS connected
```

Or start your dev server and check the browser console:

```bash
npm run dev
```

Look for:
```
✅ Firebase initialized successfully
Cross-user glyph sharing is enabled.
```

## Test Cross-User Sharing

### Browser A (User A):
1. Go to Lettering mode
2. Draw a character (e.g., "A")
3. Click "Save & Next"
4. Console should show: `Saved glyph for "A" with ID: abc123`

### Browser B (User B - Incognito):
1. Skip Lettering mode
2. Go directly to Interaction
3. Console should show:
   ```
   ✓ Found global glyph for "A"
   Global glyphs: 1
   ```
4. Character "A" appears as User A's drawing ✅

## Current Status

- ✅ Firebase configured
- ⏳ Waiting for Firestore to be enabled
- ⏳ Security rules need to be set

**Next:** Click the link above or follow the Firebase Console steps to enable Firestore!
