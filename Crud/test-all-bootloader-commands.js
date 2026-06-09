#!/usr/bin/env node

/**
 * Comprehensive Santroller Bootloader Command Test
 * 
 * Tests EVERY possible variation of the 0x26 bootloader command
 * based on the actual firmware source code we found.
 */

const HID = require('node-hid');

console.log('========================================');
console.log('  SANTROLLER BOOTLOADER COMMAND TEST');
console.log('========================================\n');

// Find Santroller device
const devices = HID.devices();
const santrollerDevices = devices.filter(d => d.vendorId === 0x1209);

if (santrollerDevices.length === 0) {
    console.error('❌ No Santroller devices found!');
    process.exit(1);
}

console.log(`Found device: ${santrollerDevices[0].product}\n`);

// Test variations
const testCases = [
    { name: 'Feature Report: [0x26]', reportId: 0x26, data: [], method: 'sendFeatureReport' },
    { name: 'Feature Report: [0x26, 0x00]', reportId: 0x26, data: [0x00], method: 'sendFeatureReport' },
    { name: 'Feature Report: [0x26] + 63 zeros', reportId: 0x26, data: new Array(63).fill(0), method: 'sendFeatureReport' },
    { name: 'Output Report: [0x26]', reportId: 0, data: [0x26], method: 'write' },
    { name: 'Output Report: [0x26, 0x00]', reportId: 0, data: [0x26, 0x00], method: 'write' },
   { name: 'Feature Report ID 0, Data [0x26]', reportId: 0, data: [0x26], method: 'sendFeatureReport' },
];

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    for (const testCase of testCases) {
        console.log(`\n🧪 Testing: ${testCase.name}`);
        
        for (const deviceInfo of santrollerDevices) {
            let device;
            try {
                device = new HID.HID(deviceInfo.path);
                
                try {
                    if (testCase.method === 'sendFeatureReport') {
                        const buffer = [testCase.reportId, ...testCase.data];
                        console.log(`   Sending: sendFeatureReport([${buffer.map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(', ')}])`);
                        
                        const result = device.sendFeatureReport(buffer);
                        console.log(`   ✓ Sent successfully (${result} bytes)`);
                    } else {
                        console.log(`   Sending: write([${testCase.data.map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(', ')}])`);
                        
                        device.write(testCase.data);
                        console.log(`   ✓ Sent successfully`);
                    }
                    
                    // Wait a bit to see if device disconnects
                    console.log(`   Waiting 2 seconds to check if device reboots...`);
                    await sleep(2000);
                    
                    // Check if device still present
                    const devicesAfter = HID.devices().filter(d => 
                        d.vendorId === 0x1209 &&
                        d.productId === deviceInfo.productId &&
                        d.serialNumber === deviceInfo.serialNumber
                    );
                    
                    if (devicesAfter.length === 0) {
                        console.log(`   🎉🎉🎉 SUCCESS! Device disconnected - entering BOOTSEL mode!`);
                        console.log(`\n========================================`);
                        console.log(`  WORKING COMMAND FOUND!`);
                        console.log(`========================================`);
                        console.log(`Method: ${testCase.method}`);
                        console.log(`Report ID: 0x${testCase.reportId.toString(16).toUpperCase()}`);
                        console.log(`Data: [${testCase.data.map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(', ')}]`);
                        console.log(`========================================\n`);
                        process.exit(0);
                    } else {
                        console.log(`   ⚠️  Device still present - command didn't trigger reboot`);
                    }
                    
                } catch (sendError) {
                    console.log(`   ❌ Send failed: ${sendError.message}`);
                }
                
                device.close();
                await sleep(500);
                
            } catch (openError) {
                console.log(`   ⚠️  Could not open interface: ${openError.message}`);
            }
        }
    }
    
    console.log(`\n========================================`);
    console.log(`  TEST COMPLETE`);
    console.log(`========================================`);
    console.log(`None of the test commands triggered a reboot.`);
    console.log(``);
    console.log(`This confirms:`);
    console.log(` - Your Santroller firmware build doesn't respond to HID bootloader commands`);
    console.log(` - The "revert to Arduino" button in the configurator likely:`);
    console.log(`   a) Uses a different/proprietary protocol, OR`);
    console.log(`   b) Uses USB control transfers (not HID reports), OR`);
    console.log(`   c) Triggers a hardware reset line`);
    console.log(``);
    console.log(`Recommendation:`);
    console.log(` - Use the hybrid workflow (manual reboot + auto-flash)`);
    console.log(` - Or run the iOS/macOS USB packet capture to see what the configurator actually sends`);
    console.log(`========================================\n`);
}

runTests().catch(console.error);
