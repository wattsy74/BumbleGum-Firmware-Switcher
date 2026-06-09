# Hardware Version Detection System

## Overview
The firmware flasher now automatically detects hardware version (v1 vs v2) and selects the correct firmware variant. This eliminates the need for users to manually choose between multiple firmware options.

## Hardware Differences
- **v1 Hardware**: Neopixel LED on GPIO pin 10
- **v2 Hardware**: Neopixel LED on GPIO pin 13

## Detection Methods

### 1. Classic Firmware Detection
When Classic firmware is detected via serial port, the app:
1. Sends `READFILE:config.json\n` command via serial
2. Parses the response between `START_config.json` and `END_config.json` markers
3. Reads the `neopixel_pin` field from the JSON
4. Determines version:
   - `"GP10"` or contains `"10"` → v1 hardware
   - `"GP13"` or contains `"13"` → v2 hardware
   - Default: v2 (if field is missing or unrecognized)

### 2. BOOTSEL Mode Detection
When the device is in BOOTSEL mode (RPI-RP2 volume mounted), the app:
1. Looks for `hardware_version.txt` in the root of the BOOTSEL volume
2. Reads the content (`v1` or `v2`)
3. Uses this value for firmware selection
4. Default: v2 (for new devices without the flag file)

### 3. Hardware Version Persistence
When flashing firmware while in BOOTSEL mode:
1. Before copying the .uf2 file, writes `hardware_version.txt` to the BOOTSEL volume
2. Contains either `v1` or `v2` based on detected hardware
3. This file persists across firmware changes on the CIRCUITPY drive
4. Ensures correct firmware is always selected, even when switching between firmwares

### 4. Santroller Firmware Detection
When Santroller firmware is detected via HID:
- Uses the previously detected hardware version
- Will be confirmed during reboot when BOOTSEL/CIRCUITPY becomes available

## Firmware URLs
The app now uses version-specific firmware files:

### Classic Firmware
- **v1**: `Classic-v1.uf2` (for GPIO 10 hardware)
- **v2**: `Classic-v2.uf2` (for GPIO 13 hardware)

### Santroller Firmware
- **v1**: `Guitarv1.uf2` (for GPIO 10 hardware)
- **v2**: `Guitarv2.uf2` (for GPIO 13 hardware)

## User Interface
The UI has been simplified to just 2 buttons:

### Button Visibility Rules
1. **Classic firmware detected**: Show "Switch to Santroller" button
2. **Santroller firmware detected**: Show "Switch to Classic" button
3. **BOOTSEL mode detected**: Show both buttons
4. **No device**: Hide both buttons

### Display Information
- Device name and current firmware type
- Hardware version indicator (e.g., "Hardware: V1" or "Hardware: V2")
- Real-time status updates during flashing

## Technical Implementation

### New IPC Handlers (main.js)
- `read-classic-config` - Reads config.json via serial READFILE command
- `read-hardware-version` - Reads hardware_version.txt from BOOTSEL volume
- `write-hardware-version` - Writes hardware_version.txt to BOOTSEL volume

### New API Methods (preload.js)
- `readClassicConfig(portPath)` - Get Classic config and detect version
- `readHardwareVersion(bootselPath)` - Read version flag file
- `writeHardwareVersion(bootselPath, version)` - Write version flag file

### Renderer Logic (renderer-minimal.js)
- Maintains `hardwareVersion` state variable (defaults to 'v2')
- Auto-detects version during device detection
- Auto-selects correct firmware variant when flashing
- Writes version flag file during BOOTSEL flashing

## Flash Process Flow

### From Classic Firmware
1. Detect Classic device via serial port
2. Read config.json to get neopixel_pin → hardware version
3. User clicks "Switch to Santroller"
4. Send `REBOOTBOOTSEL\n` serial command
5. Wait for BOOTSEL volume to appear
6. Write `hardware_version.txt` with detected version
7. Copy correct Santroller-v1.uf2 or Santroller-v2.uf2
8. Device reboots with new firmware

### From Santroller Firmware
1. Detect Santroller device via HID (VID 0x1209)
2. Use stored hardware version from previous detection
3. User clicks "Switch to Classic"
4. Send USB control transfer (bmRequestType=0x21, bRequest=49)
5. Wait for BOOTSEL volume to appear
6. Read `hardware_version.txt` to detect version (defaults to v2 if missing)
7. Copy correct Classic-v1.uf2 or Classic-v2.uf2
8. Device reboots with new firmware

### Direct BOOTSEL Flash
1. Detect BOOTSEL volume
2. Read `hardware_version.txt` if exists (default to v2)
3. Display hardware version in UI
4. User clicks firmware switch button
5. Write/update `hardware_version.txt`
6. Copy correct firmware variant
7. Device reboots

## Error Handling
- If config.json read fails: Uses previous/default version (v2)
- If hardware_version.txt doesn't exist: Defaults to v2
- If version detection fails: Defaults to v2 (latest hardware)
- Graceful fallback ensures flashing always works

## Benefits
1. **User-Friendly**: No manual version selection needed
2. **Automatic**: Detects hardware automatically
3. **Persistent**: Version stored in flag file
4. **Safe**: Defaults to v2 if detection fails
5. **Simplified UI**: Only 2 buttons instead of 3

## Testing Recommendations
1. Test with v1 hardware (GPIO 10 neopixel)
2. Test with v2 hardware (GPIO 13 neopixel)
3. Test switching Classic → Santroller → Classic
4. Test direct BOOTSEL flashing (both firmwares)
5. Verify hardware_version.txt persistence
6. Test with missing hardware_version.txt (should default to v2)
7. Verify console logs show correct version detection
