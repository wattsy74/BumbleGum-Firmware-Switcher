#!/bin/bash

echo "==========================================="
echo "  SANTROLLER CONFIGURATOR DECOMPILER"
echo "==========================================="
echo ""

APP_PATH="/Users/martynwatts/Downloads/SantrollerConfigurator-2.app"

if [ ! -d "$APP_PATH" ]; then
    echo "❌ App not found at: $APP_PATH"
    exit 1
fi

echo "Found app: $APP_PATH"
echo ""

# Find all DLL and EXE files
echo "📦 Searching for .NET assemblies..."
find "$APP_PATH" -type f \( -name "*.dll" -o -name "*.exe" \) | while read file; do
    echo "  - $file"
done

echo ""
echo "🔍 Searching for USB/bootloader keywords..."
echo ""

# Search for relevant strings in all binaries
find "$APP_PATH" -type f \( -name "*.dll" -o -name "*.exe" \) -exec sh -c '
    file="$1"
    echo "Checking: $(basename "$file")"
    
    # Extract strings and search for USB-related keywords
    strings "$file" 2>/dev/null | grep -iE "(reset|boot|reboot|dfu|libusb|control.*transfer|bRequest|vendor.*request|0x41|BOOTSEL)" | while read line; do
        echo "  ✓ $line"
    done
' sh {} \;

echo ""
echo "🔍 Searching for libusb function calls..."
echo ""

# Find libusb dylib
LIBUSB=$(find "$APP_PATH" -name "libusb*.dylib" | head -n 1)
if [ -n "$LIBUSB" ]; then
    echo "Found libusb at: $LIBUSB"
    nm -g "$LIBUSB" 2>/dev/null | grep -i "control\|transfer\|reset" | head -n 20
fi

echo ""
echo "🔍 Looking for main executable..."
echo ""

# Find main executable
MAIN_EXE=$(find "$APP_PATH/Contents/MacOS" -type f -perm +111 | head -n 1)
if [ -n "$MAIN_EXE" ]; then
    echo "Main executable: $MAIN_EXE"
    echo ""
    echo "Strings mentioning USB/boot:"
    strings "$MAIN_EXE" | grep -iE "(usb|boot|reset|0x[0-9a-f]{2})" | head -n 30
fi

echo ""
echo "==========================================="
echo "✅ Analysis complete!"
echo ""
echo "Next: Look for patterns like:"
echo "  - bRequest = 0xXX"
echo "  - bmRequestType = 0xXX"
echo "  - wValue = 0xXX"
echo "  - control_transfer(...)"
echo "==========================================="
