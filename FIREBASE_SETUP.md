# Firebase Setup Instructions for L'absurde

This project uses Firebase Firestore (free tier) to store user letterings globally and enable sharing across users.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "absurde-lettering")
4. Disable Google Analytics (optional, keeps it simpler)
5. Click "Create project"

## 2. Set up Firestore Database

1. In your Firebase project, go to **Firestore Database** in the left menu
2. Click "Create database"
3. Choose "Start in **production mode**" (we'll set rules next)
4. Select a Cloud Firestore location (choose closest to your users)
5. Click "Enable"

## 3. Configure Firestore Security Rules

1. In Firestore Database, go to the **Rules** tab
2. Replace the rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read global glyphs
    match /globalGlyphs/{glyphId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if false;
    }

    // Allow users to read/write their own glyph mappings
    match /userGlyphs/{userId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

3. Click "Publish"

**Important**: These rules allow:
- Anyone to READ all glyphs (needed for random selection)
- Anyone to CREATE new glyphs (when users draw)
- Anyone to READ/WRITE their own user mappings
- Prevents UPDATE/DELETE of global glyphs (preserves all history)

## 4. Get Your Firebase Configuration

1. In Firebase Console, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register your app with a nickname (e.g., "absurde-web")
6. Copy the `firebaseConfig` object

## 5. Add Configuration to Your Project

1. Open `firebase-config.js` in your project
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "AIza...", // Your API key
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123:web:abc..."
};
```

3. Save the file

## 6. Test the Application

1. Start your dev server: `npm run dev`
2. Open the Lettering mode
3. Draw a character and click "Save & Next"
4. Check the browser console - you should see:
   ```
   Saved glyph for "a" with ID: xyz123
   Updated user mapping for "a" → xyz123
   ```

5. Open Firestore Database in Firebase Console
6. You should see:
   - `globalGlyphs` collection with your saved glyphs
   - `userGlyphs` collection with your user mapping

## 7. Verify Cross-User Sharing

To test the global pool:

1. Open the app in an incognito window (simulates a new user)
2. Go directly to Interaction mode without drawing anything
3. You should see the letterings from your original session!

## Data Model

### Collection: `globalGlyphs`

Stores all user-created glyphs globally.

```
Document ID: auto-generated
{
  char: "a",
  imageData: "data:image/png;base64,...",
  createdAt: Timestamp,
  sourceUserId: "user_1234_abc"
}
```

### Collection: `userGlyphs`

Maps each user to their preferred glyphs.

```
Document ID: userId (e.g., "user_1234_abc")
{
  charMap: {
    "a": "globalGlyphId_xyz",
    "b": "globalGlyphId_abc",
    ...
  }
}
```

## Free Tier Limits

Firebase Firestore free tier includes:
- **50,000** document reads/day
- **20,000** document writes/day
- **20,000** document deletes/day
- **1 GiB** stored data

This should be plenty for hundreds of users drawing letterings!

## Troubleshooting

### "Firebase is not configured" warning
- Check that you've replaced the placeholder values in `firebase-config.js`
- Make sure your Firebase project is created

### "Permission denied" errors
- Verify your Firestore security rules are set correctly
- Check the Rules tab in Firebase Console

### Images not loading
- Check browser console for errors
- Verify the `imageData` field contains valid base64 PNG data
- Try drawing a simple letter first

### Multiple users see the same letterings
- This is expected! The global pool is shared
- Each user's own letterings take priority when they exist
- Random selection from global pool happens for missing characters

## Cost Considerations

The app is designed to stay within the free tier:

1. **Efficient queries**: Only fetches needed characters
2. **Small images**: Canvas drawings are optimized size
3. **No redundant writes**: Each user updates their mapping once per character
4. **Read caching**: Browser caches loaded images

Monitor your usage in Firebase Console → Usage tab.
