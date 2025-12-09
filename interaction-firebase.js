// Firebase integration for interaction mode
import { loadAllLetteringsForInteraction, getUserId } from './firebase-storage.js';

// This will be called by the main interaction script
export async function loadCustomLetteringsFromFirebase(requiredChars) {
    try {
        console.log('=== LOADING LETTERINGS FROM FIREBASE ===');
        console.log('Required characters:', requiredChars);
        console.log('User ID:', getUserId());

        const letteringData = await loadAllLetteringsForInteraction(requiredChars);

        console.log('Raw lettering data received:', Object.keys(letteringData));

        // Convert to the format expected by interaction.html
        const letteringImages = {};

        for (const [char, data] of Object.entries(letteringData)) {
            if (!data || !data.imageData) {
                console.error(`Missing imageData for character "${char}":`, data);
                continue;
            }

            try {
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = () => {
                        console.log(`✓ Successfully loaded image for "${char}" from ${data.source}`);
                        resolve();
                    };
                    img.onerror = (err) => {
                        console.error(`✗ Failed to load image for "${char}":`, err);
                        reject(err);
                    };
                    img.src = data.imageData;
                });
                letteringImages[char] = img;
            } catch (imgError) {
                console.error(`Error creating image for "${char}":`, imgError);
            }
        }

        console.log('=== LOADING COMPLETE ===');
        console.log(`Total letterings loaded: ${Object.keys(letteringImages).length}`);
        console.log('Characters with glyphs:', Object.keys(letteringImages));

        return letteringImages;
    } catch (error) {
        console.error('Error loading letterings from Firebase:', error);
        return {};
    }
}

export { getUserId };
