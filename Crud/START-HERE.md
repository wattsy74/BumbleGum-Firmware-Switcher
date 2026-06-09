# 🎯 START HERE - Complete Setup Guide

## YOU ARE HERE: Getting Started

You want to build self-contained executables for your firmware flasher app.

**Goal:** Create `.dmg` (Mac), `.exe` (Windows), or `.AppImage` (Linux) files that users can just download and run.

---

## ✅ STEP 1: Install Node.js (One Time)

### You Need This First!

Node.js is required to **build** the app (only for you, the developer). Your users won't need it.

### Install Now (5 minutes):

**Go to:** https://nodejs.org/

**Download:** Click the big green **"LTS"** button (recommended version)

**Install:** Double-click the downloaded file, follow the installer

**Verify:** Open Terminal and type:
```bash
node --version
```

If you see `v18.x.x` or `v20.x.x`, you're good! ✅

**Stuck?** See [INSTALL-NODEJS.md](INSTALL-NODEJS.md) for detailed instructions.

---

## ✅ STEP 2: Setup Dependencies (One Time)

Now that Node.js is installed, set up the project:

```bash
# Navigate to the app directory
cd /Users/martynwatts/Library/CloudStorage/OneDrive-Personal/Desktop/firmware-flasher-web/electron-app

# Run setup script
./setup.sh
```

**What this does:**
- Installs Electron
- Installs node-hid (for Santroller HID communication)
- Installs serialport (for Classic serial communication)
- Installs electron-builder (for creating executables)

**Time:** ~2 minutes

**Output:** You'll see `✅ Setup complete!`

---

## ✅ STEP 3: Build Self-Contained Executable

Time to create the distributable file!

```bash
./build.sh
```

**What this does:**
- Bundles your app with Electron runtime
- Includes all native modules (node-hid, serialport)
- Creates platform-specific executable
- Puts everything in `dist/` folder

**Time:** ~5 minutes

**Output:**
- macOS: `dist/Firmware Flasher-1.0.0.dmg` (~200 MB)
- Windows: `dist/FirmwareFlasher-Portable-1.0.0.exe` (~200 MB)
- Linux: `dist/FirmwareFlasher-1.0.0.AppImage` (~200 MB)

---

## ✅ STEP 4: Test It

Before sharing with users, test the executable:

```bash
# macOS
open dist/*.dmg
# Or just double-click the .dmg in Finder

# The app will open - try flashing some firmware!
```

---

## ✅ STEP 5: Share With Users

Once tested, give users the file:

**Options:**
- Upload to GitHub Releases
- Host on your website
- Share via Google Drive, Dropbox, etc.

**Tell users:**
> "Download Firmware Flasher.dmg (or .exe/.AppImage), double-click to open, and start flashing firmware. No installation needed!"

---

## 📊 Quick Command Summary

```bash
# One-time setup (after installing Node.js):
cd electron-app
./setup.sh

# Every time you want to build:
./build.sh

# Output appears in:
ls -lh dist/
```

---

## ❓ Troubleshooting

### "❌ Node.js is not installed"
→ Install Node.js from https://nodejs.org/ first (see Step 1 above)

### "command not found: ./setup.sh"
→ Make sure you're in the `electron-app` directory:
```bash
cd /Users/martynwatts/Library/CloudStorage/OneDrive-Personal/Desktop/firmware-flasher-web/electron-app
```

### "Permission denied: ./setup.sh"
→ Make it executable:
```bash
chmod +x setup.sh build.sh
./setup.sh
```

### Build fails with native module errors
→ Make sure you ran `./setup.sh` first. If still failing:
```bash
rm -rf node_modules package-lock.json
./setup.sh
```

---

## 🎯 Your Journey

```
┌─────────────────────────┐
│ 1. Install Node.js      │ ← START HERE
│    (5 min, one time)    │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ 2. Run ./setup.sh       │
│    (2 min, one time)    │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ 3. Run ./build.sh       │
│    (5 min, per release) │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ 4. Test executable      │
│    (2 min)              │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ 5. Share with users!    │
│    (They just download  │
│     and double-click)   │
└─────────────────────────┘
```

**Total time to first build: ~15 minutes**

---

## 💡 Key Points to Remember

1. **Node.js is only for YOU** - Users never need it
2. **Setup once** - ./setup.sh is one-time per machine
3. **Build per release** - ./build.sh whenever you want to distribute
4. **~200 MB file** - Self-contained, everything included
5. **Zero user setup** - Download → double-click → use

---

## 📚 Additional Resources

- **[INSTALL-NODEJS.md](INSTALL-NODEJS.md)** - Detailed Node.js installation guide
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Quick command reference
- **[USER-GUIDE.md](USER-GUIDE.md)** - Give this to your users
- **[README.md](README.md)** - Complete technical documentation

---

## 🆘 Need Help?

**Common issues and solutions:**

| Issue | Solution |
|-------|----------|
| No Node.js | Install from https://nodejs.org/ |
| setup.sh fails | Run as `bash setup.sh` |
| build.sh takes forever | Normal! Building native modules takes time |
| .dmg file huge (~200 MB) | Normal! Everything is bundled |
| Users say "can't open" | See USER-GUIDE.md troubleshooting section |

---

## ✅ What You're Building

**Input:** Your app code (already done!)

**Output:** Professional, self-contained executables that:
- ✅ Require no installation
- ✅ Bundle all dependencies
- ✅ Work on Mac, Windows, Linux
- ✅ Never need Node.js
- ✅ Send HID commands to Santroller (no BOOTSEL button!)
- ✅ Send serial commands to Classic
- ✅ Look like commercial software

---

## 🎉 Ready?

**Right now, do this:**

1. **Install Node.js:** https://nodejs.org/ (click the green LTS button)
2. **Open Terminal**
3. **Run these commands:**

```bash
cd /Users/martynwatts/Library/CloudStorage/OneDrive-Personal/Desktop/firmware-flasher-web/electron-app
./setup.sh
./build.sh
```

**Then:** Find your executable in `dist/` and test it!

**You got this!** 🚀
