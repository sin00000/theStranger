#!/usr/bin/env node

/**
 * Interactive Firebase Configuration Setup
 *
 * This script helps you set up Firebase credentials for the stranger project.
 * It will prompt you for your Firebase config values and update firebase-config.js
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║        Firebase Configuration Setup for Stranger          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('Before starting, please:');
console.log('1. Go to https://console.firebase.google.com');
console.log('2. Create a new project (or select existing one)');
console.log('3. Click the web icon (</>) to add a web app');
console.log('4. Copy the firebaseConfig object\n');

console.log('You will need these values:');
console.log('  - apiKey');
console.log('  - authDomain');
console.log('  - projectId');
console.log('  - storageBucket');
console.log('  - messagingSenderId');
console.log('  - appId\n');

async function main() {
    const proceed = await question('Do you have your Firebase config ready? (yes/no): ');

    if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
        console.log('\nPlease get your Firebase config first, then run this script again.');
        console.log('See FIREBASE_SETUP.md for detailed instructions.\n');
        rl.close();
        return;
    }

    console.log('\n📝 Please enter your Firebase configuration values:\n');

    const apiKey = await question('apiKey: ');
    const authDomain = await question('authDomain: ');
    const projectId = await question('projectId: ');
    const storageBucket = await question('storageBucket: ');
    const messagingSenderId = await question('messagingSenderId: ');
    const appId = await question('appId: ');

    console.log('\n📋 Your configuration:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`apiKey:            ${apiKey}`);
    console.log(`authDomain:        ${authDomain}`);
    console.log(`projectId:         ${projectId}`);
    console.log(`storageBucket:     ${storageBucket}`);
    console.log(`messagingSenderId: ${messagingSenderId}`);
    console.log(`appId:             ${appId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const confirm = await question('Is this correct? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('\nSetup cancelled. Please run the script again.\n');
        rl.close();
        return;
    }

    // Generate the new config file content
    const configContent = `// Firebase Configuration
// Replace these values with your actual Firebase project credentials
// Get these from: Firebase Console > Project Settings > Your apps > Web app

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase project configuration
const firebaseConfig = {
    apiKey: "${apiKey}",
    authDomain: "${authDomain}",
    projectId: "${projectId}",
    storageBucket: "${storageBucket}",
    messagingSenderId: "${messagingSenderId}",
    appId: "${appId}"
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
`;

    // Write to firebase-config.js
    const configPath = path.join(__dirname, 'firebase-config.js');
    const backupPath = path.join(__dirname, 'firebase-config.js.backup');

    try {
        // Create backup of original file
        if (fs.existsSync(configPath)) {
            fs.copyFileSync(configPath, backupPath);
            console.log(`\n📦 Backup created: firebase-config.js.backup`);
        }

        // Write new config
        fs.writeFileSync(configPath, configContent, 'utf8');

        console.log('\n✅ Firebase configuration updated successfully!');
        console.log(`📝 Updated file: ${configPath}\n`);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Next steps:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. ✅ Enable Firestore Database in Firebase Console');
        console.log('2. ✅ Set Firestore Security Rules (see FIREBASE_SETUP.md)');
        console.log('3. ✅ Start your dev server: npm run dev');
        console.log('4. ✅ Test the application\n');

        console.log('Expected console output when it works:');
        console.log('  ✅ Firebase initialized successfully');
        console.log('  Cross-user glyph sharing is enabled.\n');

    } catch (error) {
        console.error('\n❌ Error writing config file:', error.message);
        console.log('Please update firebase-config.js manually.\n');
    }

    rl.close();
}

main().catch(error => {
    console.error('Error:', error);
    rl.close();
});
