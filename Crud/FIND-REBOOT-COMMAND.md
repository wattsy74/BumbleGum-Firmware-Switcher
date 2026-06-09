# 🎯 Finding the Santroller Reboot Command

## The Situation

Your Santroller configurator is a **native desktop app** (not web-based), so we need to either:
1. Capture USB traffic at the OS level, OR
2. Find the source code and read the command directly

---

## ✅ BEST APPROACH: Find the Source Code

Most Santroller projects are **open source**! Let's find it:

### Questions for You:

1. **What is the app called?**
   - "Santroller Configurator"?
   - "Santroller Tool"?
   - Something else?

2. **Where did you get it?**
   - GitHub releases?
   - Santroller website?
   - Discord link?
   - Compiled it yourself?

3. **What format is it?**
   - macOS .app bundle?
   - Windows .exe?
   - Cross-platform Electron app?
   - Java/.jar application?

4. **Do you have a link where you downloaded it from?**

---

## 🔍 Common Santroller Projects

Here are common Santroller-related projects that might be yours:

### 1. Santroller Main Firmware
- https://github.com/Santroller/Santroller
- Has configurator source code
- Arduino-based

### 2. Ardwiino/Santroller Configurator
- https://github.com/Santroller/guitar-configurator
- Web-based configurator (if this is it, the WebHID sniffer WILL work!)

### 3. Other Related Projects
- https://github.com/search?q=santroller+configurator

---

## 🎯 QUICK ACTION: Check Your App

### If you have the app open now:

**On macOS:**
1. Right-click the app in Applications
2. Choose "Show Package Contents"
3. Look inside for JavaScript/HTML files
  - If you see these → It's an Electron/web app → WebHID sniffer WILL work!
  - If you see only binaries → It's native → need OS-level capture

**Or tell me:**
- File size of the app
- Does it feel like a web page or native app when you use it?

---

## 🛠️ IF We Need OS-Level Capture

If the app is truly native and closed-source, here's how to capture on macOS:

### Method 1: IOKit HID Logging (Easiest)

```bash
# Terminal 1:
sudo log stream --predicate 'subsystem == "com.apple.iokit.IOHIDFamily"' --level debug

# Then:
# 1. Open Santroller app
# 2. Trigger reboot
# 3. Look for "sendFeatureReport" or "setReport" in log output
```

### Method 2: Wireshark USB Capture

1. Install Wireshark
2. Install ChmodBPF:
   ```bash
   brew install wireshark
   sudo chown root:wheel /Library/LaunchDaemons/org.wireshark.ChmodBPF.plist
   sudo launchctl load -w /Library/LaunchDaemons/org.wireshark.ChmodBPF.plist
   ```
3. Restart and capture USB traffic

---

## 💡 My Guess

Based on your GitHub repo name (`BumbleGum-Configurator-Santroller`), I'm guessing:
- You're working with Santroller firmware
- The configurator might be from the official Santroller project
- It's likely the web-based configurator at https://santroller.net/tools/configurator/

**Can you confirm:**
- Is the configurator at `https://santroller.net/tools/configurator/`?
- Or is it a different native app?

If it's the web-based one, my WebHID sniffer WILL work! We just need to:
1. Open `webhid-sniffer.html` in Chrome
2. Connect to device
3. Open Santroller configurator in another tab
4. Capture the command!

---

## 🚀 TELL ME NOW:

**Answer these 3 questions:**

1. **App name/location:** Where/how do you run the Santroller configurator?

2. **Is it web-based or native?** 
   - Opens in browser = web-based (WebHID sniffer works!)
   - Standalone app icon = native (need OS capture)

3. **Link or repo:** Where can I find the app or its source code?

Once you answer, I'll get you the exact reboot command in 5 minutes! 🎯
