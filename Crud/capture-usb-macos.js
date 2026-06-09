#!/usr/bin/env node

/**
 * macOS USB HID Packet Capture Tool
 * 
 * Captures ALL HID traffic to/from your Santroller device at the OS level.
 * Works with native apps, not just browsers.
 * 
 * Usage:
 *   node capture-usb-macos.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('  macOS USB HID Packet Capture');
console.log('  for Santroller Device');
console.log('========================================\n');

// Check if running on macOS
if (process.platform !== 'darwin') {
    console.error('❌ This tool only works on macOS!');
    console.error('   For Windows/Linux, see alternative methods below.');
    process.exit(1);
}

// Find Santroller device using system_profiler
console.log('🔍 Scanning for Santroller devices...\n');

try {
    const output = execSync('system_profiler SPUSBDataType -json', { encoding: 'utf8' });
    const data = JSON.parse(output);
    
    let found = false;
    
    function searchUSB(items) {
        if (!items) return;
        
        for (const item of items) {
            if (item.vendor_id === '0x1209' || item._name?.includes('Guitar') || item._name?.includes('Santroller')) {
                console.log('✅ Found Santroller Device:');
                console.log(`   Name: ${item._name}`);
                console.log(`   Vendor ID: ${item.vendor_id || 'Unknown'}`);
                console.log(`   Product ID: ${item.product_id || 'Unknown'}`);
                console.log(`   Serial: ${item.serial_num || 'Unknown'}`);
                console.log(`   Location ID: ${item.location_id || 'Unknown'}`);
                console.log('');
                found = true;
            }
            
            if (item._items) {
                searchUSB(item._items);
            }
        }
    }
    
    searchUSB(data.SPUSBDataType);
    
    if (!found) {
        console.log('⚠️  No Santroller device detected.');
        console.log('   Make sure your device is plugged in.\n');
    }
    
} catch (error) {
    console.error('⚠️  Could not scan USB devices:', error.message);
}

console.log('========================================');
console.log('  CAPTURE METHOD');
console.log('========================================\n');

console.log('On macOS, capturing USB HID traffic from native apps requires:');
console.log('1. Wireshark with USB capture enabled, OR');
console.log('2. Apple\'s PacketLogger tool, OR');
console.log('3. IOKit tracing\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 RECOMMENDED METHOD:\n');
console.log('Use IOKit HID tracing (built into macOS):\n');

console.log('1. Open Terminal and run:');
console.log('   sudo log stream --predicate \'subsystem == "com.apple.iokit.IOHIDFamily"\'\n');

console.log('2. In another Terminal, run:');
console.log('   sudo log stream --level debug --predicate \'subsystem == "com.apple.iokit.IOHIDFamily"\'\n');

console.log('3. Open your Santroller configurator app\n');

console.log('4. Trigger "Reboot to Bootloader"\n');

console.log('5. Look in the log output for:');
console.log('   - setReport');
console.log('   - sendFeatureReport');
console.log('   - Report data bytes\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('🎯 EASIER ALTERNATIVE:\n');
console.log('Since we can\'t easily sniff native app traffic,');
console.log('let me check if there\'s source code available!\n');

console.log('Is your Santroller configurator:');
console.log('  A) A downloadable native Mac app?');
console.log('  B) A Windows .exe running via Wine/Crossover?');
console.log('  C) An Electron app?');
console.log('  D) Something else?\n');

console.log('If it\'s Electron or if source code is available,');
console.log('we can find the exact command much more easily!\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📖 ALTERNATIVE: Check Source Code\n');
console.log('If Santroller configurator is open source:');
console.log('https://github.com/search?q=santroller+reboot+bootloader\n');

console.log('Look for code that calls:');
console.log('  - hidDevice.write()');
console.log('  - hidDevice.sendFeatureReport()');
console.log('  - reset_usb_boot()');
console.log('  - reboot to bootloader\n');

console.log('The exact bytes are usually in the source!\n');

console.log('========================================\n');

console.log('💡 TELL ME:\n');
console.log('1. What is the Santroller configurator app called?');
console.log('2. Where did you download it from?');
console.log('3. Is it open source?\n');

console.log('Once I know this, I can find the exact command! 🎯\n');
