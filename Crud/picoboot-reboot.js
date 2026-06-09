#!/usr/bin/env node

/**
 * PICOBOOT PROTOCOL TEST
 * Based on RP2040 Picoboot interface specification
 */

const usb = require('usb');

console.log('========================================');
console.log('  PICOBOOT PROTOCOL REBOOT TEST');
console.log('========================================\n');

const device = usb.findByIds(0x1209, 0x2882);

if (!device) {
    console.error('❌ Santroller device not found!');
    process.exit(1);
}

console.log('✅ Found Santroller device\n');

try {
    device.open();
    console.log('✅ Device opened\n');
} catch (e) {
    console.error('❌ Could not open device:', e.message);
    console.error('\nTry running with sudo: sudo node picoboot-reboot.js');
    process.exit(1);
}

// Picoboot interface uses:
// Interface 1 (vendor-specific interface for bootloader commands)
// The standard Picoboot protocol command to reboot to BOOTSEL mode

console.log('Testing Picoboot reboot command...\n');

// Method 1: Picoboot REBOOT command (standard)
console.log('🧪 Test 1: Picoboot REBOOT (0x40 host-to-device)');
device.controlTransfer(
    0x40,  // bmRequestType: Vendor, Host-to-Device
    0x41,  // bRequest: 'A' - Picoboot command
    0,     // wValue
    0,     // wIndex: interface 0
    Buffer.from([]),  // empty data
    (error) => {
        if (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
            
            // Method 2: Try with bRequest 0x01
            console.log('🧪 Test 2: RP2040 reset (bRequest 0x01)');
            device.controlTransfer(
                0x40,  // bmRequestType: Vendor, Host-to-Device
                0x01,  // bRequest: 1
                0,
                0,
                Buffer.from([]),
                (error2) => {
                    if (error2) {
                        console.log(`   ❌ Error: ${error2.message}\n`);
                        
                        // Method 3: Try with wValue = 1 (bootloader flag)
                        console.log('🧪 Test 3: Reset with bootloader flag (wValue=1)');
                        device.controlTransfer(
                            0x40,
                            0x01,  // Request 1
                            0x0001,  // wValue: bootloader flag
                            0,
                            Buffer.from([]),
                            (error3) => {
                                if (error3) {
                                    console.log(`   ❌ Error: ${error3.message}\n`);
                                    testFinal();
                                } else {
                                    console.log(`   ✓ Command sent!\n`);
                                    checkDisconnect();
                                }
                            }
                        );
                    } else {
                        console.log(`   ✓ Command sent!\n`);
                        checkDisconnect();
                    }
                }
            );
        } else {
            console.log(`   ✓ Command sent!\n`);
            checkDisconnect();
        }
    }
);

function testFinal() {
    // Method 4: Maybe it needs to claim the interface first
    console.log('🧪 Test 4: Claim interface then send reboot');
    try {
        device.interface(0).claim();
        console.log('   ✓ Claimed interface 0');
        
        device.controlTransfer(
            0x21,  // Class,Host-to-Device, Interface
            0x01,  // bRequest: RESET
            0,
            0,
            Buffer.from([]),
            (error) => {
                if (error) {
                    console.log(`   ❌ Error: ${error.message}\n`);
                    finalMethod();
                } else {
                    console.log(`   ✓ Command sent!\n`);
                    checkDisconnect();
                }
            }
        );
    } catch (e) {
        console.log(`   ❌ Could not claim interface: ${e.message}\n`);
        finalMethod();
    }
}

function finalMethod() {
    // Method 5: Try detaching kernel driver and claiming interface
    console.log('🧪 Test 5: Detach kernel driver approach');
    const iface = device.interface(0);
    
    if (iface.isKernelDriverActive()) {
        try {
            iface.detachKernelDriver();
            console.log('   ✓ Detached kernel driver');
        } catch (e) {
            console.log(`   ⚠️  Could not detach: ${e.message}`);
        }
    }
    
    try {
        iface.claim();
        console.log('   ✓ Claimed interface');
        
        // Try sending on endpoint (not control transfer)
        const endpoint = iface.endpoint(0x01);
        if (endpoint && endpoint.direction === 'out') {
            endpoint.transfer(Buffer.from([0x41, 0x00]), (error) => {
                if (error) {
                    console.log(`   ❌ Endpoint transfer error: ${error.message}`);
                } else {
                    console.log(`   ✓ Endpoint transfer sent`);
                }
                checkDisconnect();
            });
        } else {
            console.log('   ⚠️  No OUT endpoint found');
            checkDisconnect();
        }
    } catch (e) {
        console.log(`   ❌ Could not claim: ${e.message}`);
        checkDisconnect();
    }
}

function checkDisconnect() {
    console.log('Waiting 2 seconds to check if device rebooted...\n');
    setTimeout(() => {
        const stillThere = usb.findByIds(0x1209, 0x2882);
        if (!stillThere) {
            console.log('🎉🎉🎉 SUCCESS! Device disconnected - entering BOOTSEL mode!');
            process.exit(0);
        } else {
            console.log('⚠️  Device still present - BOOTSEL mode not triggered\n');
            console.log('========================================');
            console.log('  RESULT: No standard command worked');
            console.log('========================================\n');
            console.log('The configurator likely uses a custom/proprietary command.');
            console.log('We need to capture the actual USB traffic.');
            console.log('\nNext step: Install Wireshark and capture USB packets');
            console.log('Run: ./setup-wireshark.sh\n');
            
            try {
                device.close();
            } catch (e) {}
            process.exit(1);
        }
    }, 2000);
}
