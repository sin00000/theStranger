# Testing Guide: Cross-User Glyph Sharing

## Scenario to Test

**User A** draws lettering for a character → **User B** (new user, no drawings) should see User A's drawing in Interaction mode.

## Step-by-Step Test Procedure

### Browser A (User A)
1. Open the application in Browser A (e.g., Chrome)
2. Go to Lettering mode
3. Draw a glyph for a specific character (e.g., "A")
4. Save it
5. **Verify in Console**: Check that the glyph was saved to globalGlyphs collection
6. Note the character you drew

### Browser B (User B - New User)
1. Open the application in Incognito/Private mode (or different browser)
2. **Do NOT go to Lettering mode** - skip directly to Interaction
3. Go to Interaction mode
4. Look at the floating letters

### Expected Behavior
- The character "A" should appear as User A's hand-drawn glyph
- **NOT** as the default Georgia serif font

### Console Logs to Check

Open DevTools Console in Browser B. You should see:

```
=== LOADING LETTERINGS FROM FIREBASE ===
Required characters: [...]
User ID: user_xxxxx (will be different from User A)

=== loadAllLetteringsForInteraction START ===
Required chars: [...]

STEP 1: Loading user's own letterings...
User charMap: {} (empty for new user)
User letterings loaded: [] (empty for new user)
Total user letterings: 0

STEP 2: Checking global pool for X missing characters
Missing chars: ["A", "u", "j", "o", ...] (all required characters)
  Querying global pool for "A"...
  ✓ Found global glyph for "A" (data:image/png;base64,iVBORw0...)
  Querying global pool for "u"...
  ✗ No global glyph for "u" - will use serif fallback
  ...

=== LETTERING LOAD SUMMARY ===
  User glyphs: 0
  Global glyphs: 1 (or more if you drew multiple)
  Serif fallback: X (remaining characters)
  Total characters: Y
  Characters with glyphs: ["A"] (should include the character you drew)

=== LOADING COMPLETE ===
Total letterings loaded: 1
Characters with glyphs: ["A"]
```

## What to Look For

### ✅ SUCCESS INDICATORS
1. Console shows `✓ Found global glyph for "A"`
2. Console shows `Global glyphs: 1` or more
3. The character "A" appears as a hand-drawn glyph (not serif font)
4. Browser B user ID is different from Browser A user ID

### ❌ FAILURE INDICATORS
1. Console shows `✗ No global glyph for "A"` (when User A definitely saved it)
2. Console shows `Global glyphs: 0`
3. The character "A" appears in default Georgia serif font
4. Any Firebase errors in the console

## Debugging

If the test fails:

### Check Firebase Console
1. Go to Firestore in Firebase Console
2. Check `globalGlyphs` collection
3. Verify there's a document with:
   - `char: "A"`
   - `imageData: "data:image/png;base64,..."`
   - `createdAt: <timestamp>`
   - `sourceUserId: <User A's ID>`

### Check the Query
Look for this in the console logs:
```
Querying global pool for "A"...
```

If you see:
- `✓ Found global glyph` → The query worked, check image loading
- `✗ No global glyph` → The query returned empty, check Firebase collection

### Common Issues

1. **Firebase not configured**: Check `firebase-config.js` is properly set up
2. **Firestore rules**: Ensure read permissions allow cross-user access
3. **Network issues**: Check browser network tab for failed requests
4. **Image loading errors**: Check for `✗ Failed to load image` in console

## Expected Console Output (Successful Cross-User Load)

```
=== LOADING LETTERINGS FROM FIREBASE ===
Required characters: ["A", "u", "j", "o", "u", "r", "d", "'", "h", "i", ",", " ", "m", "a", "n", "e", "s", "t", "O", "p", "ê", "-", "."]
User ID: user_1733789234567_abc123xyz

=== loadAllLetteringsForInteraction START ===
Required chars: [same as above]

STEP 1: Loading user's own letterings...
Loaded 0 user letterings
User charMap: {}
User letterings loaded: []
Total user letterings: 0

STEP 2: Checking global pool for 22 missing characters
Missing chars: ["A", "u", "j", "o", "r", "d", "h", "i", "m", "a", "n", "e", "s", "t", "O", "p", "ê"]
  Querying global pool for "A"...
  ✓ Found global glyph for "A" (data:image/png;base64,iVBORw0KGgoAAAANS...)
  Querying global pool for "u"...
  ✗ No global glyph for "u" - will use serif fallback
  [... continues for all characters ...]

=== LETTERING LOAD SUMMARY ===
  User glyphs: 0
  Global glyphs: 1
  Serif fallback: 21
  Total characters: 22
  Characters with glyphs: ["A"]
=== loadAllLetteringsForInteraction END ===

Raw lettering data received: ["A"]
✓ Successfully loaded image for "A" from global

=== LOADING COMPLETE ===
Total letterings loaded: 1
Characters with glyphs: ["A"]
```

## Test Result

- [ ] User B sees User A's hand-drawn glyph for character "A"
- [ ] Console shows correct global glyph count
- [ ] No Firebase errors
- [ ] Character appears correctly (not serif font)

---

**If all checkboxes are ✅, the implementation is working correctly!**
