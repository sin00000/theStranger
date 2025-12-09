#!/usr/bin/env node

/**
 * Firebase Diagnostics Script
 *
 * Run this to diagnose Firebase configuration and connectivity issues
 */

import { db } from './firebase-config.js';
import { getUserId, saveLettering, getRandomGlobalGlyph } from './firebase-storage.js';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║              Firebase Diagnostics Tool                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Test 1: Check if Firebase is initialized
console.log('📋 Test 1: Firebase Initialization');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (db === null || db === undefined) {
    console.log('❌ FAILED: Firebase is NOT initialized');
    console.log('   Reason: db is null');
    console.log('   Fix: Add your Firebase credentials to firebase-config.js');
    console.log('   See: QUICK_START.md or run: node setup-firebase.js\n');

    console.log('⚠️  DIAGNOSIS: This is why global glyphs are not loading!');
    console.log('   Without Firebase, the app runs in local-only mode.');
    console.log('   User B cannot see User A\'s glyphs because they are');
    console.log('   stored in separate browser localStorage instances.\n');

    process.exit(1);
} else {
    console.log('✅ PASSED: Firebase is initialized');
    console.log('   db:', typeof db);
    console.log('');
}

// Test 2: Check user ID generation
console.log('📋 Test 2: User ID Generation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
try {
    const userId = getUserId();
    if (userId && userId.startsWith('user_')) {
        console.log('✅ PASSED: User ID generated');
        console.log('   User ID:', userId);
        console.log('');
    } else {
        console.log('❌ FAILED: Invalid user ID format');
        console.log('   User ID:', userId);
        console.log('');
    }
} catch (error) {
    console.log('❌ FAILED: Error generating user ID');
    console.log('   Error:', error.message);
    console.log('');
}

// Test 3: Check Firestore connectivity (will fail if not configured properly)
console.log('📋 Test 3: Firestore Connectivity');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚠️  Note: This test requires actual Firebase credentials');
console.log('   If you see "permission-denied" or "not-found" errors below,');
console.log('   it means Firebase is configured but rules need adjustment.\n');

try {
    // Try to query for a test character
    console.log('   Attempting to query globalGlyphs for character "A"...');
    const result = await getRandomGlobalGlyph('A');

    if (result === null) {
        console.log('ℹ️  RESULT: No glyphs found for "A"');
        console.log('   This means:');
        console.log('   - Firebase IS connected ✅');
        console.log('   - No one has saved a glyph for "A" yet');
        console.log('   - Or Firestore rules are blocking reads\n');
    } else {
        console.log('✅ SUCCESS: Found glyph for "A"!');
        console.log('   Data length:', result.length, 'characters');
        console.log('   Cross-user glyph sharing is working! ✅\n');
    }
} catch (error) {
    console.log('❌ FAILED: Firestore query error');
    console.log('   Error:', error.message);
    console.log('   Code:', error.code);
    console.log('');

    if (error.code === 'permission-denied') {
        console.log('   💡 Fix: Update Firestore security rules');
        console.log('      Copy rules from: firestore.rules');
        console.log('      Paste in: Firebase Console → Firestore → Rules\n');
    } else if (error.code === 'unavailable') {
        console.log('   💡 Fix: Check your internet connection\n');
    }
}

// Summary
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                      Summary                               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (db === null) {
    console.log('🔴 DIAGNOSIS: Firebase is NOT configured');
    console.log('');
    console.log('WHY User B doesn\'t see User A\'s glyphs:');
    console.log('  • Without Firebase, glyphs are saved to localStorage');
    console.log('  • localStorage is browser-specific (not shared)');
    console.log('  • User B has different localStorage than User A');
    console.log('  • Result: No cross-user glyph sharing\n');
    console.log('SOLUTION:');
    console.log('  1. Run: node setup-firebase.js');
    console.log('  2. Or manually add credentials to firebase-config.js');
    console.log('  3. Enable Firestore in Firebase Console');
    console.log('  4. Set security rules from firestore.rules\n');
} else {
    console.log('🟢 Firebase appears to be configured correctly!');
    console.log('');
    console.log('If User B still doesn\'t see User A\'s glyphs, check:');
    console.log('  1. Did User A actually save glyphs?');
    console.log('     → Check Firebase Console → Firestore → globalGlyphs');
    console.log('  2. Are Firestore rules set correctly?');
    console.log('     → Rules should allow read: if true');
    console.log('  3. Is User B using the same Firebase project?');
    console.log('     → Check projectId in firebase-config.js\n');
}

console.log('For detailed setup instructions, see: QUICK_START.md\n');
