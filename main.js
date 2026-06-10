const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const { SerialPort } = require('serialport');
const HID = require('node-hid');
const usb = require('usb');

const SANTROLLER_REPORT_IDS = {
    CONFIG: 0x22,
    CONFIG_INFO: 0x23,
    LOADED: 0x24,
    KEEPALIVE: 0x25,
    BOOTLOADER: 0x26,
    COMMAND: 0x27,
    GET_ACTIVE_PROFILES: 0x28,
    GET_VERSION: 0x29,
    GET_TYPE: 0x2A
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function uniq(arr) {
    return [...new Set(arr)];
}

let mainWindow;
let flashWatcher = null;

// Create cache directory
const CACHE_DIR = path.join(os.homedir(), '.firmware-flasher-cache');
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const HARDWARE_VERSION_CACHE_FILE = path.join(CACHE_DIR, 'hardware-version.json');

function normalizeHardwareVersion(version) {
    return version === 'v1' || version === 'v2' ? version : null;
}

function readCachedHardwareVersion() {
    try {
        if (!fs.existsSync(HARDWARE_VERSION_CACHE_FILE)) {
            return null;
        }

        const raw = fs.readFileSync(HARDWARE_VERSION_CACHE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.version !== 'string') {
            return null;
        }

        return {
            version: normalizeHardwareVersion(parsed.version),
            source: parsed.source || 'cache',
            updatedAt: parsed.updatedAt || null
        };
    } catch (error) {
        console.warn('[VERSION] Could not read cached hardware version:', error.message);
        return null;
    }
}

function writeCachedHardwareVersion(version, source) {
    const normalized = normalizeHardwareVersion(version);
    try {
        const payload = {
            version: normalized,
            source,
            updatedAt: new Date().toISOString()
        };
        fs.writeFileSync(HARDWARE_VERSION_CACHE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
        console.log(`[VERSION] ✓ Cached hardware version ${normalized} (${source})`);
    } catch (error) {
        console.warn('[VERSION] Could not cache hardware version:', error.message);
    }
    return normalized;
}

function readHardwareVersionFromBootselOrCache(bootselPath) {
    const versionFile = path.join(bootselPath, 'hardware_version.txt');
    console.log('[VERSION] Checking for hardware_version.txt at:', versionFile);

    if (fs.existsSync(versionFile)) {
        const fileVersion = normalizeHardwareVersion(fs.readFileSync(versionFile, 'utf-8').trim());
        writeCachedHardwareVersion(fileVersion, 'bootsel-file');
        console.log('[VERSION] ✓ Found hardware version in BOOTSEL file:', fileVersion);
        return { success: true, version: fileVersion, source: 'bootsel-file' };
    }

    const cached = readCachedHardwareVersion();
    if (cached) {
        console.log('[VERSION] ✓ Using cached hardware version:', cached.version);
        return { success: true, version: cached.version, source: 'cache' };
    }

    console.log('[VERSION] ⚠️  No hardware_version.txt and no cache');
    return { success: false, version: null, source: 'unknown' };
}

function parseHardwareVersionFromText(text) {
    if (!text) {
        return null;
    }

    const haystack = String(text).toLowerCase();

    if (
        haystack.includes('guitar v1') ||
        haystack.includes('guitarv1') ||
        haystack.includes('guitar-v1') ||
        /\bv1\b/.test(haystack)
    ) {
        return 'v1';
    }

    if (
        haystack.includes('guitar v2') ||
        haystack.includes('guitarv2') ||
        haystack.includes('guitar-v2') ||
        /\bv2\b/.test(haystack)
    ) {
        return 'v2';
    }

    return null;
}

// Firmware URLs - v1 (pin 23) vs v2 (pin 13) hardware variants
const FIRMWARE_URLS = {
    // Classic firmware variants
    'Classic-v1': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Classic-v1.uf2',
    'Classic-v2': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Classic-v2.uf2',
    
    // Santroller firmware variants
    'Santroller-v1': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Guitarv1.uf2',
    'Santroller-v2': 'https://github.com/wattsy74/BumbleGum-Configurator-Santroller/releases/latest/download/Guitarv2.uf2'
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        title: 'BumbleGum Firmware Switcher',
        resizable: true,
        minimizable: true
    });

    mainWindow.loadFile('index-minimal.html');
    
    // Open DevTools for debugging HID commands
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// List serial ports
ipcMain.handle('list-serial-ports', async () => {
    try {
        const ports = await SerialPort.list();
        return ports.map(port => ({
            path: port.path,
            manufacturer: port.manufacturer,
            serialNumber: port.serialNumber,
            vendorId: port.vendorId,
            productId: port.productId
        }));
    } catch (error) {
        console.error('Error listing serial ports:', error);
        return [];
    }
});

// List HID devices
ipcMain.handle('list-hid-devices', async () => {
    try {
        const devices = HID.devices();
        // Filter for Santroller devices (VID 0x1209)
        return devices.filter(d => d.vendorId === 0x1209).map(d => ({
            vendorId: d.vendorId,
            productId: d.productId,
            path: d.path,
            manufacturer: d.manufacturer,
            product: d.product,
            serialNumber: d.serialNumber,
            inferredHardwareVersion: parseHardwareVersionFromText(d.product)
        }));
    } catch (error) {
        console.error('Error listing HID devices:', error);
        return [];
    }
});

// Detect BOOTSEL volume
ipcMain.handle('detect-bootsel', async () => {
    const platform = process.platform;
    console.log('[BOOTSEL] Detection called, platform:', platform);
    
    if (platform === 'darwin') {
        // macOS
        const volumesDir = '/Volumes';
        try {
            if (fs.existsSync(volumesDir)) {
                const volumes = fs.readdirSync(volumesDir);
                console.log('[BOOTSEL] All volumes:', volumes.join(', '));
                
                for (const volume of volumes) {
                    // Check for RPI-RP2 in various forms
                    const volumeLower = volume.toLowerCase();
                    if (volumeLower.includes('rpi') || volumeLower.includes('bootsel') || volume.includes('RPI-RP2') || volume.includes('RPI_RP2')) {
                        const fullPath = path.join(volumesDir, volume);
                        console.log('[BOOTSEL] ✓ Detected at:', fullPath);
                        return { found: true, path: fullPath };
                    }
                }
                console.log('[BOOTSEL] No BOOTSEL volume found in /Volumes');
            }
        } catch (e) {
            console.error('[BOOTSEL] Error reading /Volumes:', e.message);
        }
    } else if (platform === 'win32') {
        // Windows
        const { execSync } = require('child_process');
        try {
            const output = execSync('wmic logicaldisk get name,volumename', { encoding: 'utf8' });
            const lines = output.split('\n');
            
            for (const line of lines) {
                if (line.includes('RPI-RP2') || line.includes('RPI_RP2')) {
                    const match = line.match(/([A-Z]:)/);
                    if (match) {
                        const drivePath = match[1] + '\\';
                        console.log('[BOOTSEL] Detected at:', drivePath);
                        return { found: true, path: drivePath };
                    }
                }
            }
        } catch (e) {
            console.error('[BOOTSEL] Error detecting Windows volume:', e.message);
        }
    } else {
        // Linux
        const username = os.userInfo().username;
        const mediaPaths = [
            `/media/${username}`,
            '/media',
            `/run/media/${username}`,
            '/run/media',
            '/mnt'
        ];
        
        for (const mediaPath of mediaPaths) {
            try {
                if (fs.existsSync(mediaPath)) {
                    const volumes = fs.readdirSync(mediaPath);
                    
                    for (const volume of volumes) {
                        if (volume.includes('RPI-RP2') || volume.includes('RPI_RP2')) {
                            const fullPath = path.join(mediaPath, volume);
                            console.log('[BOOTSEL] Detected at:', fullPath);
                            return { found: true, path: fullPath };
                        }
                    }
                }
            } catch (e) {
                console.error(`[BOOTSEL] Error reading ${mediaPath}:`, e.message);
            }
        }
    }
    
    return { found: false };
});

// Connect to serial device
ipcMain.handle('connect-serial', async (event, portPath) => {
    try {
        const port = new SerialPort({ path: portPath, baudRate: 115200 });
        
        return new Promise((resolve, reject) => {
            port.on('open', () => {
                // Get port info
                const info = port.path;
                resolve({ success: true, port: info });
                port.close();
            });
            
            port.on('error', (err) => {
                reject(err);
            });
        });
    } catch (error) {
        console.error('Serial connection error:', error);
        throw error;
    }
});

// Send serial reset command to Classic firmware
ipcMain.handle('reset-classic-serial', async (event, portPath) => {
    try {
        logSerial('========================================');
        logSerial('[SERIAL] CLASSIC FIRMWARE REBOOT');
        logSerial('========================================');
        logSerial('[SERIAL] Port path: ' + portPath);
        logSerial('[SERIAL] Opening serial port at 115200 baud...');
        
        const port = new SerialPort({ path: portPath, baudRate: 115200 });
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                logSerial('[SERIAL] ✗ Timeout opening serial port');
                try {
                    port.close();
                } catch (e) {}
                reject(new Error('Timeout opening serial port'));
            }, 5000);
            
            port.on('open', () => {
                clearTimeout(timeout);
                logSerial('[SERIAL] ✓ Serial port opened successfully');
                logSerial('[SERIAL] Sending command: REBOOTBOOTSEL\\n');
                
                port.write('REBOOTBOOTSEL\n', (err) => {
                    if (err) {
                        logSerial('[SERIAL] ✗ Failed to write command: ' + err.message);
                        port.close();
                        reject(err);
                    } else {
                        logSerial('[SERIAL] ✓ Command sent successfully');
                        logSerial('[SERIAL] Waiting 1 second for device to process...');
                        
                        setTimeout(() => {
                            logSerial('[SERIAL] ✓ Closing serial port');
                            port.close();
                            logSerial('[SERIAL] 🎉 Classic device should be entering BOOTSEL mode!');
                            logSerial('========================================\n');
                            resolve({ success: true });
                        }, 1000);
                    }
                });
            });
            
            port.on('error', (err) => {
                clearTimeout(timeout);
                logSerial('[SERIAL] ✗ Serial port error: ' + err.message);
                logSerial('========================================\n');
                reject(err);
            });
        });
    } catch (error) {
        logSerial('[SERIAL] ✗ Exception: ' + error.message);
        logSerial('========================================\n');
        throw error;
    }
});

// Helper to log to both console and renderer
function logHID(message) {
    console.log(message);
    if (mainWindow) {
        mainWindow.webContents.send('hid-debug', message);
    }
}

// Helper to log serial operations to both console and renderer
function logSerial(message) {
    console.log(message);
    if (mainWindow) {
        mainWindow.webContents.send('serial-debug', message);
    }
}

// Send USB control transfer to Santroller firmware to enter bootloader
// Based on Santroller configurator source: dev.ctrl_transfer(0x21, BOOTLOADER)
// where BOOTLOADER = 49 (0x31)
ipcMain.handle('reset-santroller-hid', async (event, devicePath) => {
    try {
        // Get device info from HID path
        const all = HID.devices();
        const selected = all.find(d => d.path === devicePath);
        if (!selected) {
            throw new Error(`Selected HID path not found: ${devicePath}`);
        }

        logHID('========================================');
        logHID('[USB] SANTROLLER USB CONTROL TRANSFER');
        logHID('========================================');
        logHID(`Device: ${selected.product || 'Santroller'}`);
        logHID(`VID:PID: 0x${selected.vendorId.toString(16)}:0x${selected.productId.toString(16)}`);
        logHID('');
        logHID('Using command from Santroller configurator source:');
        logHID('  dev.ctrl_transfer(0x21, BOOTLOADER)');
        logHID('  where BOOTLOADER = 49 (0x31)');
        logHID('========================================\n');

        // Find USB device
        const devices = usb.getDeviceList();
        let usbDevice = null;
        
        for (const device of devices) {
            const desc = device.deviceDescriptor;
            if (desc.idVendor === selected.vendorId && desc.idProduct === selected.productId) {
                usbDevice = device;
                break;
            }
        }

        if (!usbDevice) {
            throw new Error('Could not find USB device. Device may have disconnected.');
        }

        logHID('[USB] Opening USB device...');
        usbDevice.open();
        logHID('[USB] ✓ Device opened');
        logHID('');

        // USB Control Transfer parameters from Santroller source
        const bmRequestType = 0x21;  // Class request, Host-to-Device, Interface
        const bRequest = 49;         // BOOTLOADER constant (0x31 in hex)
        const wValue = 0;
        const wIndex = 0;
        const data = Buffer.alloc(0);  // No data phase

        logHID('[USB] Sending control transfer:');
        logHID(`  bmRequestType: 0x${bmRequestType.toString(16)} (${bmRequestType})`);
        logHID(`  bRequest:      0x${bRequest.toString(16)} (${bRequest}) [BOOTLOADER]`);
        logHID(`  wValue:        ${wValue}`);
        logHID(`  wIndex:        ${wIndex}`);
        logHID(`  data length:   ${data.length}`);
        logHID('');

        return new Promise((resolve, reject) => {
            usbDevice.controlTransfer(
                bmRequestType,
                bRequest,
                wValue,
                wIndex,
                data,
                (error, returnedData) => {
                    // Close device regardless of result
                    try {
                        usbDevice.close();
                    } catch (e) {
                        // Ignore close errors
                    }

                    if (error) {
                        // errno 19 (LIBUSB_ERROR_NO_DEVICE) means device rebooted successfully!
                        if (error.errno === 19 ||
                            (error.message && (
                                error.message.includes('LIBUSB_ERROR_NO_DEVICE') ||
                                error.message.includes('No such device') ||
                                error.message.includes('device is gone')
                            ))) {
                            logHID('[USB] ✓ Control transfer sent!');
                            logHID('[USB] ✓ Device disconnected (errno 19 = device rebooted!)');
                            logHID('');
                            logHID('🎉 SUCCESS! Device is rebooting into BOOTSEL mode!');
                            logHID('   Waiting for RPI-RP2 volume to appear...');
                            logHID('========================================\n');
                            resolve({ success: true });
                        } else {
                            logHID(`[USB] ✗ Control transfer failed: ${error.message}`);
                            logHID(`[USB] Error details: errno=${error.errno}`);
                            logHID('========================================\n');
                            reject(new Error(`USB control transfer failed: ${error.message}`));
                        }
                    } else {
                        logHID('[USB] ✓ Control transfer completed successfully');
                        logHID('');
                        
                        // Check if device disappeared (success indicator)
                        setTimeout(() => {
                            const devicesAfter = usb.getDeviceList();
                            const stillPresent = devicesAfter.some(d => {
                                const desc = d.deviceDescriptor;
                                return desc.idVendor === selected.vendorId && desc.idProduct === selected.productId;
                            });
                            
                            if (!stillPresent) {
                                logHID('[USB] 🎉 Device disconnected - entering BOOTSEL mode!');
                                logHID('========================================\n');
                                resolve({ success: true });
                            } else {
                                logHID('[USB] ⚠️  Device still present after 2 seconds');
                                logHID('[USB] Command may not have worked, or device takes longer to reboot');
                                logHID('========================================\n');
                                resolve({ success: true, warning: 'Device may not have rebooted' });
                            }
                        }, 2000);
                    }
                }
            );
        });
    } catch (error) {
        logHID(`[USB] ERROR: ${error.message}`);
        logHID('========================================\n');
        throw error;
    }
});

// Watch for BOOTSEL and flash firmware
ipcMain.handle('start-flash', async (event, firmware, url) => {
    try {
        console.log(`Starting flash process for ${firmware}`);
        
        // Download firmware if needed
        const firmwarePath = await downloadFirmware(firmware, url);
        
        if (!firmwarePath) {
            throw new Error('Failed to download firmware');
        }
        
        // Start watching for BOOTSEL
        const result = await watchAndFlash(firmwarePath, (progress) => {
            // Send progress updates to renderer
            mainWindow.webContents.send('flash-progress', progress);
        });
        
        return result;
    } catch (error) {
        console.error('Flash error:', error);
        throw error;
    }
});

// Watch for BOOTSEL, read hardware version, then flash appropriate firmware variant
// Used when switching FROM Santroller firmware where we can't read config.json
ipcMain.handle('start-flash-with-version-detection', async (event, targetFirmware, hardwareVersion) => {
    try {
        console.log(`[FLASH] Starting version-detection flash for ${targetFirmware}`);
        
        // Wait for BOOTSEL to appear
        const timeout = 120000;
        const startTime = Date.now();
        
        mainWindow.webContents.send('flash-progress', {
            status: 'waiting',
            message: 'Waiting for BOOTSEL volume...'
        });
        
        // Give device a moment to reboot
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(async () => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                console.log(`[FLASH] Checking for BOOTSEL... (${elapsed}s elapsed)`);
                
                const bootselPath = findBootselVolume();
                
                if (bootselPath) {
                    clearInterval(checkInterval);
                    console.log(`[FLASH] ✓ BOOTSEL detected at: ${bootselPath}`);
                    
                    // Give volume a moment to fully mount
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    try {
                        const normalizedHardwareVersion = normalizeHardwareVersion(hardwareVersion);
                        if (!normalizedHardwareVersion) {
                            throw new Error('Cannot determine hardware version from Santroller device name. Refusing to flash to avoid wrong firmware variant.');
                        }

                        console.log(`[FLASH] Hardware version selected from Santroller name: ${normalizedHardwareVersion}`);
                        
                        // Determine firmware name
                        const firmwareName = `${targetFirmware === 'classic' ? 'Classic' : 'Santroller'}-${normalizedHardwareVersion}`;
                        const firmwareUrl = FIRMWARE_URLS[firmwareName];
                        
                        console.log(`[FLASH] Selected firmware: ${firmwareName}`);
                        console.log(`[FLASH] Firmware URL: ${firmwareUrl}`);
                        
                        mainWindow.webContents.send('flash-progress', {
                            status: 'downloading',
                            message: `Downloading ${firmwareName}...`
                        });
                        
                        // Download firmware
                        const firmwarePath = await downloadFirmware(firmwareName, firmwareUrl);
                        
                        if (!firmwarePath) {
                            throw new Error('Failed to download firmware');
                        }
                        
                        mainWindow.webContents.send('flash-progress', {
                            status: 'flashing',
                            message: 'Copying firmware to device...'
                        });
                        
                        // Copy firmware
                        const destPath = path.join(bootselPath, path.basename(firmwarePath));
                        
                        console.log(`[COPY] Source: ${firmwarePath}`);
                        const sourceStats = fs.statSync(firmwarePath);
                        console.log(`[COPY] Source size: ${sourceStats.size} bytes`);
                        console.log(`[COPY] Destination: ${destPath}`);
                        
                        fs.copyFileSync(firmwarePath, destPath);
                        
                        const destStats = fs.statSync(destPath);
                        console.log(`[COPY] Copied ${destStats.size} bytes`);
                        
                        if (destStats.size === 0) {
                            throw new Error('Copied file is 0 bytes - copy failed');
                        }
                        
                        // Sync on Unix systems
                        if (process.platform !== 'win32') {
                            try {
                                console.log('[SYNC] Syncing filesystem...');
                                require('child_process').execSync('sync');
                                console.log('[SYNC] ✓ Sync complete');
                            } catch (e) {
                                console.warn('[SYNC] Sync warning:', e.message);
                            }
                        }
                        
                        mainWindow.webContents.send('flash-progress', {
                            status: 'complete',
                            message: 'Flash complete!'
                        });
                        
                        console.log('[FLASH] ✓✓✓ Flash complete!');
                        resolve({ success: true });
                        
                    } catch (error) {
                        console.error('[FLASH] Error during flash process:', error);
                        mainWindow.webContents.send('flash-progress', {
                            status: 'error',
                            message: error.message
                        });
                        reject(error);
                    }
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    console.error('[FLASH] ✗ Timeout waiting for BOOTSEL volume');
                    const error = new Error('Timeout waiting for BOOTSEL volume. Make sure device entered BOOTSEL mode.');
                    mainWindow.webContents.send('flash-progress', {
                        status: 'error',
                        message: error.message
                    });
                    reject(error);
                }
            }, 1000); // Check every 1 second
        });
    } catch (error) {
        console.error('[FLASH] Error in version-detection flash:', error);
        throw error;
    }
});

// Flash directly to BOOTSEL (device already in bootloader mode)
ipcMain.handle('flash-to-bootsel', async (event, firmware, url, bootselPath) => {
    try {
        console.log(`Direct flash to BOOTSEL for ${firmware}`);
        
        // Download firmware if needed
        const firmwarePath = await downloadFirmware(firmware, url);
        
        if (!firmwarePath) {
            throw new Error('Failed to download firmware');
        }
        
        mainWindow.webContents.send('flash-progress', {
            status: 'flashing',
            message: 'Copying firmware to BOOTSEL device...'
        });
        
        // Copy directly
        const destPath = path.join(bootselPath, path.basename(firmwarePath));
        
        console.log(`[COPY] Source: ${firmwarePath}`);
        const sourceStats = fs.statSync(firmwarePath);
        console.log(`[COPY] Source size: ${sourceStats.size} bytes`);
        console.log(`[COPY] Destination: ${destPath}`);
        
        fs.copyFileSync(firmwarePath, destPath);
        
        const destStats = fs.statSync(destPath);
        console.log(`[COPY] Copied ${destStats.size} bytes`);
        
        if (destStats.size === 0) {
            throw new Error('Copied file is 0 bytes - copy failed');
        }
        
        if (destStats.size !== sourceStats.size) {
            console.warn(`[COPY] ⚠️  Size mismatch! Source: ${sourceStats.size}, Dest: ${destStats.size}`);
        } else {
            console.log(`[COPY] ✓ File size verified: ${destStats.size} bytes`);
        }
        
        // Sync on Unix systems
        if (process.platform !== 'win32') {
            try {
                console.log('[SYNC] Syncing filesystem...');
                require('child_process').execSync('sync');
                console.log('[SYNC] ✓ Sync complete');
            } catch (e) {
                console.warn('[SYNC] Sync failed (non-fatal):', e.message);
            }
        }
        
        mainWindow.webContents.send('flash-progress', {
            status: 'complete',
            message: 'Flash complete!'
        });
        
        console.log('[FLASH] ✓✓✓ Direct flash complete!');
        return { success: true };
        
    } catch (error) {
        console.error('Direct flash error:', error);
        mainWindow.webContents.send('flash-progress', {
            status: 'error',
            message: error.message
        });
        throw error;
    }
});

// Download firmware file
async function downloadFirmware(firmware, url) {
    const cacheFile = path.join(CACHE_DIR, `${firmware}.uf2`);
    
    // Check cache
    if (fs.existsSync(cacheFile)) {
        const stats = fs.statSync(cacheFile);
        const age = Date.now() - stats.mtimeMs;
        
        // Use cached file if less than 24 hours old and size > 0
        if (age < 86400000 && stats.size > 0) {
            console.log(`Using cached firmware: ${cacheFile} (${stats.size} bytes)`);
            return cacheFile;
        } else {
            console.log(`Cache expired or invalid, re-downloading...`);
            try {
                fs.unlinkSync(cacheFile);
            } catch (e) {}
        }
    }
    
    console.log(`Downloading firmware from ${url}`);
    
    return new Promise((resolve, reject) => {
        const doDownload = (downloadUrl, attempt = 1) => {
            console.log(`[DOWNLOAD] Attempt ${attempt}: ${downloadUrl}`);
            
            https.get(downloadUrl, (response) => {
                console.log(`[DOWNLOAD] Response status: ${response.statusCode}`);
                
                // Handle redirects
                if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
                    const redirectUrl = response.headers.location;
                    console.log(`[DOWNLOAD] Redirecting to: ${redirectUrl}`);
                    
                    if (attempt > 5) {
                        reject(new Error('Too many redirects'));
                        return;
                    }
                    
                    // Follow redirect
                    doDownload(redirectUrl, attempt + 1);
                    return;
                }
                
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }
                
                // Download the file
                const file = fs.createWriteStream(cacheFile);
                let downloadedBytes = 0;
                
                response.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                });
                
                response.pipe(file);
                
                file.on('finish', () => {
                    file.end();
                    
                    // Wait a moment for file to be fully closed
                    setTimeout(() => {
                        try {
                            const stats = fs.statSync(cacheFile);
                            console.log(`[DOWNLOAD] ✓ Downloaded ${stats.size} bytes to ${cacheFile}`);
                            
                            if (stats.size === 0) {
                                try {
                                    fs.unlinkSync(cacheFile);
                                } catch (e) {}
                                reject(new Error(`Downloaded file is 0 bytes. Downloaded ${downloadedBytes} bytes from stream but file is empty.`));
                            } else if (stats.size < 10000) {
                                // UF2 files are typically > 100KB, if < 10KB something is wrong
                                console.warn(`[DOWNLOAD] ⚠️  File size suspiciously small: ${stats.size} bytes`);
                                try {
                                    fs.unlinkSync(cacheFile);
                                } catch (e) {}
                                reject(new Error(`Downloaded file is too small (${stats.size} bytes). Expected firmware file.`));
                            } else {
                                resolve(cacheFile);
                            }
                        } catch (error) {
                            reject(new Error(`Error checking downloaded file: ${error.message}`));
                        }
                    }, 100);
                });
                
                file.on('error', (err) => {
                    console.error(`[DOWNLOAD] File write error:`, err);
                    try {
                        fs.unlinkSync(cacheFile);
                    } catch (e) {}
                    reject(err);
                });
                
            }).on('error', (err) => {
                console.error(`[DOWNLOAD] Request error:`, err);
                try {
                    fs.unlinkSync(cacheFile);
                } catch (e) {}
                reject(err);
            });
        };
        
        // Start download
        doDownload(url);
    });
}

// Watch for BOOTSEL volume and flash firmware
async function watchAndFlash(firmwarePath, progressCallback) {
    const platform = process.platform;
    const timeout = 120000; // Allow extra time for fallback reboot via Santroller app
    const startTime = Date.now();
    
    console.log('[WATCH] Starting BOOTSEL detection...');
    console.log('[WATCH] Platform:', platform);
    console.log('[WATCH] Timeout:', timeout / 1000, 'seconds');
    
    progressCallback({ status: 'waiting', message: 'Waiting for BOOTSEL volume...' });
    
    // Give device a moment to reboot after HID command
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            console.log(`[WATCH] Checking for BOOTSEL... (${elapsed}s elapsed)`);
            
            const bootselPath = findBootselVolume();
            
            if (bootselPath) {
                clearInterval(checkInterval);
                console.log(`[FLASH] ✓ BOOTSEL detected at: ${bootselPath}`);
                
                // Give volume a moment to fully mount
                setTimeout(() => {
                    progressCallback({ status: 'flashing', message: 'Copying firmware to device...' });
                    
                    // Copy firmware
                    const destPath = path.join(bootselPath, path.basename(firmwarePath));
                    
                    try {
                        console.log(`[COPY] Copying ${firmwarePath} to ${destPath}`);
                        fs.copyFileSync(firmwarePath, destPath);
                        console.log(`[COPY] ✓ Firmware copied successfully`);
                        
                        // Sync on Unix systems
                        if (platform !== 'win32') {
                            try {
                                console.log('[SYNC] Syncing filesystem...');
                                require('child_process').execSync('sync');
                                console.log('[SYNC] ✓ Sync complete');
                            } catch (e) {
                                console.warn('[SYNC] Sync failed (non-fatal):', e.message);
                            }
                        }
                        
                        progressCallback({ status: 'complete', message: 'Flash complete!' });
                        console.log('[FLASH] ✓✓✓ Flash complete!');
                        resolve({ success: true });
                    } catch (error) {
                        console.error('[COPY] ✗ Copy failed:', error);
                        progressCallback({ status: 'error', message: error.message });
                        reject(error);
                    }
                }, 1000); // Wait 1 second for volume to fully mount
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                console.error('[WATCH] ✗ Timeout waiting for BOOTSEL volume');
                console.error('[WATCH] Checked for', Math.floor(timeout / 1000), 'seconds');
                const error = new Error('Timeout waiting for BOOTSEL volume. Make sure device entered BOOTSEL mode.');
                progressCallback({ status: 'error', message: error.message });
                reject(error);
            }
        }, 1000); // Check every 1 second
    });
}

// Find BOOTSEL volume
function findBootselVolume() {
    const platform = process.platform;
    
    if (platform === 'darwin') {
        // macOS
        const volumesDir = '/Volumes';
        try {
            if (fs.existsSync(volumesDir)) {
                const volumes = fs.readdirSync(volumesDir);
                console.log('[DETECT] macOS volumes:', volumes.join(', '));
                
                for (const volume of volumes) {
                    if (volume.includes('RPI-RP2') || volume.includes('RPI_RP2')) {
                        const fullPath = path.join(volumesDir, volume);
                        console.log('[DETECT] ✓ Found BOOTSEL:', fullPath);
                        return fullPath;
                    }
                }
            }
        } catch (e) {
            console.error('[DETECT] Error reading /Volumes:', e.message);
        }
    } else if (platform === 'win32') {
        // Windows
        const { execSync } = require('child_process');
        try {
            const output = execSync('wmic logicaldisk get name,volumename', { encoding: 'utf8' });
            const lines = output.split('\n');
            
            console.log('[DETECT] Windows volumes:', output);
            
            for (const line of lines) {
                if (line.includes('RPI-RP2') || line.includes('RPI_RP2')) {
                    const match = line.match(/([A-Z]:)/);
                    if (match) {
                        const drivePath = match[1] + '\\';
                        console.log('[DETECT] ✓ Found BOOTSEL:', drivePath);
                        return drivePath;
                    }
                }
            }
        } catch (e) {
            console.error('[DETECT] Error detecting Windows volume:', e.message);
        }
    } else {
        // Linux
        const username = os.userInfo().username;
        const mediaPaths = [
            `/media/${username}`,
            '/media',
            `/run/media/${username}`,
            '/run/media',
            '/mnt'
        ];
        
        console.log('[DETECT] Checking Linux paths:', mediaPaths.join(', '));
        
        for (const mediaPath of mediaPaths) {
            try {
                if (fs.existsSync(mediaPath)) {
                    const volumes = fs.readdirSync(mediaPath);
                    console.log(`[DETECT] Contents of ${mediaPath}:`, volumes.join(', '));
                    
                    for (const volume of volumes) {
                        if (volume.includes('RPI-RP2') || volume.includes('RPI_RP2')) {
                            const fullPath = path.join(mediaPath, volume);
                            console.log('[DETECT] ✓ Found BOOTSEL:', fullPath);
                            return fullPath;
                        }
                    }
                }
            } catch (e) {
                console.error(`[DETECT] Error reading ${mediaPath}:`, e.message);
            }
        }
    }
    
    return null;
}

// Read config.json from Classic firmware to detect hardware version
ipcMain.handle('read-classic-config', async (event, portPath) => {
    try {
        logSerial('========================================');
        logSerial('[CONFIG] READING CLASSIC CONFIG.JSON');
        logSerial('========================================');
        logSerial('[CONFIG] Port path: ' + portPath);
        
        const port = new SerialPort({ path: portPath, baudRate: 115200 });
        
        return new Promise((resolve, reject) => {
            let buffer = '';
            let inFile = false;
            let fileContent = [];
            const timeout = setTimeout(() => {
                logSerial('[CONFIG] ✗ Timeout reading config');
                try {
                    port.close();
                } catch (e) {}
                reject(new Error('Timeout reading config'));
            }, 10000);
            
            port.on('data', (data) => {
                const chunk = data.toString('utf-8');
                buffer += chunk;
                
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    logSerial('[CONFIG] Received: ' + trimmed);
                    
                    if (trimmed === 'START_config.json') {
                        inFile = true;
                        fileContent = [];
                        logSerial('[CONFIG] ✓ Started receiving config.json');
                    } else if (trimmed === 'END_config.json') {
                        clearTimeout(timeout);
                        logSerial('[CONFIG] ✓ Finished receiving config.json');
                        
                        try {
                            const jsonStr = fileContent.join('\n');
                            const config = JSON.parse(jsonStr);
                            logSerial('[CONFIG] ✓ Parsed config JSON');
                            
                            // Detect hardware version from neopixel_pin
                            const neopixelPin = config.neopixel_pin || '';
                            let version = 'v2'; // Default to v2 (latest hardware)
                            
                            if (neopixelPin.includes('23')) {
                                version = 'v1';
                                logSerial('[CONFIG] ✓ Detected v1 hardware (neopixel_pin: ' + neopixelPin + ')');
                            } else if (neopixelPin.includes('13')) {
                                version = 'v2';
                                logSerial('[CONFIG] ✓ Detected v2 hardware (neopixel_pin: ' + neopixelPin + ')');
                            } else {
                                logSerial('[CONFIG] ⚠️  Unknown neopixel_pin: ' + neopixelPin + ', defaulting to v2');
                            }

                            writeCachedHardwareVersion(version, 'classic-config');
                            
                            logSerial('========================================\n');
                            port.close();
                            resolve({ success: true, version: version, config: config });
                        } catch (e) {
                            logSerial('[CONFIG] ✗ Failed to parse JSON: ' + e.message);
                            logSerial('========================================\n');
                            port.close();
                            reject(new Error('Failed to parse config.json: ' + e.message));
                        }
                        return;
                    } else if (inFile && trimmed && trimmed !== 'ACK: READFILE:config.jso') {
                        fileContent.push(trimmed);
                    }
                }
            });
            
            port.on('open', () => {
                logSerial('[CONFIG] ✓ Serial port opened');
                logSerial('[CONFIG] Sending READFILE:config.json command');
                port.write('READFILE:config.json\n');
            });
            
            port.on('error', (err) => {
                clearTimeout(timeout);
                logSerial('[CONFIG] ✗ Serial error: ' + err.message);
                logSerial('========================================\n');
                reject(err);
            });
        });
    } catch (error) {
        logSerial('[CONFIG] ✗ Exception: ' + error.message);
        logSerial('========================================\n');
        throw error;
    }
});

// Read hardware version from hardware_version.txt on BOOTSEL volume
ipcMain.handle('read-hardware-version', async (event, bootselPath) => {
    try {
        return readHardwareVersionFromBootselOrCache(bootselPath);
    } catch (error) {
        console.error('[VERSION] Error reading hardware_version.txt:', error.message);
        return { success: false, version: 'v2' }; // Default to v2 on error
    }
});

ipcMain.handle('read-cached-hardware-version', async () => {
    const cached = readCachedHardwareVersion();
    if (cached) {
        return { success: true, version: cached.version, source: 'cache' };
    }
    return { success: false, version: 'v2', source: 'default' };
});

// Write hardware version to hardware_version.txt on BOOTSEL volume
ipcMain.handle('write-hardware-version', async (event, bootselPath, version) => {
    try {
        const normalizedVersion = normalizeHardwareVersion(version);
        const versionFile = path.join(bootselPath, 'hardware_version.txt');
        console.log('[VERSION] Writing hardware version:', normalizedVersion, 'to', versionFile);
        
        fs.writeFileSync(versionFile, normalizedVersion + '\n', 'utf-8');
        console.log('[VERSION] ✓ Hardware version file written successfully');
        writeCachedHardwareVersion(normalizedVersion, 'bootsel-write');
        
        // Sync on Unix systems
        if (process.platform !== 'win32') {
            try {
                require('child_process').execSync('sync');
                console.log('[VERSION] ✓ Filesystem synced');
            } catch (e) {
                console.warn('[VERSION] Sync warning:', e.message);
            }
        }
        
        return { success: true };
    } catch (error) {
        console.error('[VERSION] ✗ Error writing hardware_version.txt:', error.message);
        throw error;
    }
});
