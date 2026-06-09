# 🔍 FIND THE ACTUAL REBOOT COMMAND

## Step-by-Step Guide

---

## PHASE 1: Test USB Control Transfers (5 minutes)

USB control transfers bypass HID entirely and talk directly to the USB device. Let's test common bootloader patterns:

```bash
cd electron-app

# Try with normal permissions first
node test-usb-control.js

# If that fails with permission errors, try with sudo:
sudo node test-usb-control.js
```

**What this does:**
- Tests 7 different USB control transfer patterns
- Common RP2040/Pico bootloader commands
- Arduino Leonardo reset patterns
- USB DFU standard commands

**If one works:** 🎉 The script will tell you the exact command!

**If none work:** Proceed to Phase 2

---

## PHASE 2: Capture Actual USB Traffic (15 minutes)

If control transfers don't work, we need to see what the Santroller configurator actually sends.

### Method A: IOKit Logging (Easiest)

```bash
cd electron-app
./capture-usb-simple.sh
```

This will start logging USB traffic. Then:
1. Open Santroller Configurator
2. Click "Revert Device to Arduino"
3. Press `Ctrl+C` in the terminal
4. Check `usb-capture.log` file

Look for lines containing:
- `controlTransfer`
- `setReport`
- `vendor`
- `class request`

### Method B: Wireshark (Most Detailed)

**Only if Method A doesn't show enough detail:**

```bash
cd electron-app
./setup-usb-capture.sh
# Restart your Mac after this
# Then follow Wireshark instructions below
```

After restart:
1. Open Wireshark
2. Select "USBPcap" or "USB" interface
3. Start capture
4. Open Santroller Configurator
5. Click "Revert Device to Arduino"
6. Stop capture in Wireshark
7. Filter by: `usb.device_address == X` (replace X with your device number)
8. Look for URB_CONTROL packets

---

## PHASE 3: Analyze Captured Data

Once you have the USB capture, look for:

### Control Transfer Pattern:
```
bmRequestType: 0xXX
bRequest: 0xXX
wValue: 0xXXXX
wIndex: 0xXXXX
Data: [bytes]
```

### Or HID Set Report:
```
Report Type: Feature/Output
Report ID: 0xXX
Data: [bytes]
```

---

## PHASE 4: Test the Discovered Command

Once you find the command, test it:

### If it's a Control Transfer:
```javascript
const usb = require('usb');
const device = usb.findByIds(0x1209, 0x2882);
device.open();
device.controlTransfer(
    bmRequestType,  // From capture
    bRequest,       // From capture
    wValue,         // From capture
    wIndex,         // From capture
    data,           // From capture
    callback
);
```

### If it's an HID Report:
```javascript
const HID = require('node-hid');
const device = new HID.HID(path);
device.sendFeatureReport([reportId, ...data]);
```

---

## QUICK START (Do This Now)

```bash
cd /Users/martynwatts/Library/CloudStorage/OneDrive-Personal/Desktop/firmware-flasher-web/electron-app

# Step 1: Test USB control transfers
sudo node test-usb-control.js

# If nothing works, proceed to Step 2:
# Capture live USB traffic
./capture-usb-simple.sh
# (In another terminal, trigger reboot in Santroller app)
# (Press Ctrl+C when done)

# Step 3: Check the log
cat usb-capture.log | grep -i "control\|transfer\|report"
```

---

## What To Share With Me

After running the commands, share:

1. **Output from test-usb-control.js** - Did any work?
2. **usb-capture.log** - Or at least the relevant lines containing control/transfer
3. **Any error messages**

I'll analyze it and give you the exact command to implement!

---

## Expected Timeline

- Phase 1 (Control tests): **5 minutes**
- Phase 2 (USB capture): **10-15 minutes**  
- Phase 3 (Analysis): **5-10 minutes**
- Phase 4 (Implementation): **15-30 minutes**

**Total: 35-60 minutes to working solution** 🚀

---

## Start NOW!

```bash
cd electron-app
sudo node test-usb-control.js
```

**Run this and share the output!**
