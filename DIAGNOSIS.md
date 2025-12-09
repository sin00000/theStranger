# Diagnosis: Why Global Glyphs Aren't Loading

## Root Cause Identified

**Firebase is not configured**, which causes the global pool query to fail.

## Evidence

### 1. Firebase Config Check
File: `firebase-config.js:24-26`

```javascript
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.warn('Firebase not configured - using placeholder config. App will work in local-only mode.');
    // Don't initialize Firebase with placeholder values
}
```

**Result:** `db` is `null`

### 2. Global Glyph Query Check
File: `firebase-storage.js:152-156`

```javascript
export async function getRandomGlobalGlyph(char) {
    // If Firebase not available, return null
    if (!db) {
        return null;  // ← Always returns null when Firebase not configured
    }
    // ... query code never runs
}
```

**Result:** Function returns `null` immediately, query never executes

### 3. Consequence

When User B loads the Interaction page:

```
Step 1: Load user's own letterings
  → Empty (User B has no letterings)

Step 2: Query global pool for missing characters
  → For each character:
      → getRandomGlobalGlyph(char) called
      → Returns null (because db is null)
      → letteringImages[char] remains undefined
  → Result: 0 global glyphs loaded

Step 3: Render
  → letteringImages[char] is undefined
  → Falls back to Georgia serif font ✗
```

## Why localStorage Doesn't Work for Cross-User Sharing

- **User A's localStorage**: Saved in Browser A, specific to that browser
- **User B's localStorage**: Separate storage in Browser B (incognito or different browser)
- **No communication between them**: localStorage is browser-specific, not global

This is why we need Firestore:
- User A saves → Firestore cloud database
- User B loads → Queries Firestore, finds User A's glyphs
- Works across all browsers and devices

## How to Fix

### Option 1: Configure Real Firebase (Recommended)

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Create a project (or use existing one)

2. **Get Web App Credentials**
   - Click "Add app" → Web icon
   - Copy the config object

3. **Update firebase-config.js**
   ```javascript
   const firebaseConfig = {
       apiKey: "AIzaSy...",  // Your actual values
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project-id.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abc123"
   };
   ```

4. **Set Firestore Rules**
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read access to globalGlyphs for everyone
       match /globalGlyphs/{document=**} {
         allow read: if true;
         allow write: if true;  // Or add auth if needed
       }

       // Allow read/write to own userGlyphs
       match /userGlyphs/{userId} {
         allow read, write: if true;  // Or add auth if needed
       }
     }
   }
   ```

### Option 2: Mock Firebase for Local Testing (Temporary)

If you can't set up Firebase right now, you could create a mock implementation, but this won't persist across browsers.

## Expected Console Output After Fix

Once Firebase is configured, you should see:

```
Firebase initialized successfully

=== LOADING LETTERINGS FROM FIREBASE ===
Required characters: ["A", "u", "j", ...]
User ID: user_1733789234567_xyz

=== loadAllLetteringsForInteraction START ===

STEP 1: Loading user's own letterings...
User charMap: {}
Total user letterings: 0

STEP 2: Checking global pool for 22 missing characters
  Querying global pool for "A"...
  ✓ Found global glyph for "A" (data:image/png;base64,...)  ← SUCCESS!
  Querying global pool for "u"...
  ✗ No global glyph for "u" - will use serif fallback

=== LETTERING LOAD SUMMARY ===
  User glyphs: 0
  Global glyphs: 1  ← Non-zero!
  Serif fallback: 21
```

## Current Console Output (Before Fix)

With placeholder Firebase config:

```
Firebase not configured - using placeholder config. App will work in local-only mode.

=== LOADING LETTERINGS FROM FIREBASE ===

STEP 2: Checking global pool for 22 missing characters
  Querying global pool for "A"...
  ✗ No global glyph for "A" - will use serif fallback  ← Always fails

=== LETTERING LOAD SUMMARY ===
  User glyphs: 0
  Global glyphs: 0  ← Always zero!
  Serif fallback: 22
```

## Quick Test

Open browser console and run:

```javascript
import { db } from './firebase-config.js';
console.log('db is:', db);  // Should be Firestore instance, not null
```

If it logs `null`, Firebase is not configured.

## Summary

✅ **Code logic is correct** - the priority system works as designed
❌ **Firebase is not configured** - `db` is `null`, causing queries to fail
🔧 **Fix:** Add real Firebase credentials to `firebase-config.js`

---

**Once Firebase is configured, the cross-user glyph sharing will work automatically.**
