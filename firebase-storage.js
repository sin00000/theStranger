// Firebase Storage Service for Lettering Data
import { db } from './firebase-config.js';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    addDoc
} from 'firebase/firestore';

// Collection names
const GLOBAL_GLYPHS_COLLECTION = 'globalGlyphs';
const USER_GLYPHS_COLLECTION = 'userGlyphs';

/**
 * Generate or retrieve user ID from localStorage
 */
export function getUserId() {
    const USER_ID_KEY = 'absurde_user_id';
    let userId = localStorage.getItem(USER_ID_KEY);

    if (!userId) {
        // Generate UUID-like ID
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(USER_ID_KEY, userId);
    }

    return userId;
}

/**
 * Save a user's lettering to Firebase
 * @param {string} char - The character being lettered
 * @param {string} imageData - Base64 PNG data from canvas.toDataURL()
 * @returns {Promise<string>} - The created glyph ID
 */
export async function saveLettering(char, imageData) {
    // Validate inputs
    if (!char || typeof char !== 'string' || char.length === 0) {
        throw new Error('Invalid character: must be a non-empty string');
    }

    if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
        throw new Error('Invalid imageData: must be a data URL string');
    }

    const userId = getUserId();

    // Check if Firebase is available
    if (!db) {
        console.warn('Firebase not configured - saving to localStorage only');
        // Save to localStorage as fallback
        const localKey = `local_glyph_${userId}_${char}`;
        try {
            localStorage.setItem(localKey, imageData);
            console.log(`Saved "${char}" to localStorage with key: ${localKey}`);
            return localKey;
        } catch (storageError) {
            // localStorage might be full or disabled
            console.error('Failed to save to localStorage:', storageError);
            throw new Error('Failed to save: localStorage not available');
        }
    }

    try {
        // 1. Add to globalGlyphs collection
        const glyphRef = await addDoc(collection(db, GLOBAL_GLYPHS_COLLECTION), {
            char: char,
            imageData: imageData,
            createdAt: serverTimestamp(),
            sourceUserId: userId
        });

        const glyphId = glyphRef.id;
        console.log(`Saved glyph for "${char}" with ID: ${glyphId}`);

        // 2. Update userGlyphs mapping
        const userGlyphRef = doc(db, USER_GLYPHS_COLLECTION, userId);

        // Use set with merge to preserve existing mappings
        await setDoc(userGlyphRef, {
            [`charMap.${char}`]: glyphId
        }, { merge: true });

        console.log(`Updated user mapping for "${char}" → ${glyphId}`);

        return glyphId;
    } catch (error) {
        console.error('Error saving lettering to Firebase:', error);

        // Provide more specific error messages
        if (error.code === 'permission-denied') {
            throw new Error('Permission denied: Please check Firestore security rules');
        } else if (error.code === 'unavailable') {
            throw new Error('Firestore unavailable: Please check your internet connection');
        } else {
            throw error;
        }
    }
}

/**
 * Load all letterings for the current user (for interaction mode)
 * @returns {Promise<Object>} - Object mapping characters to image data URLs
 */
export async function loadLetteringsForInteraction() {
    const userId = getUserId();
    const letteringImages = {};

    // If Firebase not available, try localStorage fallback
    if (!db) {
        console.warn('Firebase not configured - checking localStorage for saved letterings');

        // Load from localStorage
        const charMap = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`local_glyph_${userId}_`)) {
                const char = key.replace(`local_glyph_${userId}_`, '');
                const imageData = localStorage.getItem(key);
                if (imageData) {
                    letteringImages[char] = {
                        imageData: imageData,
                        source: 'user'
                    };
                    charMap[char] = key; // Use localStorage key as "glyphId"
                }
            }
        }

        console.log(`Loaded ${Object.keys(letteringImages).length} letterings from localStorage`);
        return { letteringImages, charMap };
    }

    try {
        // 1. Get user's own mappings
        const userGlyphRef = doc(db, USER_GLYPHS_COLLECTION, userId);
        const userDoc = await getDoc(userGlyphRef);

        const charMap = userDoc.exists() ? (userDoc.data().charMap || {}) : {};

        // 2. For each character in charMap, fetch the glyph
        const userGlyphPromises = Object.entries(charMap).map(async ([char, glyphId]) => {
            try {
                const glyphDoc = await getDoc(doc(db, GLOBAL_GLYPHS_COLLECTION, glyphId));
                if (glyphDoc.exists()) {
                    letteringImages[char] = {
                        imageData: glyphDoc.data().imageData,
                        source: 'user'
                    };
                }
            } catch (error) {
                console.error(`Error loading user glyph for "${char}":`, error);
            }
        });

        await Promise.all(userGlyphPromises);

        console.log(`Loaded ${Object.keys(letteringImages).length} user letterings`);
        return { letteringImages, charMap };
    } catch (error) {
        console.error('Error loading user letterings:', error);
        return { letteringImages: {}, charMap: {} };
    }
}

/**
 * Get a random glyph from the global pool for a specific character
 * @param {string} char - The character to find
 * @returns {Promise<string|null>} - Base64 image data or null if none found
 */
export async function getRandomGlobalGlyph(char) {
    // If Firebase not available, return null
    if (!db) {
        console.warn(`Cannot query global glyphs: Firebase not configured. Character "${char}" will use serif fallback.`);
        return null;
    }

    try {
        const q = query(
            collection(db, GLOBAL_GLYPHS_COLLECTION),
            where('char', '==', char)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log(`No global glyphs found for "${char}"`);
            return null;
        }

        // Get all matching glyphs
        const glyphs = [];
        querySnapshot.forEach((doc) => {
            glyphs.push(doc.data().imageData);
        });

        // Randomly select one
        const randomIndex = Math.floor(Math.random() * glyphs.length);
        console.log(`Found ${glyphs.length} global glyphs for "${char}", selected index ${randomIndex}`);

        return glyphs[randomIndex];
    } catch (error) {
        console.error(`Error getting random glyph for "${char}":`, error);
        return null;
    }
}

/**
 * Load all letterings for interaction mode with fallback to global pool
 * @param {string[]} requiredChars - Array of characters needed for the sentence
 * @returns {Promise<Object>} - Object mapping characters to image data URLs
 *
 * Priority:
 * 1. User's own glyph (from userGlyphs.charMap[char])
 * 2. Random global glyph (from globalGlyphs where char matches)
 * 3. Undefined (will render as default serif in interaction.html)
 */
export async function loadAllLetteringsForInteraction(requiredChars) {
    console.log('\n=== loadAllLetteringsForInteraction START ===');
    console.log('Required chars:', requiredChars);

    // Validate input
    if (!Array.isArray(requiredChars)) {
        console.error('Invalid requiredChars: must be an array');
        return {};
    }

    // Filter out invalid characters
    const validChars = requiredChars.filter(char =>
        typeof char === 'string' && char.length > 0
    );

    if (validChars.length !== requiredChars.length) {
        console.warn(`Filtered out ${requiredChars.length - validChars.length} invalid characters`);
    }

    const letteringImages = {};

    // STEP 1: Load user's own letterings first (highest priority)
    console.log('\nSTEP 1: Loading user\'s own letterings...');
    const { letteringImages: userLetterings, charMap } = await loadLetteringsForInteraction();

    console.log('User charMap:', charMap);
    console.log('User letterings loaded:', Object.keys(userLetterings));

    // Add user letterings to the result
    for (const [char, data] of Object.entries(userLetterings)) {
        letteringImages[char] = data;
        console.log(`  Added user glyph for "${char}"`);
    }

    console.log(`Total user letterings: ${Object.keys(letteringImages).length}`);

    // STEP 2: For characters NOT in user letterings, try global pool
    const missingChars = validChars.filter(char => !letteringImages[char]);

    console.log(`\nSTEP 2: Checking global pool for ${missingChars.length} missing characters`);
    console.log('Missing chars:', missingChars);

    if (missingChars.length > 0) {
        const globalPromises = missingChars.map(async (char) => {
            console.log(`  Querying global pool for "${char}"...`);
            const globalImageData = await getRandomGlobalGlyph(char);

            // Only add if a global glyph was found
            if (globalImageData) {
                letteringImages[char] = {
                    imageData: globalImageData,
                    source: 'global'
                };
                console.log(`  ✓ Found global glyph for "${char}" (${globalImageData.substring(0, 50)}...)`);
            } else {
                console.log(`  ✗ No global glyph for "${char}" - will use serif fallback`);
                // Explicitly leave letteringImages[char] undefined
                // This ensures the renderer will use default serif font
            }
        });

        await Promise.all(globalPromises);
    } else {
        console.log('  (No missing characters - all have user glyphs)');
    }

    // STEP 3: Log final statistics
    const userCount = Object.values(letteringImages).filter(v => v && v.source === 'user').length;
    const globalCount = Object.values(letteringImages).filter(v => v && v.source === 'global').length;
    const serifCount = validChars.filter(char => !letteringImages[char]).length;

    console.log('\n=== LETTERING LOAD SUMMARY ===');
    console.log(`  User glyphs: ${userCount}`);
    console.log(`  Global glyphs: ${globalCount}`);
    console.log(`  Serif fallback: ${serifCount}`);
    console.log(`  Total characters: ${validChars.length}`);
    console.log('  Characters with glyphs:', Object.keys(letteringImages));
    console.log('=== loadAllLetteringsForInteraction END ===\n');

    return letteringImages;
}

/**
 * Load user's own letterings (for lettering mode)
 * @returns {Promise<Object>} - Object mapping characters to image data URLs
 */
export async function loadUserLetterings() {
    const userId = getUserId();
    const letterings = {};

    // If Firebase not available, try localStorage fallback
    if (!db) {
        console.warn('Firebase not configured - checking localStorage for saved letterings');

        // Load from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`local_glyph_${userId}_`)) {
                const char = key.replace(`local_glyph_${userId}_`, '');
                const imageData = localStorage.getItem(key);
                if (imageData) {
                    letterings[char] = imageData;
                }
            }
        }

        console.log(`Loaded ${Object.keys(letterings).length} user letterings from localStorage`);
        return letterings;
    }

    try {
        const userGlyphRef = doc(db, USER_GLYPHS_COLLECTION, userId);
        const userDoc = await getDoc(userGlyphRef);

        if (!userDoc.exists()) {
            return letterings;
        }

        const charMap = userDoc.data().charMap || {};

        // Fetch each glyph
        const promises = Object.entries(charMap).map(async ([char, glyphId]) => {
            try {
                const glyphDoc = await getDoc(doc(db, GLOBAL_GLYPHS_COLLECTION, glyphId));
                if (glyphDoc.exists()) {
                    letterings[char] = glyphDoc.data().imageData;
                }
            } catch (error) {
                console.error(`Error loading glyph for "${char}":`, error);
            }
        });

        await Promise.all(promises);

        console.log(`Loaded ${Object.keys(letterings).length} user letterings from Firebase`);
        return letterings;
    } catch (error) {
        console.error('Error loading user letterings:', error);
        return letterings;
    }
}
