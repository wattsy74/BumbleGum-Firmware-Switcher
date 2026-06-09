# 🔍 CLASSIC SERIAL REBOOT DIAGNOSTIC

## ✅ What I Just Added

**Enhanced logging for Classic firmware reboot** to diagnose why the device isn't entering BOOTSEL mode.

### Added Logging Points:

1. **Renderer (renderer-minimal.js)**
   - Shows device type and path before reboot
   - Confirms which reboot method is being called

2. **Main Process (main.js)**
   - Serial port opening status
   - Command transmission status
   - Detailed error messages
   - Success confirmation

---

## 🚀 How to Diagnose

### Step 1: Rebuild Complete - Open New Build

```bash
open "/Users/martynwatts/Library/CloudStorage/OneDrive-Personal/Desktop/firmware-flasher-web/electron-app/dist/mac-arm64/BumbleGum Firmware Switcher.app"
```

### Step 2: Open DevTools Console

**Cmd+Option+I** (automatically opens)

### Step 3: Try Flashing

1. **Device detected:** Classic Controller ✓
2. **Select:** Santroller firmware
3. **Click:** Apply

### Step 4: Watch Console Output

**You should see this sequence:**

```
[DETECT] ✓ Classic device found: {path: "/dev/cu.usbmodem...", vendorId: "6997"}

[FLASH] Device type: classic
[FLASH] Device path: /dev/cu.usbmodem14201
[FLASH] Calling Classic serial reboot...

========================================
[SERIAL] CLASSIC FIRMWARE REBOOT
========================================
[SERIAL] Port path: /dev/cu.usbmodem14201
[SERIAL] Opening serial port at 115200 baud...
[SERIAL] ✓ Serial port opened successfully
[SERIAL] Sending command: REBOOTBOOTSEL\n
[SERIAL] ✓ Command sent successfully
[SERIAL] Waiting 1 second for device to process...
[SERIAL] ✓ Closing serial port
[SERIAL] 🎉 Classic device should be entering BOOTSEL mode!
========================================
```

---

## 🐛 Possible Issues & Solutions

### Issue 1: Serial Port Won't Open
**Console shows:**
```
[SERIAL] ✗ Timeout opening serial port
```

**Cause:** Port may be locked by another process  
**Solution:** 
```bash
# Check if another process is using the port
lsof | grep usbmodem

# Close any Santroller configurator or serial monitor apps
```

---

### Issue 2: Command Sent But Device Doesn't Reboot
**Console shows:**
```
[SERIAL] ✓ Command sent successfully
[SERIAL] 🎉 Classic device should be entering BOOTSEL mode!
# But device stays connected, BOOTSEL doesn't appear
```

**Possible causes:**
1. **Classic firmware serial handler not running** - firmware may be hung
2. **Wrong baud rate** - firmware expects different baud (unlikely, should be 115200)
3. **Command format wrong** - should be exactly `REBOOTBOOTSEL\n`
4. **Serial data channel** - Classic firmware uses `usb_cdc.data` not console

**Let me check:** Does the Classic firmware use the **data serial channel** or **console serial channel**?

Looking at your boot.py attachment earlier, I see:
```python
usb_cdc.enable(console=True, data=True)
```

And in code.py:
```python
import usb_cdc
# Uses usb_cdc.data
```

**PROBLEM FOUND!** The Classic firmware listens on `usb_cdc.data` (the DATA channel), not the console!

---

### Issue 3: Wrong Serial Port
**If there are multiple ports:**
```
/dev/cu.usbmodem14201   ← Console (for REPL)
/dev/tty.usbmodem14201  ← Data channel (for commands)
```

**We need to connect to the DATA channel, not console!**

---

## 🔧 The Fix Needed

Classic firmware has **TWO serial ports**:
1. **Console** (`/dev/cu.usbmodem...`) - For CircuitPython REPL
2. **Data** (`/dev/tty.usbmodem...` or second cu port) - For commands

We might be connecting to the wrong one!

Let me check the serial port listing and update the detection...

---

## 📋 What To Share With Me

After opening the new build and trying to flash, **copy and paste the ENTIRE console output** including:
- `[DETECT]` lines
- `[FLASH]` lines  
- `[SERIAL]` lines
- Any errors

This will tell me exactly what's happening!

---

**Building now... will be ready in ~1 minute!** ⏱️

---

*Diagnostic build in progress: June 8, 2026*
