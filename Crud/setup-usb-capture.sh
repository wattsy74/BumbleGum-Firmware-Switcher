#!/bin/bash

echo "========================================="
echo "  macOS USB Packet Capture Setup"
echo "  for Santroller Reboot Command"
echo "========================================="
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo "✅ Homebrew found"
echo ""

# Install Wireshark
echo "📦 Installing Wireshark..."
brew install --cask wireshark

# Install ChmodBPF for USB capture
echo "📦 Setting up USB capture permissions..."
cd /Library/Application\ Support/Wireshark/ChmodBPF
sudo ./ChmodBPF

echo ""
echo "========================================="
echo "  ✅ SETUP COMPLETE!"
echo "========================================="
echo ""
echo "NEXT STEPS:"
echo "1. Restart your Mac (required for USB capture)"
echo "2. After restart, run: ./capture-usb-traffic.sh"
echo ""

