#!/usr/bin/env node

/**
 * Quick test to verify USB module works in the built app
 */

console.log('Testing USB module availability...\n');

try {
    const usb = require('usb');
    console.log('✅ USB module loaded successfully!');
    console.log('   libusb version:', usb.LIBUSB_VERSION || 'unknown');
    
    console.log('\nScanning for USB devices...');
    const devices = usb.getDeviceList();
    console.log(`Found ${devices.length} USB devices`);
    
    // Look for Santroller
    const santroller = devices.find(d => {
        const desc = d.deviceDescriptor;
        return desc.idVendor === 0x1209 && desc.idProduct === 0x2882;
    });
    
    if (santroller) {
        console.log('\n✅ Found Santroller device!');
        console.log('   VID: 0x' + santroller.deviceDescriptor.idVendor.toString(16));
        console.log('   PID: 0x' + santroller.deviceDescriptor.idProduct.toString(16));
        
        try {
            santroller.open();
            console.log('   ✅ Opened device successfully');
            
            console.log('\n🎯 USB control transfer should work!');
            console.log('   The firmware flasher should be able to reboot the device.');
            
            santroller.close();
        } catch (e) {
            console.log('   ⚠️  Could not open device:', e.message);
            console.log('   Try running with sudo: sudo node test-usb-module.js');
        }
    } else {
        console.log('\n⚠️  Santroller device not found');
        console.log('   Make sure your Guitar controller is plugged in');
        console.log('   and running Santroller firmware');
    }
    
} catch (error) {
    console.log('❌ ERROR: USB module failed to load!');
    console.log('   Error:', error.message);
    console.log('\n   This means the built app will also fail.');
    console.log('   Solution: Rebuild with USB module:');
    console.log('   1. cd electron-app');
    console.log('   2. npm install usb');
    console.log('   3. npm run build:mac:arm64');
    process.exit(1);
}
