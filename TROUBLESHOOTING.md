# Troubleshooting: User B Cannot See User A's Glyphs

## Problem Statement

**Scenario:** User A saves glyphs → User B (new user, no letterings) goes to Interaction → Characters still appear in serif font instead of User A's hand-drawn glyphs.

## Root Cause Analysis

### The Issue

The most common reason for this is: **Firebase is not configured**.

### How to Verify

Run the diagnostic script:

```bash
cd /Users/kimseojin/Desktop/stranger
node diagnose-firebase.js
```

This will show you exactly what's wrong.

## Common Causes & Solutions

### 1. Firebase Not Configured (Most Common)

**Symptoms:**
- Console shows: `⚠️  FIREBASE NOT CONFIGURED`
- Console shows: `Cannot query global glyphs: Firebase not configured`
- `Global glyphs: 0` in the summary

**Why This Happens:**
- `firebase-config.js` still has placeholder values (`YOUR_API_KEY`)
- Without Firebase, glyphs are saved to localStorage
- localStorage is browser-specific (User A's browser ≠ User B's browser)
- No cross-user sharing possible

**Solution:**
```bash
# Option 1: Interactive setup
node setup-firebase.js

# Option 2: Manual setup
# See QUICK_START.md for step-by-step instructions
```

**Verification:**
After setup, console should show:
```
✅ Firebase initialized successfully
Cross-user glyph sharing is enabled.
```

---

### 2. Firestore Not Enabled

**Symptoms:**
- Firebase initialized but queries fail
- Error: `Firestore has not been enabled`

**Solution:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Build → Firestore Database**
4. Click **"Create database"**
5. Choose **"Start in test mode"**
6. Select location
7. Click **"Enable"**

---

### 3. Firestore Security Rules Block Reads

**Symptoms:**
- Error: `permission-denied`
- Console shows: `Error getting random glyph`

**Check Current Rules:**
1. Firebase Console → Firestore Database → Rules tab
2. Should see something like this:

**Wrong (blocks reads):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;  // ← This blocks everything!
    }
  }
}
```

**Correct (allows reads):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /globalGlyphs/{glyphId} {
      allow read: if true;  // ← Anyone can read
      allow create: if true;
      allow update, delete: if false;
    }

    match /userGlyphs/{userId} {
      allow read, write: if true;
    }
  }
}
```

**Solution:**
1. Copy the **correct** rules from `firestore.rules` file
2. Paste into Firebase Console → Rules tab
3. Click **"Publish"**

---

### 4. User A Never Actually Saved Glyphs

**Symptoms:**
- Firebase is configured
- No permission errors
- Still no glyphs appearing

**Verification:**
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Check `globalGlyphs` collection
4. Should see documents with `char`, `imageData`, etc.

**If Collection is Empty:**
- User A needs to actually draw and save characters
- Go to Lettering mode as User A
- Draw a character
- Click "Save & Next"
- Check console for: `Saved glyph for "X" with ID: abc123`

**If Collection Has Documents:**
- Check that `char` field matches what you're testing
- Example: Looking for "A" but documents only have "a"
- Remember: case-sensitive!

---

### 5. Wrong Firebase Project

**Symptoms:**
- User A saves to Project X
- User B loads from Project Y
- No glyphs appear

**Verification:**
Check `projectId` in both users' `firebase-config.js`:

```javascript
const firebaseConfig = {
    projectId: "your-project-id",  // ← Must be SAME for both users
    ...
};
```

**Solution:**
- Both users must use the same Firebase project
- Verify projectId matches
- Redeploy if needed

---

### 6. Network/Connectivity Issues

**Symptoms:**
- Error: `Firestore unavailable`
- Error: `Failed to fetch`

**Check:**
```javascript
// In browser console
console.log('Online:', navigator.onLine);
```

**Solution:**
- Check internet connection
- Check firewall settings
- Try different network
- Check if Firebase services are down: https://status.firebase.google.com

---

## Step-by-Step Debugging

### Step 1: Check Console on Page Load

Open browser DevTools (F12) → Console tab

**Look for:**

✅ **Success Indicators:**
```
✅ Firebase initialized successfully
Cross-user glyph sharing is enabled.

=== LOADING LETTERINGS FROM FIREBASE ===
Required characters: ["A", "u", "j", ...]

STEP 2: Checking global pool for X missing characters
  Querying global pool for "A"...
  ✓ Found global glyph for "A"

=== LETTERING LOAD SUMMARY ===
  User glyphs: 0
  Global glyphs: 1  ← Should be > 0 if User A saved glyphs
```

❌ **Failure Indicators:**
```
⚠️  FIREBASE NOT CONFIGURED
Cannot query global glyphs: Firebase not configured
Global glyphs: 0  ← This means no global glyphs loaded
```

### Step 2: Check Firestore Console

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Check these collections:

**globalGlyphs:**
- Should have documents
- Each document should have:
  - `char`: "A" (or whatever character)
  - `imageData`: "data:image/png;base64,..."
  - `createdAt`: Timestamp
  - `sourceUserId`: "user_xxx"

**userGlyphs:**
- Should have documents with userId as document ID
- Each should have:
  - `charMap`: Object mapping characters to glyph IDs

### Step 3: Test the Flow Manually

**Browser A (User A):**
```
1. Open DevTools → Console
2. Note User ID from console logs
3. Go to Lettering mode
4. Draw character "A"
5. Click "Save & Next"
6. Verify console shows:
   "Saved glyph for 'A' with ID: xyz123"
7. Check Firestore Console → globalGlyphs
8. Should see new document with char: "A"
```

**Browser B (User B - Incognito):**
```
1. Open DevTools → Console
2. Note User ID (should be different from User A)
3. Go directly to Interaction (skip Lettering)
4. Check console for:
   "Querying global pool for 'A'..."
   "✓ Found global glyph for 'A'"
5. Look at floating letters
6. Character "A" should appear as User A's drawing
```

### Step 4: Run Diagnostic Script

```bash
cd /Users/kimseojin/Desktop/stranger
node diagnose-firebase.js
```

This will tell you exactly what's wrong.

---

## Quick Reference

| Symptom | Cause | Solution |
|---------|-------|----------|
| `⚠️ FIREBASE NOT CONFIGURED` | No Firebase credentials | Run `node setup-firebase.js` |
| `permission-denied` | Wrong Firestore rules | Update rules from `firestore.rules` |
| `Firestore not enabled` | Database not created | Create Firestore in console |
| `Global glyphs: 0` | No glyphs saved OR Firebase not configured | Save glyphs OR configure Firebase |
| Characters still serif | Any of the above | Check console logs for specific error |

---

## Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Check all files are saved:**
   - firebase-config.js has real credentials
   - No uncommitted changes

2. **Clear browser cache:**
   - Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
   - Clear localStorage: `localStorage.clear()`

3. **Verify Firebase project setup:**
   - Project exists
   - Firestore enabled
   - Rules published
   - No billing issues

4. **Check browser console:**
   - Any red errors?
   - What do the logs say?
   - Copy error messages

5. **Run diagnostic:**
   ```bash
   node diagnose-firebase.js
   ```

6. **Check the documentation:**
   - QUICK_START.md
   - FIREBASE_SETUP.md
   - CODE_REVIEW_SUMMARY.md

---

## Success Checklist

Use this to verify everything is working:

- [ ] Firebase configured (`✅ Firebase initialized successfully`)
- [ ] Firestore database created
- [ ] Security rules set correctly
- [ ] User A can save glyphs
- [ ] Glyphs appear in Firestore Console
- [ ] User B can load from global pool
- [ ] Console shows `Global glyphs: 1` or more
- [ ] Character appears as hand-drawn (not serif)

If all boxes are checked, cross-user glyph sharing is working! ✅

---

**Need more help? Check the other documentation files in this directory.**
