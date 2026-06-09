# 🚀 QUICK REFERENCE - Build & Distribute

## For You (Developer)

### First Time Setup (Do Once)
```bash
cd electron-app
./setup.sh
```
Takes ~2 minutes. Installs everything needed to build.

### Build Self-Contained Executable
```bash
./build.sh
```
Takes ~5 minutes. Creates ready-to-distribute files in `dist/`.

### What You Get
- **macOS**: `Firmware Flasher-1.0.0.dmg` (~200 MB)
- **Windows**: `FirmwareFlasher-Portable-1.0.0.exe` (~200 MB)
- **Linux**: `FirmwareFlasher-1.0.0.AppImage` (~200 MB)

### Distribute
Upload file to GitHub Releases or your website. Give users the download link.

---

## For Your Users

### Installation
1. Download the file
2. Double-click
3. Done!

### Usage
1. Launch app
2. Connect device
3. Select firmware
4. Click "Flash"
5. Wait 30 seconds
6. Done!

**No setup. No commands. No Node.js. No frameworks. Just works!**

---

## Key Points

✅ **Self-contained** - Everything bundled, zero dependencies  
✅ **One file** - Users download one file, double-click, done  
✅ **No BOOTSEL** - Fully automated firmware switching  
✅ **Cross-platform** - macOS, Windows, Linux  
✅ **Professional** - Looks and works like commercial software  

---

## File Locations

```
electron-app/
├── setup.sh         # Setup script (run once)
├── build.sh         # Build script (creates executables)
├── dist/            # Output folder (executables appear here)
└── USER-GUIDE.md    # Give this to users (or don't - app is self-explanatory)
```

---

## Support for Users

### macOS: "Can't open, unidentified developer"
→ Right-click → Open → Open

### Windows: "Windows protected your PC"
→ More info → Run anyway

### Linux: Can't execute
→ `chmod +x FirmwareFlasher-1.0.0.AppImage`

---

## That's It!

**You:** Run `./build.sh` once per release  
**Users:** Download → double-click → use

**Zero complexity. Maximum automation.** 🎉
