# 📥 Installing Node.js on macOS

## Why You Need It

Node.js is only required **for you (the developer) to build the app**. Your users will never need Node.js!

You need it once to run `./setup.sh` and `./build.sh`, then you can distribute the executables to users.

---

## ✅ Easy Installation (Recommended)

### Option 1: Official Installer (Easiest)

1. **Download Node.js**
   - Go to: https://nodejs.org/
   - Click the **green "LTS"** button (recommended version)
   - Downloads: `node-vXX.XX.XX.pkg` file

2. **Install**
   - Double-click the downloaded `.pkg` file
   - Click "Continue" through the installer
   - Click "Install"
   - Enter your Mac password
   - Click "Close" when done

3. **Verify**
   ```bash
   node --version
   # Should show: v18.x.x or higher
   ```

**Done!** Now you can run `./setup.sh`

---

### Option 2: Homebrew (If you have it)

If you already use Homebrew:

```bash
brew install node
```

Verify:
```bash
node --version
```

---

### Option 3: NVM (For advanced users managing multiple Node versions)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Close and reopen terminal, then:
nvm install --lts
nvm use --lts
```

---

## ⚡ Quick Install (One Command)

If you trust the official installer, you can download and open it with:

```bash
# Download the installer
curl -o ~/Downloads/node-installer.pkg https://nodejs.org/dist/v20.10.0/node-v20.10.0.pkg

# Open it (will launch GUI installer)
open ~/Downloads/node-installer.pkg
```

Then follow the on-screen instructions.

---

## 🔍 Verify Installation

After installing, verify it works:

```bash
# Check Node.js version
node --version
# Should show: v18.x.x or v20.x.x

# Check npm version
npm --version
# Should show: 9.x.x or 10.x.x
```

If both commands work, you're ready!

---

## 🚀 Next Steps

Now that Node.js is installed:

```bash
cd /Users/martynwatts/Library/CloudStorage/OneDrive-Personal/Desktop/firmware-flasher-web/electron-app

# Run setup (installs dependencies)
./setup.sh

# Build the app
./build.sh
```

---

## ❓ Troubleshooting

### "command not found: node" after installation

**Solution:** Close and reopen your terminal, then try again.

Or restart Terminal completely (Cmd+Q, then reopen).

### "Permission denied" during install

**Solution:** The installer will ask for your Mac password. Enter it and click "Install".

### Want a specific Node.js version?

**Recommended versions:**
- **Node.js 20 LTS** (latest, best)
- **Node.js 18 LTS** (also good)

Find all versions at: https://nodejs.org/en/download/

---

## 💡 Remember

- ✅ **You need Node.js** - To build the app
- ❌ **Users DON'T need Node.js** - They just download your .dmg file
- ⏱️ **One-time setup** - Install once, build many times
- 🎯 **Worth it** - You get professional, self-contained executables

---

## 📊 What Happens Next

```
1. Install Node.js (5 minutes) ← You are here
   ↓
2. Run ./setup.sh (2 minutes)
   ↓
3. Run ./build.sh (5 minutes)
   ↓
4. Get self-contained .dmg file
   ↓
5. Share with users - they never need Node.js!
```

**Total time to first build: ~12 minutes**

---

## Quick Links

- **Download Node.js:** https://nodejs.org/
- **Homebrew:** https://brew.sh/ (optional)
- **NVM:** https://github.com/nvm-sh/nvm (advanced)

---

## After Node.js is Installed

Come back to the electron-app directory and run:

```bash
./setup.sh
```

Then you're ready to build! 🚀
