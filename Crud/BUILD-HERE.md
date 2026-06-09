# 🏗️ BUILD INSTRUCTIONS

## 📍 Build Location

```bash
cd /Users/martynwatts/Library/CloudStorage/OneDrive-Personal/Desktop/firmware-flasher-web/electron-app
```

**This is your main project directory!** ✅

---

## 🚀 Quick Build (One Command)

```bash
cd "/Users/martynwatts/Library/CloudStorage/OneDrive-Personal/Desktop/firmware-flasher-web/electron-app" && npm run build:mac:arm64
```

**Output:** `dist/mac-arm64/Firmware Flasher.app`

---

## 📋 Step-by-Step Build

### 1. Navigate to Project
```bash
cd "/Users/martynwatts/Library/CloudStorage/OneDrive-Personal/Desktop/firmware-flasher-web/electron-app"
```

### 2. (Optional) Clean Previous Build
```bash
rm -rf dist
```

### 3. Build the App
```bash
npm run build:mac:arm64
```

**Build time:** ~2-3 minutes

---

## 🎯 What Gets Built

```
dist/
├── Firmware Flasher-1.0.0-arm64.dmg          ← Main installer (95MB)
├── Firmware Flasher-1.0.0-arm64-mac.zip      ← Portable version (91MB)
└── mac-arm64/
    └── Firmware Flasher.app                   ← The actual app
```

---

## ✅ Current Configuration

**UI Files:**
- `main.js` - Backend logic
- `index-simple.html` - Simplified UI (auto-detection)
- `renderer-simple.js` - Frontend logic
- `preload.js` - Security bridge

**Features Included:**
- ✅ Auto-detect Classic (VID 0x6997)
- ✅ Auto-detect Santroller (VID 0x1209)
- ✅ Auto-detect BOOTSEL (RPI-RP2 volume)
- ✅ USB control transfer reboot (Santroller)
- ✅ Serial reboot (Classic)
- ✅ Direct BOOTSEL flash
- ✅ File size validation
- ✅ Beautiful gradient UI

**Firmware URLs** (configured in main.js):
```javascript
'Classic1': 'https://github.com/wattsy74/.../Classic1.uf2'
'Classic2': 'https://github.com/wattsy74/.../Classic2.uf2'
'Santroller': 'https://github.com/wattsy74/.../Guitar.uf2'
```

---

## 🧪 Test the Build

```bash
open "dist/mac-arm64/Firmware Flasher.app"
```

**What to test:**
1. ✅ App opens with gradient purple UI
2. ✅ Device auto-detected within 3 seconds
3. ✅ Select firmware card → Flash button enables
4. ✅ Click Flash → Device reboots → Firmware copies
5. ✅ Progress bar and logs work

---

## 📤 Distribute to Users

### What to Share:
```
dist/Firmware Flasher-1.0.0-arm64.dmg
```

**User instructions:**
1. Download the .dmg file
2. Double-click to open
3. Drag "Firmware Flasher" to Applications
4. Done! No setup required

**First run:**
- macOS may show security warning
- Right-click app → "Open" → "Open" (first time only)
- After that, normal double-click works

---

## 🔧 Build for Other Platforms

### Intel Mac:
```bash
npm run build:mac:x64
```

### Windows:
```bash
npm run build:win
```
*Requires Windows or cross-compile tools*

### Linux:
```bash
npm run build:linux
```

### All Platforms:
```bash
npm run build:all
```
*Takes longer, builds everything*

---

## 🐛 If Build Fails

### Issue: Electron not found
```bash
rm -rf node_modules
npm install
npm run build:mac:arm64
```

### Issue: Code signing error
Already disabled in `package.json`:
```json
"identity": null
```

### Issue: OneDrive sync issues
*Already building from OneDrive location - should work!*

---

## 📊 Project Structure

```
electron-app/
├── main.js                  ← Backend (Node.js)
├── preload.js              ← Security bridge
├── renderer-simple.js      ← Frontend (UI logic)
├── index-simple.html       ← UI (HTML/CSS)
├── package.json            ← Dependencies & build config
├── build.sh                ← Automated build script
├── node_modules/           ← Dependencies
└── dist/                   ← Built apps (generated)
```

---

## ✅ You're Building From:

```
/Users/martynwatts/Library/CloudStorage/OneDrive-Personal/Desktop/firmware-flasher-web/electron-app/
```

**This location has:**
- ✅ All source files
- ✅ Latest updates (BOOTSEL detection, USB control transfer)
- ✅ Working node_modules
- ✅ Build configuration

---

## 🎯 Next Steps

1. **Build:** Run `npm run build:mac:arm64`
2. **Test:** Open the built app and try flashing
3. **Distribute:** Share the .dmg file with users

---

**You're all set to build!** 🚀
