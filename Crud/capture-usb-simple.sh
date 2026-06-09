#!/bin/bash

echo "========================================="
echo "  USB TRAFFIC CAPTURE"
echo "  Simple Method for macOS"
echo "========================================="
echo ""

# Find Santroller device
echo "🔍 Looking for Santroller device..."
system_profiler SPUSBDataType | grep -A 10 "Product ID: 0x2882"

echo ""
echo "========================================="
echo "  STARTING USB LOGGING"
echo "========================================="
echo ""
echo "This will capture USB traffic in real-time."
echo "When prompted:"
echo "  1. Open Santroller Configurator"
echo "  2. Click 'Revert Device to Arduino' button"
echo "  3. Press Ctrl+C here when done"
echo ""
echo "Starting in 5 seconds..."
sleep 5

# Start IOKit logging (captures USB at kernel level)
echo "📝 Logging USB traffic..."
echo ""

sudo log stream --predicate 'subsystem == "com.apple.iokit.IOUSBFamily"' --level debug | tee usb-capture.log

