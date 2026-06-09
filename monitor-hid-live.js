#!/usr/bin/env node

/**
 * Live HID Monitor for Santroller
 * 
 * This will connect to your device and show ALL HID traffic in real-time.
 * You can trigger "revert to Arduino" and we'll see the exact command!
 */

const HID = require('node-hid');

console.log('========================================');
console.log('  LIVE HID MONITOR');
console.log('  for Santroller Devices');
console.log('========================================\n');

// Find all Sant roller devices
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
    console.log('');
});

// Try opening each interface and monitor input
console.log('========================================');
console.log('  MONITORING ALL INTERFACES');
console.log('========================================\n');

const openDevices = [];

for (const dev of santrollerDevices) {
    try {
        const hidDev = new HID.HID(dev.path);
        console.log(`✅ Opened: ${dev.path.substring(0, 60)}...`);
        
        hidDev.on('data', (data) => {
            const timestamp = new Date().toLocaleTimeString();
            const hex = Array.from(data).map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
            console.log(`\n[${timestamp}] 📥 INPUT from ${dev.product}:`);
            console.log(`  ${hex}`);
            console.log(`  Length: ${data.length} bytes`);
        });
        
        hidDev.on('error', (err) => {
            console.error(`\n❌ Error on ${dev.product}: ${err.message}`);
        });
        
        openDevices.push({ dev: hidDev, info: dev });
    } catch (e) {
        console.log(`⚠️  Could not open: ${dev.path.substring(0, 60)}... (${e.message})`);
    }
}

if (openDevices.length === 0) {
    console.error('\n❌ Could not open any HID interfaces!');
    console.error('   Device may be in use by another application.');
    process.exit(1);
}

console.log('\n========================================');
console.log('  READY TO MONITOR');
console.log('========================================\n');
console.log('Now do the following:');
console.log('1. Open your Santroller configurator app');
console.log('2. Click "Revert Device to Arduino" button');
console.log('3. Watch this terminal for the command!');
console.log('\n(Press Ctrl+C to stop)\n');

// Keep alive
process.on('SIGINT', () => {
    console.log('\n\n========================================');
    console.log('  STOPPING MONITOR');
    console.log('========================================');
    openDevices.forEach(od => {
        try {
            od.dev.close();
        } catch (e) {}
    });
    console.log('✅ Done!\n');
    process.exit(0);
});

setInterval(() => {}, 10000);
