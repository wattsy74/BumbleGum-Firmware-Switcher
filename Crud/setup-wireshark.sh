#!/bin/bash

echo "========================================="
echo "  WIRESHARK USB CAPTURE SETUP"
echo "  Most Reliable Method"
echo "========================================="
echo ""

# Check if Wireshark is installed
if ! command -v wireshark &> /dev/null && ! [ -d "/Applications/Wireshark.app" ]; then
    echo "📦 Wireshark not found. Installing..."
    
    if ! command -v brew &> /dev/null; then
        echo "Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    brew install --cask wireshark
else
    echo "✅ Wireshark is installed"
fi

echo ""
echo "📦 Setting up USB capture permissions..."

# Install ChmodBPF
if [ -d "/Library/Application Support/Wireshark" ]; then
    cd "/Library/Application Support/Wireshark"
    if [ -f "ChmodBPF/ChmodBPF" ]; then
        sudo ChmodBPF/ChmodBPF
    fi
fi

echo ""
echo "========================================="
echo "  ✅ SETUP COMPLETE"
echo "========================================="
echo ""
echo "⚠️  IMPORTANT: You MUST restart your Mac now!"
echo ""
echo "After restart:"
echo "  1. Run Wireshark"
echo "  2. Look for 'USB' or 'USBPcap' in the interface list"
echo ""
echo "If you don't see USB interface:"
echo "  - On macOS, USB capture requires special setup"
echo "  - Alternative: Use a Windows/Linux VM with USB passthrough"
echo ""
echo "Once Wireshark is capturing:"
echo "  1. Start capture on USB interface"
echo "  2. Open Santroller Configurator  
echo "  3. Click 'Revert Device to Arduino'"
echo "  4. Stop capture"
echo "  5. Filter by: usb.src == \"1.X.X\" (replace X with your device)"
echo "  6. Look for URB_CONTROL or SET_REPORT packets"
echo ""
echo "========================================="
