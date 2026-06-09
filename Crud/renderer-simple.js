// Firmware URLs
const FIRMWARE_URLS = {
    'Classic1': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Classic1.uf2',
    'Classic2': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Classic2.uf2',
    'Santroller': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Guitar.uf2'
};

// State
let currentDevice = null;
let selectedFirmware = null;

// UI Elements
const deviceStatus = document.getElementById('deviceStatus');
const currentFirmware = document.getElementById('currentFirmware');
const firmwareCards = document.querySelectorAll('.firmware-card');
const flashBtn = document.getElementById('flashBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const log = document.getElementById('log');

// Auto-detect devices on startup
async function detectDevice() {
    try {
        // Check for BOOTSEL mode FIRST (highest priority - device has no firmware)
        const bootselResult = await window.electronAPI.detectBootsel();
        if (bootselResult.found) {
            currentDevice = {
                type: 'bootsel',
                path: bootselResult.path,
                product: 'RP2040 Bootloader',
                bootselPath: bootselResult.path
            };
            deviceStatus.textContent = 'BOOTSEL Mode (No Firmware)';
            deviceStatus.classList.remove('disconnected');
            deviceStatus.classList.add('connected');
            currentFirmware.textContent = 'None (Ready to Flash)';
            logMessage('✓ Device in BOOTSEL mode detected - ready for firmware installation', 'success');
            return;
        }
        
        // Check for Santroller (VID 0x1209)
        const hidDevices = await window.electronAPI.listHIDDevices();
        if (hidDevices.length > 0) {
            const device = hidDevices[0];
            currentDevice = {
                type: 'santroller',
                path: device.path,
                product: device.product || 'Santroller',
                vid: device.vendorId,
                pid: device.productId
            };
            deviceStatus.textContent = `${currentDevice.product} Connected`;
            deviceStatus.classList.remove('disconnected');
            deviceStatus.classList.add('connected');
            currentFirmware.textContent = 'Santroller';
            logMessage('✓ Santroller device detected and connected', 'success');
            return;
        }

        // Check for Classic (VID 0x6997)
        const serialPorts = await window.electronAPI.listSerialPorts();
        const classicPort = serialPorts.find(p => p.vendorId === '0x6997');
        if (classicPort) {
            currentDevice = {
                type: 'classic',
                path: classicPort.path,
                product: 'Classic Controller',
                vid: classicPort.vendorId,
                pid: classicPort.productId
            };
            deviceStatus.textContent = 'Classic Controller Connected';
            deviceStatus.classList.remove('connected');
            deviceStatus.classList.add('connected');
            currentFirmware.textContent = 'Classic';
            logMessage('✓ Classic device detected and connected', 'success');
            return;
        }

        // No device found
        deviceStatus.textContent = 'No device detected';
        deviceStatus.classList.remove('connected');
        deviceStatus.classList.add('disconnected');
        currentFirmware.textContent = 'Unknown';
    } catch (error) {
        console.error('Device detection error:', error);
        logMessage(`Detection error: ${error.message}`, 'error');
    }
}

// Firmware card selection
firmwareCards.forEach(card => {
    card.addEventListener('click', () => {
        firmwareCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedFirmware = card.dataset.firmware;
        
        if (currentDevice) {
            flashBtn.disabled = false;
            flashBtn.textContent = `Flash ${selectedFirmware} Firmware`;
        } else {
            flashBtn.disabled = true;
            flashBtn.textContent = 'No device detected';
        }
    });
});

// Flash button
flashBtn.addEventListener('click', async () => {
    if (!currentDevice || !selectedFirmware) return;

    const confirmed = confirm(`Flash ${selectedFirmware} firmware to ${currentDevice.product}?\n\nThe device will automatically reboot and update.`);
    if (!confirmed) return;

    flashBtn.disabled = true;
    progressSection.classList.add('visible');
    log.innerHTML = '';
    
    try {
        logMessage('Starting flash process...', 'info');
        updateProgress(10, 'Preparing firmware...');

        // If device is already in BOOTSEL mode, flash directly without rebooting
        if (currentDevice.type === 'bootsel') {
            logMessage('Device already in BOOTSEL mode - flashing directly...', 'info');
            updateProgress(50, 'Copying firmware to BOOTSEL device...');
            
            const result = await window.electronAPI.flashToBootsel(
                selectedFirmware,
                FIRMWARE_URLS[selectedFirmware],
                currentDevice.bootselPath
            );
            
            if (result.success) {
                updateProgress(100, 'Flash complete!');
                logMessage('✅ Firmware flashed successfully!', 'success');
                logMessage('Device is rebooting with new firmware...', 'info');
                
                // Reset UI after success
                setTimeout(() => {
                    progressSection.classList.remove('visible');
                    flashBtn.disabled = false;
                    firmwareCards.forEach(c => c.classList.remove('selected'));
                    selectedFirmware = null;
                    flashBtn.textContent = 'Select firmware to flash';
                    
                    // Re-detect device after a delay
                    setTimeout(detectDevice, 5000);
                }, 3000);
            }
            return;
        }

        // Device has firmware - need to reboot it first
        // Send appropriate reboot command
        if (currentDevice.type === 'santroller') {
            logMessage('Sending USB control transfer to Santroller device...', 'info');
            await window.electronAPI.resetSantrollerHID(currentDevice.path);
            logMessage('✓ Reboot command sent successfully', 'success');
        } else {
            logMessage('Sending serial reset to Classic device...', 'info');
            await window.electronAPI.resetClassicSerial(currentDevice.path);
            logMessage('✓ Reset command sent successfully', 'success');
        }

        updateProgress(40, 'Device rebooting into BOOTSEL mode...');
        await sleep(2000);

        updateProgress(50, 'Waiting for BOOTSEL volume...');
        
        // Start flash process
        const result = await window.electronAPI.startFlash(
            selectedFirmware,
            FIRMWARE_URLS[selectedFirmware]
        );

        if (result.success) {
            updateProgress(100, 'Flash complete!');
            logMessage('✅ Firmware flashed successfully!', 'success');
            logMessage('Device is rebooting with new firmware...', 'info');
            
            // Reset UI after success
            setTimeout(() => {
                progressSection.classList.remove('visible');
                flashBtn.disabled = false;
                firmwareCards.forEach(c => c.classList.remove('selected'));
                selectedFirmware = null;
                flashBtn.textContent = 'Select firmware to flash';
                
                // Re-detect device after a delay
                setTimeout(detectDevice, 5000);
            }, 3000);
        }
    } catch (error) {
        logMessage(`❌ Flash failed: ${error.message}`, 'error');
        updateProgress(0, 'Flash failed');
        flashBtn.disabled = false;
    }
});

// Listen for flash progress updates
window.electronAPI.onFlashProgress((progress) => {
    if (progress.status === 'waiting') {
        updateProgress(55, progress.message);
        logMessage(progress.message, 'info');
    } else if (progress.status === 'flashing') {
        updateProgress(75, progress.message);
        logMessage(progress.message, 'info');
    } else if (progress.status === 'complete') {
        updateProgress(95, progress.message);
        logMessage(progress.message, 'success');
    } else if (progress.status === 'error') {
        logMessage(progress.message, 'error');
    }
});

// Helper functions
function updateProgress(percent, message) {
    progressFill.style.width = `${percent}%`;
    progressText.textContent = message;
}

function logMessage(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
    console.log(`[${type.toUpperCase()}]`, message);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Auto-detect device on startup and every 3 seconds
detectDevice();
setInterval(detectDevice, 3000);

logMessage('Firmware Flasher ready', 'success');
logMessage('Auto-detecting devices...', 'info');
