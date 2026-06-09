#!/bin/bash

echo "========================================="
echo "  COMPREHENSIVE USB CAPTURE"
echo "  Multiple logging methods"
echo "========================================="
echo ""

# Method 1: Broader USB logging
echo "📝 Starting comprehensive USB logging..."
echo "This will capture ALL USB activity."
echo ""
echo "When ready:"
echo "  1. Open Santroller Configurator"
echo "  2. Click 'Revert Device to Arduino'"
echo "  3. Press Ctrl+C here when done"
echo ""
echo "Starting in 5 seconds..."
sleep 5

# Log with broader filter
sudo log stream --level debug | grep -i "usb\|1209\|2882\|santroller" | tee usb-capture-broad.log
