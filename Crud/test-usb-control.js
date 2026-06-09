#!/usr/bin/env node

/**
 * USB Control Transfer Bootloader Test
 * 
 * Tests common RP2040/Pico bootloader control transfer commands
 * These bypass HID and talk directly to USB
 */

const usb = require('usb');

console.log('========================================');
console.log('  USB CONTROL TRANSFER BOOTLOADER TEST');
console.log('========================================\n');

// Find Santroller device (VID: 0x1209, PID: 0x2882)
const device = usb.findByIds(0x1209, 0x2882);

if (!device) {
    console.error('❌ Santroller device not found!');
    console.error('   Make sure it\'s plugged in.');
    process.exit(1);
}

console.log('✅ Found Santroller device\n');

try {
    device.open();
    console.log('✅ Device opened\n');
} catch (e) {
    console.error('❌ Could not open device:', e.message);
    console.error('\nOn macOS, you may need to:');
    console.error('1. Close any apps using the device');
    console.error('2. Run with sudo: sudo node test-usb-control.js');
    process.exit(1);
}

console.log('Device info:');
console.log(`  Vendor ID: 0x${device.deviceDescriptor.idVendor.toString(16)}`);
console.log(`  Product ID: 0x${device.deviceDescriptor.idProduct.toString(16)}`);
console.log(`  Device Class: ${device.deviceDescriptor.bDeviceClass}`);
console.log('');

// Common RP2040 bootloader control transfer patterns
const testCases = [
    {
        name: 'RP2040 BOOTSEL (Standard)',
        bmRequestType: 0x41,  // Vendor, Device-to-Host, Device
        bRequest: 0x01,       // Custom request
        wValue: 0,
        wIndex: 0,
        data: Buffer.from([])
    },
    {
        name: 'RP2040 Reset to Bootloader',
        bmRequestType: 0x21,  // Class, Host-to-Device, Interface  
        bRequest: 0x5D,       // Reboot request
        wValue: 0,
        wIndex: 0,
        data: Buffer.from([])
    },
    {
        name: 'Pico Bootloader Magic (Picoboot)',
        bmRequestType: 0x40,  // Vendor, Host-to-Device
        bRequest: 0x41,       // 'A' (Picoboot command)
        wValue: 0,
        wIndex: 0,
        data: Buffer.from([])
    },
    {
        name: 'USB DFU Detach (Standard)',
        bmRequestType: 0x21,  // Class, Host-to-Device, Interface
        bRequest: 0x00,       // DFU_DETACH
        wValue: 1000,         // Timeout in ms
        wIndex: 0,
        data: Buffer.from([])
    },
    {
        name: 'Vendor Reset Command (Type 1)',
        bmRequestType: 0x40,  // Vendor, Host-to-Device, Device
        bRequest: 0xFF,       // Vendor-specific
        wValue: 0xBEEF,       // Magic value
        wIndex: 0,
        data: Buffer.from([])
    },
    {
        name: 'Arduino Leonardo Reset (DTR)',
        bmRequestType: 0x21,  // Class, Host-to-Device, Interface
        bRequest: 0x22,       // SET_CONTROL_LINE_STATE
        wValue: 0,            // DTR=0, RTS=0 (reset)
        wIndex: 0,
        data: Buffer.from([])
    },
    {
        name: 'Pico SDK Reset',
        bmRequestType: 0x40,
        bRequest: 0x01,
        wValue: 0x0001,       // Reset to bootloader flag
        wIndex: 0,
        data: Buffer.from([0x00, 0x57, 0xAB])  // Magic sequence
    }
];

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('========================================');
    console.log('  TESTING CONTROL TRANSFERS');
    console.log('========================================\n');

    for (const test of testCases) {
        console.log(`🧪 Testing: ${test.name}`);
        console.log(`   bmRequestType: 0x${test.bmRequestType.toString(16).toUpperCase()}`);
        console.log(`   bRequest: 0x${test.bRequest.toString(16).toUpperCase()}`);
        console.log(`   wValue: 0x${test.wValue.toString(16).toUpperCase()}`);
        console.log(`   wIndex: 0x${test.wIndex.toString(16).toUpperCase()}`);
        console.log(`   Data: [${Array.from(test.data).map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(', ')}]`);

        try {
            device.controlTransfer(
                test.bmRequestType,
                test.bRequest,
                test.wValue,
                test.wIndex,
                test.data,
                (error, data) => {
                    if (error) {
                        console.log(`   ❌ Error: ${error.message}`);
                    } else {
                        console.log(`   ✓ Sent successfully`);
                        if (data && data.length > 0) {
                            console.log(`   Response: [${Array.from(data).map(b => '0x' + b.toString(16).toUpperCase()).join(', ')}]`);
                        }
                    }
                }
            );

            await sleep(1500);

            // Check if device disappeared (rebooted)
            const stillThere = usb.findByIds(0x1209, 0x2882);
            if (!stillThere) {
                console.log(`   🎉🎉🎉 SUCCESS! Device disconnected - entering BOOTSEL!`);
                console.log(`\n========================================`);
                console.log(`  WORKING COMMAND FOUND!`);
                console.log(`========================================`);
                console.log(`Test: ${test.name}`);
                console.log(`bmRequestType: 0x${test.bmRequestType.toString(16)}`);
                console.log(`bRequest: 0x${test.bRequest.toString(16)}`);
                console.log(`wValue: 0x${test.wValue.toString(16)}`);
                console.log(`wIndex: 0x${test.wIndex.toString(16)}`);
                console.log(`========================================\n`);
                process.exit(0);
            }

        } catch (e) {
            console.log(`   ❌ Exception: ${e.message}`);
        }

        console.log('');
        await sleep(500);
    }

    console.log('========================================');
    console.log('  TEST COMPLETE');
    console.log('========================================');
    console.log('None of the standard control transfers worked.');
    console.log('');
    console.log('Next step: Capture actual USB traffic from Santroller app');
    console.log('Run: ./capture-usb-simple.sh');
    console.log('========================================\n');

    device.close();
}

runTests().catch(e => {
    console.error('Fatal error:', e);
    try {
        device.close();
    } catch (_) {}
    process.exit(1);
});
