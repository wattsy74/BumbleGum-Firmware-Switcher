#!/usr/bin/env node

/**
 * TEST: USB Control Transfer Bootloader Command
 * Based on Santroller configurator source code:
 * bmRequestType=0x21, bRequest=49 (0x31)
 */

const usb = require('usb');

const SANTROLLER_VID = 0x1209;
const SANTROLLER_PID = 0x2882;

// Control transfer parameters from Santroller source
const bmRequestType = 0x21;  // Class request, Host-to-Device, Interface
const bRequest = 49;         // BOOTLOADER constant (0x31 in hex)
const wValue = 0;
const wIndex = 0;

console.log('===========================================');
console.log('  SANTROLLER USB CONTROL TRANSFER TEST');
console.log('  (Based on actual configurator source)');
console.log('===========================================');
console.log('');
console.log('Found command in ardwiino_script_pre.py:');
console.log('  dev.ctrl_transfer(0x21, BOOTLOADER)');
console.log('  where BOOTLOADER = 49 (0x31)');
console.log('');

// Find device
const devices = usb.getDeviceList();
let santrollerDevice = null;

for (const device of devices) {
    const desc = device.deviceDescriptor;
    if (desc.idVendor === SANTROLLER_VID && desc.idProduct === SANTROLLER_PID) {
        santrollerDevice = device;
        break;
    }
}

if (!santrollerDevice) {
    console.error('❌ Santroller device not found');
    console.error(`   Looking for VID:PID = ${SANTROLLER_VID.toString(16)}:${SANTROLLER_PID.toString(16)}`);
    process.exit(1);
}

try {
    console.log('✓ Found Santroller device');
    console.log('');
    console.log('Opening device...');
    santrollerDevice.open();
    
    console.log('✓ Device opened');
    console.log('');
    console.log('Sending USB control transfer:');
    console.log(`  bmRequestType: 0x${bmRequestType.toString(16)} (${bmRequestType})`);
    console.log(`  bRequest:      0x${bRequest.toString(16)} (${bRequest})`);
    console.log(`  wValue:        ${wValue}`);
    console.log(`  wIndex:        ${wIndex}`);
    console.log('');
    
    // Send the control transfer (no data phase)
    santrollerDevice.controlTransfer(
        bmRequestType,
        bRequest,
        wValue,
        wIndex,
        Buffer.alloc(0),  // No data
        (error, data) => {
            if (error) {
                // Error is EXPECTED if device rebooted successfully!
                if (error.errno === 19 || error.message.includes('LIBUSB_ERROR_NO_DEVICE') || error.message.includes('No such device')) {
                    console.log('✓ Control transfer sent!');
                    console.log('✓ Device disconnected (errno 19 = device rebooted!)');
                    console.log('');
                    console.log('🎉 SUCCESS! Device is rebooting into BOOTSEL mode!');
                    console.log('   Watch for RPI-RP2 volume to appear...');
                } else {
                    console.error('❌ Control transfer failed:', error);
                }
            } else {
                console.log('✓ Control transfer completed');
                console.log('');
                
                // Check if device is still there
                setTimeout(() => {
                    try {
                        const stillThere = usb.getDeviceList().some(d => {
                            const desc = d.deviceDescriptor;
                            return desc.idVendor === SANTROLLER_VID && desc.idProduct === SANTROLLER_PID;
                        });
                        
                        if (!stillThere) {
                            console.log('🎉 SUCCESS! Device disconnected - entering BOOTSEL mode!');
                        } else {
                            console.log('⚠️  Device still present - command may not have worked');
                        }
                    } catch (e) {
                        console.log('🎉 Device disconnected - likely rebooted!');
                    }
                    
                    try {
                        santrollerDevice.close();
                    } catch (e) {
                        // Ignore
                    }
                }, 2000);
            }
        }
    );
    
} catch (error) {
    console.error('❌ Error:', error.message);
    try {
        santrollerDevice.close();
    } catch (e) {
        // Ignore
    }
    process.exit(1);
}
