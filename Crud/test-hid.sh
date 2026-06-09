#!/bin/bash

echo "========================================="
echo "  HID Reboot Debug Test"
echo "========================================="
echo ""
echo "This will run the app with DevTools open"
echo "so you can see detailed HID debug output."
echo ""
echo "Steps:"
echo "1. App will open with console visible"
echo "2. Go to 'Santroller Firmware' tab"
echo "3. Connect your Guitar device"
echo "4. Select Classic1 or Classic2"
echo "5. Click 'Flash Firmware'"
echo "6. Watch the console for detailed output"
echo ""
echo "Press Enter to start..."
read

npm start
