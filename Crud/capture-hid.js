#!/usr/bin/env node

/**
 * HID Traffic Capture Tool
 * 
 * This script monitors HID communication with your Santroller device
 * and logs all reports sent/received so we can see exactly what
 * the official Santroller app sends to trigger reboot.
 * 
 * Usage:
 *   1. Run this script: node capture-hid.js
 *   2. Open official Santroller app in browser
 *   3. Trigger reboot in Santroller app
 *   4. Check output - we'll see the exact command!
 */

const HID = require('node-hid');

console.log('========================================');
console.log('  HID Traffic Capture Tool');
console.log('  for Santroller Device');
console.log('========================================\n');

// Find Santroller device (VID 0x1209)
const devices = HID.devices();
const santrollerDevices = devices.filter(d => d.vendorId === 0x1209);

if (santrollerDevices.length === 0) {
    console.error('❌ No Santroller devices found!');
    console.error('   Make sure your device is plugged in.');
    process.exit(1);
}

console.log(`Found ${santrollerDevices.length} Santroller interface(s):\n`);

santrollerDevices.forEach((dev, idx) => {
    console.log(`Interface ${idx + 1}:`);
    console.log(`  Path: ${dev.path}`);
    console.log(`  Product: ${dev.product}`);
    console.log(`  Usage Page: 0x${(dev.usagePage || 0).toString(16).toUpperCase().padStart(4, '0')}`);
    console.log(`  Usage: 0x${(dev.usage || 0).toString(16).toUpperCase().padStart(4, '0')}`);
    console.log(`  Serial: ${dev.serialNumber || 'N/A'}`);
    console.log('');
});

// Try to open device for monitoring
const targetDevice = santrollerDevices[0];
let device;

try {
    console.log(`Attempting to open: ${targetDevice.path}`);
    device = new HID.HID(targetDevice.path);
    console.log('✅ Device opened successfully!');
} catch (error) {
    console.error(`❌ Could not open device: ${error.message}`);
    console.error('   The device may be in use by another application.');
    console.error('   Close other apps using the device and try again.');
    process.exit(1);
}

console.log('\n========================================');
console.log('  MONITORING HID TRAFFIC');
console.log('========================================\n');
console.log('Listening for HID reports...');
console.log('(Press Ctrl+C to stop)\n');

let reportCount = 0;
const seenReports = new Map();

// Listen for incoming data
device.on('data', (data) => {
    reportCount++;
    const hex = Array.from(data).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    const key = hex;
    
    if (!seenReports.has(key) || Date.now() - seenReports.get(key) > 5000) {
        console.log(`\n📥 [${new Date().toLocaleTimeString()}] INCOMING REPORT #${reportCount}:`);
        console.log(`   Bytes (${data.length}): ${hex}`);
        console.log(`   ASCII: ${Array.from(data).map(b => b >= 32 && b <= 126 ? String.fromCharCode(b) : '.').join('')}`);
        seenReports.set(key, Date.now());
    }
});

device.on('error', (error) => {
    console.error(`\n❌ Device error: ${error.message}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n========================================');
    console.log('  CAPTURE STOPPED');
    console.log('========================================');
    console.log(`Total reports received: ${reportCount}`);
    console.log('\nClosing device...');
    device.close();
    console.log('✅ Done!\n');
    process.exit(0);
});

console.log('========================================');
console.log('  ACTION REQUIRED:');
console.log('========================================');
console.log('1. Keep this terminal open');
console.log('2. Open Santroller Configurator:');
console.log('   https://santroller.net/tools/configurator/');
console.log('3. Connect to your device in the web app');
console.log('4. Click "Reboot to Bootloader" or similar');
console.log('5. Watch this terminal for the command!');
console.log('\n⏳ Waiting...\n');

// Keep alive
setInterval(() => {
    // Just keep process running
}, 10000);
