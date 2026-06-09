const FIRMWARE_URLS = {
    'Classic-v1': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Classic-v1.uf2',
    'Classic-v2': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Classic-v2.uf2',
    'Santroller-v1': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Guitarv1.uf2',
    'Santroller-v2': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Guitarv2.uf2'
};

let currentDevice = null;
let hardwareVersion = 'v2'; // Default to v2 (latest hardware)

const statusDot = document.getElementById('statusDot');
const deviceName = document.getElementById('deviceName');
const currentFW = document.getElementById('currentFW');
const hwVersion = document.getElementById('hwVersion');
const switchToClassicBtn = document.getElementById('switchToClassic');
const switchToSantrollerBtn = document.getElementById('switchToSantroller');
const progress = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const logo = document.getElementById('logo');

// Hide logo if image doesn't load
if (logo) {
    logo.onerror = () => { logo.style.display = 'none'; };
}

async function detectDevice() {
    try {
        // Check BOOTSEL first
        const bootsel = await window.electronAPI.detectBootsel();
        console.log('[DETECT] BOOTSEL check:', bootsel);
        if (bootsel.found) {
            console.log('[DETECT] ✓ BOOTSEL found at:', bootsel.path);
            
            // Try to read hardware version from flag file
            const versionResult = await window.electronAPI.readHardwareVersion(bootsel.path);
            if (versionResult.success) {
                hardwareVersion = versionResult.version;
                console.log('[DETECT] ✓ Hardware version from flag file:', hardwareVersion);
            } else {
                hardwareVersion = 'v2'; // Default for new devices
                console.log('[DETECT] No hardware_version.txt, defaulting to v2');
            }
            
            currentDevice = { type: 'bootsel', path: bootsel.path, name: 'RP2040 Bootloader' };
            deviceName.textContent = 'RP2040 Bootloader';
            currentFW.textContent = 'No firmware - Ready to flash';
            hwVersion.textContent = `Hardware: ${hardwareVersion.toUpperCase()}`;
            statusDot.className = 'status-dot connected';
            updateButtons('bootsel');
            return;
        }

        // Check Santroller
        const hid = await window.electronAPI.listHIDDevices();
        console.log('[DETECT] HID devices:', hid);
        if (hid.length > 0) {
            console.log('[DETECT] ✓ Santroller found:', hid[0]);
            
            // For Santroller, we need to wait until we can read CIRCUITPY during reboot
            // For now, use stored version or default to v2
            
            currentDevice = { type: 'santroller', path: hid[0].path, name: hid[0].product || 'Santroller' };
            deviceName.textContent = currentDevice.name;
            currentFW.textContent = 'Santroller firmware';
            hwVersion.textContent = `Hardware: ${hardwareVersion.toUpperCase()}`;
            statusDot.className = 'status-dot connected';
            updateButtons('santroller');
            return;
        }

        // Check Classic (VID 0x6997 = 27031 decimal)
        // Classic firmware has TWO serial ports: console and data
        // On macOS: Must use cu.* not tty.* for outgoing commands!
        const serial = await window.electronAPI.listSerialPorts();
        console.log('[DETECT] Serial ports:', serial);
        
        const classicPorts = serial.filter(p => {
            if (!p.vendorId) return false;
            const vid = typeof p.vendorId === 'string' ? p.vendorId.toLowerCase() : p.vendorId;
            return vid === '0x6997' || vid === '6997' || vid === 0x6997 || vid === 27031;
        });
        
        console.log('[DETECT] Classic ports found:', classicPorts.length);
        
        if (classicPorts.length > 0) {
            // First, get all cu. ports (convert tty. to cu. if needed)
            const cuPorts = classicPorts.map(p => {
                if (p.path.includes('/dev/cu.')) {
                    return p;
                } else if (p.path.includes('/dev/tty.')) {
                    const cuPath = p.path.replace('/dev/tty.', '/dev/cu.');
                    console.log('[DETECT] Converting tty to cu:', p.path, '→', cuPath);
                    return { ...p, path: cuPath };
                } else {
                    return p;
                }
            });
            
            // Sort by path to get consistent ordering (higher number = data channel)
            cuPorts.sort((a, b) => a.path.localeCompare(b.path));
            
            console.log('[DETECT] Available cu. ports:', cuPorts.map(p => p.path));
            
            // If multiple ports, use the LAST one (highest number = data channel)
            // Console is usually cu.usbmodem2101, Data is cu.usbmodem2103
            const classic = cuPorts[cuPorts.length - 1];
            
            if (cuPorts.length > 1) {
                console.log('[DETECT] Multiple ports detected, using LAST (data channel):', classic.path);
                console.log('[DETECT] Skipping first port (console):', cuPorts[0].path);
            }
            
            console.log('[DETECT] ✓ Classic device found:', classic);
            console.log('[DETECT] ✓ Will connect to:', classic.path);
            
            // Read config.json to detect hardware version
            try {
                const configResult = await window.electronAPI.readClassicConfig(classic.path);
                if (configResult.success) {
                    hardwareVersion = configResult.version;
                    console.log('[DETECT] ✓ Hardware version from config.json:', hardwareVersion);
                }
            } catch (e) {
                console.warn('[DETECT] Could not read config.json, using previous version:', e.message);
            }
            
            currentDevice = { type: 'classic', path: classic.path, name: 'Classic Controller' };
            deviceName.textContent = 'Classic Controller';
            currentFW.textContent = 'Classic firmware';
            hwVersion.textContent = `Hardware: ${hardwareVersion.toUpperCase()}`;
            statusDot.className = 'status-dot connected';
            updateButtons('classic');
            return;
        }

        // No device
        currentDevice = null;
        hardwareVersion = 'v2'; // Reset to default
        deviceName.textContent = 'No device';
        currentFW.textContent = 'Plug in your device';
        hwVersion.textContent = '';
        statusDot.className = 'status-dot disconnected';
        updateButtons(null);
    } catch (e) {
        console.error('Detection error:', e);
    }
}

function updateButtons(deviceType) {
    // Hide all buttons by default
    switchToClassicBtn.classList.remove('visible');
    switchToSantrollerBtn.classList.remove('visible');
    switchToClassicBtn.disabled = false;
    switchToSantrollerBtn.disabled = false;
    
    if (!deviceType) {
        // No device connected - disable all
        return;
    }
    
    if (deviceType === 'classic') {
        // Classic firmware - show "Switch to Santroller" button only
        switchToSantrollerBtn.classList.add('visible');
    } else if (deviceType === 'santroller') {
        // Santroller firmware - show "Switch to Classic" button only
        switchToClassicBtn.classList.add('visible');
    } else if (deviceType === 'bootsel') {
        // BOOTSEL mode - show both buttons
        switchToClassicBtn.classList.add('visible');
        switchToSantrollerBtn.classList.add('visible');
    }
}

switchToClassicBtn.addEventListener('click', async () => {
    await flashFirmware('classic');
});

switchToSantrollerBtn.addEventListener('click', async () => {
    await flashFirmware('santroller');
});

async function flashFirmware(targetFirmware) {
    if (!currentDevice) return;
    
    switchToClassicBtn.disabled = true;
    switchToSantrollerBtn.disabled = true;
    progress.classList.add('visible');
    updateProgress(10, 'Starting...');

    try {
        // Direct flash if BOOTSEL
        if (currentDevice.type === 'bootsel') {
            // Determine firmware name based on target and hardware version
            const firmwareName = `${targetFirmware === 'classic' ? 'Classic' : 'Santroller'}-${hardwareVersion}`;
            const firmwareUrl = FIRMWARE_URLS[firmwareName];
            
            console.log('[FLASH] Target firmware:', targetFirmware);
            console.log('[FLASH] Hardware version:', hardwareVersion);
            console.log('[FLASH] Firmware name:', firmwareName);
            console.log('[FLASH] Firmware URL:', firmwareUrl);
            
            updateProgress(30, 'Writing hardware version flag...');
            
            // Write hardware_version.txt to persist across firmware changes
            try {
                await window.electronAPI.writeHardwareVersion(currentDevice.path, hardwareVersion);
                console.log('[FLASH] ✓ Hardware version flag written');
            } catch (e) {
                console.warn('[FLASH] Could not write hardware version flag:', e.message);
            }
            
            updateProgress(50, 'Copying firmware...');
            await window.electronAPI.flashToBootsel(
                firmwareName,
                firmwareUrl,
                currentDevice.path
            );
            updateProgress(100, 'Complete!');
            setTimeout(reset, 2000);
            return;
        }

        // Reboot device first, then determine firmware variant
        updateProgress(20, 'Reading hardware configuration...');
        
        // For Classic, read config to get hardware version (already done in detect)
        if (currentDevice.type === 'classic') {
            try {
                const configResult = await window.electronAPI.readClassicConfig(currentDevice.path);
                if (configResult.success) {
                    hardwareVersion = configResult.version;
                    console.log('[FLASH] ✓ Hardware version confirmed:', hardwareVersion);
                }
            } catch (e) {
                console.warn('[FLASH] Could not re-read config:', e.message);
            }
        }
        
        updateProgress(30, 'Rebooting device...');
        console.log('[FLASH] Device type:', currentDevice.type);
        console.log('[FLASH] Device path:', currentDevice.path);
        
        if (currentDevice.type === 'santroller') {
            console.log('[FLASH] Calling Santroller USB reboot...');
            await window.electronAPI.resetSantrollerHID(currentDevice.path);
            
            // After reboot, wait for BOOTSEL and read hardware version before flashing
            console.log('[FLASH] Waiting for BOOTSEL to read hardware version...');
            updateProgress(50, 'Waiting for bootloader...');
            
            // Use new API that waits for BOOTSEL, reads version, then flashes
            await window.electronAPI.startFlashWithVersionDetection(targetFirmware);
        } else if (currentDevice.type === 'classic') {
            console.log('[FLASH] Calling Classic serial reboot...');
            await window.electronAPI.resetClassicSerial(currentDevice.path);
            
            // For Classic, we already know the version, so flash directly
            updateProgress(50, 'Waiting for bootloader...');
            const firmwareName = `${targetFirmware === 'classic' ? 'Classic' : 'Santroller'}-${hardwareVersion}`;
            const firmwareUrl = FIRMWARE_URLS[firmwareName];
            
            console.log('[FLASH] Firmware name:', firmwareName);
            console.log('[FLASH] Firmware URL:', firmwareUrl);
            
            await window.electronAPI.startFlash(firmwareName, firmwareUrl);
        } else {
            throw new Error(`Unknown device type: ${currentDevice.type}`);
        }

        updateProgress(100, 'Complete!');
        setTimeout(reset, 2000);
    } catch (error) {
        console.error('[FLASH] Error:', error);
        progressText.textContent = 'Failed: ' + error.message;
        switchToClassicBtn.disabled = false;
        switchToSantrollerBtn.disabled = false;
    }
}

window.electronAPI.onFlashProgress((p) => {
    if (p.status === 'waiting') updateProgress(55, p.message);
    if (p.status === 'flashing') updateProgress(75, p.message);
    if (p.status === 'complete') updateProgress(100, 'Complete!');
});

// Listen for HID debug messages from main process
if (window.electronAPI.onHIDDebug) {
    window.electronAPI.onHIDDebug((message) => {
        console.log(message);
    });
}

// Listen for Serial debug messages from main process
if (window.electronAPI.onSerialDebug) {
    window.electronAPI.onSerialDebug((message) => {
        console.log(message);
    });
}

function updateProgress(percent, text) {
    progressFill.style.width = `${percent}%`;
    progressText.textContent = text;
}

function reset() {
    progress.classList.remove('visible');
    switchToClassicBtn.disabled = false;
    switchToSantrollerBtn.disabled = false;
    setTimeout(detectDevice, 3000);
}

detectDevice();
setInterval(detectDevice, 3000);
