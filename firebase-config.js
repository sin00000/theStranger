// Firebase Configuration
// Replace these values with your actual Firebase project credentials
// Get these from: Firebase Console > Project Settings > Your apps > Web app

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyD4LwTkR_v9tLVuN97Dn703k78FosaXL5Q",
    authDomain: "thestranger-3ff8a.firebaseapp.com",
    projectId: "thestranger-3ff8a",
    storageBucket: "thestranger-3ff8a.firebasestorage.app",
    messagingSenderId: "194257060412",
    appId: "1:194257060412:web:7f74f868d1fab53c7b3939",
    measurementId: "G-8VZRV5D3PB"
};

let app = null;
let db = null;

try {
    // Check if Firebase is configured
    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.warn('⚠️  FIREBASE NOT CONFIGURED');
        console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.warn('Cross-user glyph sharing will NOT work.');
        console.warn('Please add your Firebase credentials to firebase-config.js');
        console.warn('See DIAGNOSIS.md for setup instructions.');
        console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        // Don't initialize Firebase with placeholder values
    } else {
        // Initialize Firebase with real config
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log('✅ Firebase initialized successfully');
        console.log('Cross-user glyph sharing is enabled.');
    }
} catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    console.warn('App will continue in local-only mode (no cross-user sharing)');
}

export { db };
