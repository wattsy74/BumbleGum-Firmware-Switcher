# 🔍 Quick Debug Steps

## What to Do Right Now:

### Step 1: Clear Console
1. In DevTools, click the **🚫 Clear console** button (top left of console)
2. This removes all the build/hash messages

### Step 2: Connect Device
1. Go to **"Santroller Firmware"** tab in the app
2. Click **"🔄 Refresh HID Devices"**
3. Select **"Guitar"** from the dropdown
4. Click **"Connect via HID"**

### Step 3: Attempt Flash
1. Select **"Classic 1"** firmware
2. Click **"Flash Firmware"**
3. **Watch the console** - copy ALL the output

### Step 4: Share Output
Copy and paste the ENTIRE console output here, especially:
- Any lines starting with `[USB]`
- Any error messages (in red)
- Any warnings

---

## Common Issues & Solutions:

### Issue 1: "usb" module not found
**Error:** `Error: Cannot find module 'usb'`

**Solution:**
```bash
cd /Users/martynwatts/Library/CloudStorage/OneDrive-Personal/Desktop/firmware-flasher-web/electron-app
npm install usb
./build.sh
```

---

### Issue 2: Permission denied
**Error:** `LIBUSB_ERROR_ACCESS` or `Permission denied`

**Solution:**
- Quit the app
- Run from terminal with sudo:
```bash
sudo /Applications/Firmware\ Flasher.app/Contents/MacOS/Firmware\ Flasher
```

---

### Issue 3: Device not found
**Error:** `Could not find USB device`

**Solution:**
- Unplug and replug the device
- Try a different USB port
- Make sure device is in Santroller firmware (shows as "Guitar")

---

### Issue 4: No console output
**Problem:** Console is empty or only shows build hashes

**Solution:**
1. Close console and reopen (Cmd+Option+J)
2. Make sure "All levels" is selected (not just "Errors")
3. Try the flash process again

---

## What I Need to See:

Please paste the console output that shows:

```
[USB] SANTROLLER USB CONTROL TRANSFER
...
```

Or any error message you see!
