#!/usr/bin/env node

/**
 * Detect which app is communicating with Santroller device
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('========================================');
console.log('  SANTROLLER APP DETECTOR');
console.log('========================================\n');

console.log('Looking for processes accessing USB devices...\n');

try {
    // List processes with open USB connections
    const lsofOutput = execSync('lsof | grep -i "usb\\|hid" | grep -v grep', { encoding: 'utf8' });
    
    if (lsofOutput) {
        console.log('Processes with USB/HID connections:\n');
        console.log(lsofOutput);
    } else {
        console.log('No USB processes found with lsof');
    }
} catch (e) {
    console.log('Could not get lsof data');
}

console.log('\n========================================');
console.log('Looking for Santroller-related apps...\n');

try {
    // Find apps with "santroller" in name
    const apps = execSync('mdfind "kMDItemDisplayName == \'*santroller*\'c" -onlyin /Applications -onlyin ~/Applications -onlyin ~/Downloads', { encoding: 'utf8' });
    
    if (apps) {
        console.log('Found Santroller-related applications:\n');
        console.log(apps);
    } else {
        console.log('No apps found with "santroller" in name');
    }
} catch (e) {
    console.log('Could not search for apps');
}

console.log('\n========================================');
console.log('Currently running GUI applications:\n');

try {
    const running = execSync('ps aux | grep -i "santroller\\|configurator\\|arduino" | grep -v grep', { encoding: 'utf8' });
    
    if (running) {
        console.log(running);
    } else {
        console.log('No matching processes currently running');
    }
} catch (e) {
    console.log('No matching processes found');
}

console.log('\n========================================');
console.log('  INSTRUCTIONS');
console.log('========================================\n');
console.log('If you see your Santroller configurator above:');
console.log('  1. Note its full path');
console.log('  2. Check if it\'s an Electron app:');
console.log('     Right-click → Show Package Contents');
console.log('     Look for Contents/Resources/app.asar');
console.log('');
console.log('If it\'s Electron, we can extract and read the source code!');
console.log('If it\'s native, we need Wireshark packet capture.');
console.log('');
console.log('Tell me:');
console.log('  - What is the app name?');
console.log('  - Where is it located?');
console.log('  - Is it an .app bundle or something else?');
console.log('========================================\n');
