const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Serial port operations
    listSerialPorts: () => ipcRenderer.invoke('list-serial-ports'),
    connectSerial: (portPath) => ipcRenderer.invoke('connect-serial', portPath),
    resetClassicSerial: (portPath) => ipcRenderer.invoke('reset-classic-serial', portPath),
    readClassicConfig: (portPath) => ipcRenderer.invoke('read-classic-config', portPath),
    
    // HID device operations
    listHIDDevices: () => ipcRenderer.invoke('list-hid-devices'),
    resetSantrollerHID: (devicePath) => ipcRenderer.invoke('reset-santroller-hid', devicePath),
    
    // BOOTSEL detection
    detectBootsel: () => ipcRenderer.invoke('detect-bootsel'),
    
    // Hardware version detection
    readHardwareVersion: (bootselPath) => ipcRenderer.invoke('read-hardware-version', bootselPath),
    readCachedHardwareVersion: () => ipcRenderer.invoke('read-cached-hardware-version'),
    writeHardwareVersion: (bootselPath, version) => ipcRenderer.invoke('write-hardware-version', bootselPath, version),
    
    // Flash operations
    startFlash: (firmware, url) => ipcRenderer.invoke('start-flash', firmware, url),
    startFlashWithVersionDetection: (targetFirmware, hardwareVersion) => ipcRenderer.invoke('start-flash-with-version-detection', targetFirmware, hardwareVersion),
    flashToBootsel: (firmware, url, bootselPath) => ipcRenderer.invoke('flash-to-bootsel', firmware, url, bootselPath),
    
    // Progress updates
    onFlashProgress: (callback) => {
        ipcRenderer.on('flash-progress', (event, progress) => callback(progress));
    },
    
    // HID debug logging
    onHIDDebug: (callback) => {
        ipcRenderer.on('hid-debug', (event, message) => callback(message));
    },
    
    // Serial debug logging
    onSerialDebug: (callback) => {
        ipcRenderer.on('serial-debug', (event, message) => callback(message));
    }
});
