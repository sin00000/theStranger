# Quick Start: Enable Cross-User Glyph Sharing

## 🚀 3-Step Setup (5 minutes)

### Step 1: Get Firebase Credentials

1. Open: https://console.firebase.google.com
2. Click **"Create a project"** (or select existing)
3. Name it (e.g., "stranger-glyphs")
4. Click **Continue** → **Continue** → **Create project**
5. Click the **web icon** `</>` to add a web app
6. Name it (e.g., "Stranger Web")
7. **Copy the `firebaseConfig` object** (you'll need this)

### Step 2: Run Setup Script

```bash
cd /Users/kimseojin/Desktop/stranger
node setup-firebase.js
```

The script will ask you to paste your Firebase config values. Just follow the prompts!

### Step 3: Enable Firestore & Set Rules

1. In Firebase Console, go to **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"**
4. Select a location (closest to you)
5. Click **"Enable"**
6. Go to **"Rules"** tab
7. Copy the contents of `firestore.rules` (in this folder)
8. Paste into the rules editor
9. Click **"Publish"**

## ✅ Verify It Works

Start your dev server:
```bash
npm run dev
```

Open the browser console. You should see:
```
✅ Firebase initialized successfully
Cross-user glyph sharing is enabled.
```

If you see `⚠️  FIREBASE NOT CONFIGURED`, something went wrong.

## 🧪 Test Cross-User Sharing

### Browser A (User A):
1. Go to Lettering mode
2. Draw a character (e.g., "A")
3. Click "Save & Next"

### Browser B (User B - Incognito):
1. Skip Lettering mode
2. Go directly to Interaction
3. You should see User A's drawing for "A"!

Console should show:
```
STEP 2: Checking global pool for X missing characters
  ✓ Found global glyph for "A"
Global glyphs: 1
```

## 🆘 Troubleshooting

### Still seeing "Firebase not configured"?
- Check that you ran `node setup-firebase.js`
- Verify `firebase-config.js` has real values (not "YOUR_API_KEY")

### "Permission denied" errors?
- Go to Firestore → Rules tab
- Make sure rules match `firestore.rules`
- Click "Publish"

### Global glyphs count is 0?
- Make sure User A actually saved a glyph
- Check Firestore console - you should see documents in `globalGlyphs` collection

## 📚 More Info

- **Detailed setup**: See `FIREBASE_SETUP.md`
- **Troubleshooting**: See `DIAGNOSIS.md`
- **Testing guide**: See `TESTING_GUIDE.md`

---

**That's it! You should now have working cross-user glyph sharing.**
