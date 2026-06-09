# HID Reboot Debugging Guide

## The Problem
The Santroller device is not rebooting into BOOTSEL mode when we send HID commands.

## What I Just Added
**Extensive debug logging** that will show:
1. **All HID interfaces** the device exposes
2. **Every reboot command** we try
3. **Exact bytes** being sent
4. **Success/failure** for each attempt
5. **Whether device disconnects** after commands

## How to Capture Debug Info

### Step 1: Rebuild the app
```bash
cd /Users/martynwatts/Library/CloudStorage/OneDrive-Personal/Desktop/firmware-flasher-web/electron-app
./build.sh
```

### Step 2: Run and enable full console logging

**Option A - Run from source (easier for debugging):**
```bash
npm start
```
Then open DevTools: **View → Toggle Developer Tools**

**Option B - Run built app:**
Open the app, then use the keyboard shortcut:
- **Cmd+Option+I** on macOS
- **Ctrl+Shift+I** on Windows/Linux

### Step 3: Test the reboot
1. Go to "Santroller Firmware" tab
2. Refresh and connect to your Guitar device
3. Select Classic1 or Classic2
4. Click "Flash Firmware"

### Step 4: Copy the console output

You should see a detailed debug section like this:

```
========================================
[HID DEBUG] ALL SANTROLLER INTERFACES:
========================================

[HID] Interface 1:
  Path: IOService:/AppleACPIPlatformExpert/...
  Usage Page: 0x0001
  Usage: 0x0005
  Interface: 0
  Product: Guitar

[HID] Interface 2:
  Path: IOService:/AppleACPIPlatformExpert/...
  Usage Page: 0x????
  Usage: 0x????
  Interface: 1
  Product: Guitar

========================================
[HID DEBUG] ATTEMPTING REBOOT...
========================================

[HID] Opening IOService:... (Usage: 0x1:0x5)
  [TRY] Community reboot (feature) → sendFeatureReport([0x01 0x55])
  [✓] SUCCESS! Wrote 2 bytes
  [TRY] Community reboot (output) → write([0x01 0x55])
  [✓] SUCCESS! Write completed
  ...

========================================
[HID DEBUG] SUMMARY:
========================================
Successful sends: 4
...
```

**Copy ALL of this output** and share it with me.

## What We're Looking For

### Key Questions:
1. **How many HID interfaces does the device expose?**
   - If only 1 interface with Usage 0x0001:0x0005 (gamepad), that's the problem
   - We need to see a config interface (Usage Page 0xFF00 or similar)

2. **Do any commands succeed?**
   - Look for `[✓] SUCCESS!` messages
   - If yes, but device doesn't reboot → firmware doesn't support that command
   - If no → wrong interface or report format

3. **Does the device disconnect after commands?**
   - Look for: `Device still present after reboot command: true/false`
   - If `true` → commands didn't trigger reboot
   - If `false` → SUCCESS! Device rebooted

## Possible Outcomes

### Outcome 1: Device reboots! ✅
```
[HID] ✓✓✓ Device disconnected! Expecting BOOTSEL mount shortly...
```
**This means it worked!** If BOOTSEL still doesn't appear, it's a volume detection issue (easier to fix).

### Outcome 2: Commands sent, but device doesn't disconnect ⚠️
```
[HID] Device still present after reboot command: true
```
**This means:** Your device firmware doesn't respond to these HID commands in its current mode.

**Solutions:**
- Use official Santroller app to trigger reboot, then our app will auto-flash
- Or we need to capture what the official app sends

### Outcome 3: No interfaces can be opened ❌
```
[✗] Could not open: Access denied
```
**This means:** Permission issues.

**Solution:** Add HID permissions to the built app.

## Next Steps

**Share the complete console output with me**, and I'll tell you exactly:
1. What's wrong
2. How to fix it
3. Whether we need to sniff the official Santroller app's HID traffic

---

## Quick Reference: Running with Debug Mode

### From Source (Best for Debugging):
```bash
cd electron-app
npm start
# DevTools will auto-open or use Cmd+Option+I
```

### From Built App:
```bash
open dist/mac/Firmware\ Flasher.app
# Then press Cmd+Option+I for console
```

### Enable More Verbose Logging (if needed):
Edit `main.js` line 50 and uncomment:
```javascript
mainWindow.webContents.openDevTools();  // Remove the // at the start
```

Then rebuild with `./build.sh`
