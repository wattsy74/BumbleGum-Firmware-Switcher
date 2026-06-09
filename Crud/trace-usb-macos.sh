#!/bin/bash

echo "==========================================="
echo "  macOS USB TRACE (dtrace method)"
echo "==========================================="
echo ""
echo "This will trace USB control transfers system-wide."
echo ""
echo "Instructions:"
echo "  1. This terminal will start tracing"
echo "  2. Open Santroller Configurator"
echo "  3. Click 'Revert Device to Arduino'"
echo "  4. Press Ctrl+C here when done"
echo ""
echo "Starting in 5 seconds..."
sleep 5

OUTPUT_FILE="usb-trace-$(date +%Y%m%d-%H%M%S).log"

echo "📝 Tracing USB activity to: $OUTPUT_FILE"
echo ""

# Use dtrace to capture IOKit USB activity
sudo dtrace -n '
    fbt:com.apple.iokit.IOUSBFamily:*ControlRequest*:entry
    {
        printf("\n[CONTROL REQUEST]\n");
        printf("  Function: %s\n", probefunc);
        printf("  Time: %Y\n", walltimestamp);
        tracemem(arg1, 64);
    }
    
    fbt:com.apple.iokit.IOUSBFamily:*DeviceRequest*:entry
    {
        printf("\n[DEVICE REQUEST]\n");
        printf("  Function: %s\n", probefunc);
        printf("  Time: %Y\n", walltimestamp);
        tracemem(arg1, 64);
    }
    
    fbt:com.apple.iokit.IOUSBFamily:*Reset*:entry
    {
        printf("\n[RESET REQUEST]\n");
        printf("  Function: %s\n", probefunc);
        printf("  Time: %Y\n", walltimestamp);
    }
' 2>&1 | tee "$OUTPUT_FILE"

echo ""
echo "==========================================="
echo "✅ Trace saved to: $OUTPUT_FILE"
echo ""
echo "Analyzing for USB control requests..."
grep -A 5 "CONTROL\|DEVICE\|RESET" "$OUTPUT_FILE" > "${OUTPUT_FILE}.summary"
echo "Summary saved to: ${OUTPUT_FILE}.summary"
echo "==========================================="
