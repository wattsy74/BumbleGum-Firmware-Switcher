// Firmware URLs
const FIRMWARE_URLS = {
    'Classic1': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Classic1.uf2',
    'Classic2': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Classic2.uf2',
    'Santroller': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Guitar.uf2'
};

// State
let currentConnection = null; // { type: 'serial'|'hid', path: string }
let selectedFirmware = null;

function updateFlashButtonState() {
    const canFlash = Boolean(currentConnection && selectedFirmware);
    flashBtn.disabled = !canFlash;
    flashBtn.textContent = canFlash ? `Flash ${selectedFirmware} Firmware` : 'Select Firmware to Flash';
}

// UI Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const classicTab = document.getElementById('classic-tab');
const santrollerTab = document.getElementById('santroller-tab');

const refreshSerial = document.getElementById('refreshSerial');
const serialPortList = document.getElementById('serialPortList');
const connectSerial = document.getElementById('connectSerial');

const refreshHID = document.getElementById('refreshHID');
const hidDeviceList = document.getElementById('hidDeviceList');
const connectHID = document.getElementById('connectHID');

const deviceInfo = document.getElementById('deviceInfo');
const deviceStatus = document.getElementById('deviceStatus');
const deviceFirmware = document.getElementById('deviceFirmware');
const disconnectBtn = document.getElementById('disconnect');

const firmwareCards = document.querySelectorAll('.firmware-card');
const flashBtn = document.getElementById('flashBtn');

const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressLog = document.getElementById('progressLog');

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show corresponding content
        if (tab === 'classic') {
            classicTab.classList.remove('hidden');
            santrollerTab.classList.add('hidden');
        } else {
            classicTab.classList.add('hidden');
            santrollerTab.classList.remove('hidden');
        }
    });
});

async function doRefreshSerial() {
    refreshSerial.disabled = true;
    refreshSerial.textContent = '⏳ Refreshing...';
    
    try {
        const ports = await window.electronAPI.listSerialPorts();
        serialPortList.innerHTML = '<option value="">Select serial port...</option>';
        
        // Filter out Bluetooth and debug ports
        const filteredPorts = ports.filter(p =>
            !p.path.includes('Bluetooth') &&
            !p.path.includes('debug')
        );
        
        filteredPorts.forEach(port => {
            const option = document.createElement('option');
            option.value = port.path;
            option.textContent = `${port.path} ${port.manufacturer ? `(${port.manufacturer})` : ''}`;
            serialPortList.appendChild(option);
        });
        
        logMessage(`Found ${filteredPorts.length} serial port(s)`, 'info');
    } catch (error) {
        logMessage(`Error listing serial ports: ${error.message}`, 'error');
    } finally {
        refreshSerial.disabled = false;
        refreshSerial.textContent = '🔄 Refresh Serial Ports';
    }
}

// Refresh serial ports
refreshSerial.addEventListener('click', async () => {
    await doRefreshSerial();
});

async function doRefreshHID() {
    refreshHID.disabled = true;
    refreshHID.textContent = '⏳ Refreshing...';
    
    try {
        const devices = await window.electronAPI.listHIDDevices();
        hidDeviceList.innerHTML = '<option value="">Select Santroller device...</option>';
        
        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.path;
            option.textContent = `${device.product || 'Santroller Device'} (${device.serialNumber || 'Unknown'})`;
            hidDeviceList.appendChild(option);
        });
        
        logMessage(`Found ${devices.length} Santroller device(s)`, 'info');
    } catch (error) {
        logMessage(`Error listing HID devices: ${error.message}`, 'error');
    } finally {
        refreshHID.disabled = false;
        refreshHID.textContent = '🔄 Refresh HID Devices';
    }
}

// Refresh HID devices
refreshHID.addEventListener('click', async () => {
    await doRefreshHID();
});

// Enable connect buttons when selection changes
serialPortList.addEventListener('change', () => {
    connectSerial.disabled = !serialPortList.value;
});

hidDeviceList.addEventListener('change', () => {
    connectHID.disabled = !hidDeviceList.value;
});

// Connect via Serial (Classic firmware)
connectSerial.addEventListener('click', async () => {
    const portPath = serialPortList.value;
    if (!portPath) return;
    
    connectSerial.disabled = true;
    connectSerial.textContent = '⏳ Connecting...';
    
    try {
        await window.electronAPI.connectSerial(portPath);
        
        currentConnection = {
            type: 'serial',
            path: portPath
        };
        
        deviceStatus.textContent = '✅ Connected (Classic firmware)';
        deviceFirmware.textContent = `Classic firmware via ${portPath}`;
        deviceInfo.classList.remove('hidden');
        updateFlashButtonState();
        
        logMessage(`Connected to Classic device via ${portPath}`, 'success');
    } catch (error) {
        logMessage(`Connection error: ${error.message}`, 'error');
        alert(`Failed to connect: ${error.message}`);
    } finally {
        connectSerial.disabled = false;
        connectSerial.textContent = 'Connect via Serial';
    }
});

// Connect via HID (Santroller firmware)
connectHID.addEventListener('click', async () => {
    const devicePath = hidDeviceList.value;
    if (!devicePath) return;
    
    connectHID.disabled = true;
    connectHID.textContent = '⏳ Connecting...';
    
    try {
        currentConnection = {
            type: 'hid',
            path: devicePath
        };
        
        deviceStatus.textContent = '✅ Connected (Santroller firmware)';
        deviceFirmware.textContent = 'Santroller firmware - Auto-reset available!';
        deviceInfo.classList.remove('hidden');
        updateFlashButtonState();
        
        logMessage('Connected to Santroller device via HID', 'success');
    } catch (error) {
        logMessage(`Connection error: ${error.message}`, 'error');
        alert(`Failed to connect: ${error.message}`);
    } finally {
        connectHID.disabled = false;
        connectHID.textContent = 'Connect via HID';
    }
});

// Disconnect
disconnectBtn.addEventListener('click', () => {
    currentConnection = null;
    deviceInfo.classList.add('hidden');
    updateFlashButtonState();
    logMessage('Disconnected from device', 'info');
});

// Firmware selection
firmwareCards.forEach(card => {
    card.addEventListener('click', () => {
        firmwareCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedFirmware = card.dataset.firmware;
        updateFlashButtonState();
        
        logMessage(`Selected ${selectedFirmware} firmware`, 'info');
    });
});

// Flash firmware
flashBtn.addEventListener('click', async () => {
    if (!currentConnection || !selectedFirmware) return;
    
    // Confirm action
    const confirmed = confirm(`Flash ${selectedFirmware} firmware to the device?\n\nThe device will automatically reboot into BOOTSEL mode and update.`);
    if (!confirmed) return;
    
    flashBtn.disabled = true;
    flashBtn.textContent = '⏳ Flashing...';
    progressSection.classList.remove('hidden');
    progressLog.innerHTML = '';
    
    try {
        logMessage('Starting flash process...', 'info');
        
        // Send reset command
        if (currentConnection.type === 'serial') {
            logMessage('Sending serial reset command to Classic firmware...', 'info');
            await window.electronAPI.resetClassicSerial(currentConnection.path);
            logMessage('Reset command sent! Device entering BOOTSEL mode...', 'success');
        } else {
            logMessage('Sending HID reboot command to Santroller firmware...', 'info');
            try {
                await window.electronAPI.resetSantrollerHID(currentConnection.path);
                logMessage('Reboot command sent! Device entering BOOTSEL mode...', 'success');
            } catch (hidError) {
                const msg = String(hidError && hidError.message ? hidError.message : hidError);
                const unsupported = msg.includes('did not disconnect') || msg.includes('No HID reboot report could be sent');

                if (!unsupported) {
                    throw hidError;
                }

                logMessage('⚠️ Automatic HID reboot not supported by current Santroller mode/profile.', 'error');
                logMessage('Fallback: trigger reboot from official Santroller app, then this app will flash automatically.', 'info');

                const proceed = confirm(
                    'Automatic HID reboot is not available in the current Santroller mode.\n\n' +
                    'Click OK, then in the official Santroller app trigger "Reboot/Bootloader".\n' +
                    'This flasher will wait up to 120 seconds for BOOTSEL and continue automatically.'
                );

                if (!proceed) {
                    throw new Error('Cancelled fallback reboot workflow.');
                }
            }
        }
        
        updateProgress(30, 'Device rebooting into BOOTSEL mode...');
        
        // Wait a moment for device to reset
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        updateProgress(40, 'Waiting for BOOTSEL volume...');
        
        // Start flash process
        const result = await window.electronAPI.startFlash(
            selectedFirmware,
            FIRMWARE_URLS[selectedFirmware]
        );
        
        if (result.success) {
            updateProgress(100, 'Flash complete!');
            logMessage('✅ Firmware flashed successfully!', 'success');
            alert('Firmware flashed successfully! Device is rebooting with new firmware.');
            
            // Reset state
            currentConnection = null;
            deviceInfo.classList.add('hidden');
            firmwareCards.forEach(c => c.classList.remove('selected'));
            selectedFirmware = null;
            updateFlashButtonState();
        }
    } catch (error) {
        logMessage(`❌ Flash failed: ${error.message}`, 'error');
        alert(`Flash failed: ${error.message}`);
        updateProgress(0, 'Flash failed');
    } finally {
        flashBtn.disabled = false;
        flashBtn.textContent = 'Select Firmware to Flash';
    }
});

// Listen for flash progress updates
window.electronAPI.onFlashProgress((progress) => {
    if (progress.status === 'waiting') {
        updateProgress(50, progress.message);
        logMessage(progress.message, 'info');
    } else if (progress.status === 'flashing') {
        updateProgress(70, progress.message);
        logMessage(progress.message, 'info');
    } else if (progress.status === 'complete') {
        updateProgress(100, progress.message);
        logMessage(progress.message, 'success');
    } else if (progress.status === 'error') {
        logMessage(progress.message, 'error');
    }
});

// Listen for HID debug messages
window.electronAPI.onHIDDebug((message) => {
    console.log(message);
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
    progressLog.appendChild(entry);
    progressLog.scrollTop = progressLog.scrollHeight;
    
    console.log(`[${type.toUpperCase()}]`, message);
}

async function initRenderer() {
    if (!window.electronAPI) {
        logMessage('Initialization failed: preload bridge (window.electronAPI) is unavailable.', 'error');
        alert('Initialization failed: electron preload bridge is unavailable. Please restart the app.');
        return;
    }

    updateFlashButtonState();

    try {
        logMessage('Initializing device discovery...', 'info');
        await Promise.all([doRefreshSerial(), doRefreshHID()]);
        logMessage('Initialization complete.', 'success');
    } catch (error) {
        logMessage(`Initialization warning: ${error.message || error}`, 'error');
    }
}

initRenderer();
