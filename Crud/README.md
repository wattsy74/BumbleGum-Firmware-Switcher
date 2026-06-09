# Firmware Flasher - Native Desktop App

**Fully automated firmware switching for Classic ↔ Santroller - No BOOTSEL button required!**

## ✨ Features

- 🚀 **Fully Automated** - No manual BOOTSEL button pressing
- 🎯 **HID Auto-Reset** - Sends reset commands directly to Santroller devices
- 🔌 **Serial Auto-Reset** - Automatic reset for Classic firmware
- 💻 **Cross-Platform** - macOS, Windows, Linux
- 📦 **Native App** - No browser restrictions, full USB access
- ⚡ **Fast** - Direct hardware access, no web API limitations
- 🎸 **Perfect for enclosed devices** - BOOTSEL button not accessible? No problem!

## 🎯 Why This Exists

The web version works great for Classic firmware, but Santroller devices have **inaccessible BOOTSEL buttons** (inside cases) and browser security blocks HID writes. This native app solves both problems:

- ✅ **No browser security restrictions**
- ✅ **Full HID/USB access**
- ✅ **Works with physically inaccessible BOOTSEL buttons**
- ✅ **100% automated for both Classic and Santroller**

## 📋 Requirements

- **Node.js 18+** (for building from source)
- **macOS 10.13+**, **Windows 10+**, or **Linux**
- USB connection to device

## 🚀 Quick Start

### Option 1: Run from Source

```bash
# Navigate to the electron-app directory
cd electron-app

# Install dependencies
npm install

# Run the app
npm start
```

### Option 2: Build Executables

```bash
# Build for your current platform
npm run build

# Build for specific platforms
npm run build:mac    # macOS .dmg
npm run build:win    # Windows installer
npm run build:linux  # Linux AppImage

# Build for all platforms (requires platform-specific tools)
npm run build:all
```

Built files will be in the `dist/` directory.

## 📱 How to Use

### For Classic Firmware → Santroller

1. **Launch the app**
2. **Click "Classic Firmware" tab**
3. **Click "🔄 Refresh Serial Ports"**
4. **Select your device** from the dropdown (e.g., `cu.usbmodem14201`)
5. **Click "Connect via Serial"**
6. **Click "Santroller" firmware card**
7. **Click "Flash Santroller Firmware"**
8. **Confirm the dialog**
9. **Wait for completion** (~30 seconds)
10. **Done!** Device reboots with Santroller firmware

### For Santroller Firmware → Classic

1. **Launch the app**
2. **Click "Santroller Firmware" tab**
3. **Click "🔄 Refresh HID Devices"**
4. **Select your device** from the dropdown (e.g., `Guitar`)
5. **Click "Connect via HID"**
6. **Click "Classic 1" or "Classic 2" firmware card**
7. **Click "Flash Classic Firmware"**
8. **Confirm the dialog**
9. **Wait for completion** (~30 seconds)
10. **Done!** Device reboots with Classic firmware

**No BOOTSEL button pressing required!** 🎉

## 🔧 How It Works

### Architecture

```
┌──────────────────────────────────────┐
│     Electron App (renderer.js)       │
│   • UI logic                         │
│   • Event handling                   │
└─────────────┬────────────────────────┘
              │ IPC Communication
              ▼
┌──────────────────────────────────────┐
│    Main Process (main.js)            │
│   • Hardware access                  │
│   • USB/HID/Serial control           │
│   • Filesystem operations            │
└─────────────┬────────────────────────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌───────────┐
│ Serial │ │  HID   │ │ Filesystem│
│ (node- │ │ (node- │ │  (copy    │
│  port) │ │  hid)  │ │  .uf2)    │
└────────┘ └────────┘ └───────────┘
```

### Reset Flow

#### Classic Firmware (Serial):
```
1. Connect via SerialPort
2. Send "REBOOTBOOTSEL\n" command
3. Device executes: microcontroller.on_next_reset(UF2)
4. Device resets into BOOTSEL mode
5. Appears as "RPI-RP2" USB mass storage
6. App detects volume and copies .uf2 file
7. Device auto-reboots with new firmware
```

#### Santroller Firmware (HID):
```
1. Connect via node-hid
2. Encode Protocol Buffer RebootCommand
3. Send 64-byte HID feature report [0x1A, 0x00, ...]
4. Device receives HID command
5. Device executes: reset_usb_boot()
6. Device resets into BOOTSEL mode
7. Appears as "RPI-RP2" USB mass storage
8. App detects volume and copies .uf2 file
9. Device auto-reboots with new firmware
```

## 🛠️ Technical Details

### Dependencies

- **electron** - Cross-platform desktop framework
- **node-hid** - HID device access (for Santroller)
- **serialport** - Serial port communication (for Classic)

### Native Modules

This app uses native Node.js modules that are automatically compiled for your platform:
- `node-hid` - HID access
- `serialport` - Serial access

These work without browser restrictions!

### Firmware Sources

Firmware files are automatically downloaded from:
```
Classic1:    github.com/wattsy74/BumbleGum-Configurator-Santroller
Classic2:    github.com/wattsy74/BumbleGum-Configurator-Santroller
Santroller:  github.com/wattsy74/BumbleGum-Configurator-Santroller
```

Files are cached in `~/.firmware-flasher-cache/` for faster subsequent flashes.

## 📦 Building for Distribution

### macOS

```bash
npm run build:mac
```

Creates:
- `dist/Firmware Flasher-1.0.0.dmg` - Drag-to-Applications installer
- `dist/Firmware Flasher-1.0.0-mac.zip` - Portable archive

**Note:** For distribution, you'll need to sign the app with an Apple Developer certificate.

### Windows

```bash
npm run build:win
```

Creates:
- `dist/Firmware Flasher Setup 1.0.0.exe` - NSIS installer
- `dist/Firmware Flasher 1.0.0.exe` - Portable executable

### Linux

```bash
npm run build:linux
```

Creates:
- `dist/Firmware Flasher-1.0.0.AppImage` - Universal Linux app
- `dist/firmware-flasher_1.0.0_amd64.deb` - Debian/Ubuntu package

## 🔍 Troubleshooting

### "Permission denied" errors (macOS/Linux)

```bash
# Grant permissions to access USB devices
# macOS: No special permissions needed
# Linux: Add user to dialout group
sudo usermod -a -G dialout $USER
# Then log out and back in
```

### HID device not found

1. Make sure device is plugged in
2. Click "🔄 Refresh HID Devices"
3. Try unplugging and replugging the device
4. Check USB cable (must support data, not just power)

### Serial port not found

1. Make sure device is plugged in and running Classic firmware
2. Click "🔄 Refresh Serial Ports"
3. On macOS, look for `cu.usbmodem*` ports
4. Avoid `Bluetooth` and `debug` ports

### Build fails with "node-hid" or "serialport" errors

```bash
# Rebuild native modules for your platform
npm rebuild

# Or reinstall everything
rm -rf node_modules package-lock.json
npm install
```

### BOOTSEL volume not detected

- **macOS**: Check `/Volumes/` for `RPI-RP2`
- **Windows**: Check for new drive letter labeled `RPI-RP2`
- **Linux**: Check `/media/$USER/RPI-RP2` or `/run/media/$USER/RPI-RP2`

## 🆚 Comparison: Native App vs Web App

| Feature | Native App | Web App |
|---------|-----------|---------|
| **Classic → Santroller** | ✅ Automatic | ✅ Automatic |
| **Santroller → Classic** | ✅ **Automatic** | ⚠️ Manual BOOTSEL |
| **BOOTSEL button required** | ❌ **No!** | ✅ Yes (for Santroller) |
| **Browser security limits** | ❌ No limits | ⚠️ HID writes blocked |
| **Installation** | Install once | Open in browser |
| **Platforms** | Mac, Win, Linux | Chrome/Edge only |
| **USB Access** | Full access | Limited (WebSerial/WebHID) |

**Native app is perfect if:**
- ✅ BOOTSEL button is physically inaccessible
- ✅ You want 100% automation for Santroller devices
- ✅ You flash firmware frequently
- ✅ You want maximum reliability

**Web app is perfect if:**
- ✅ You only flash Classic firmware
- ✅ BOOTSEL button is accessible (Manual mode)
- ✅ You prefer no installation

## 📄 License

MIT License - See LICENSE file

## 🙏 Credits

- Uses the RP2040 bootloader for safe firmware updates
- Santroller firmware by [Santroller Team](https://github.com/Santroller/Santroller)
- Classic firmware by [wattsy74](https://github.com/wattsy74)

## 🆘 Support

For issues, questions, or feature requests:
1. Check the troubleshooting section above
2. Review console output (Help → Toggle Developer Tools)
3. Open an issue on GitHub

---

**Enjoy your fully automated firmware flasher!** 🎸🚀

*No BOOTSEL buttons were harmed in the making of this software.*
