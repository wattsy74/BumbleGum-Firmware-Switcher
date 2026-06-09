#!/bin/bash

echo "🧹 Cleaning build artifacts..."

# Remove dist folder
if [ -d "dist" ]; then
    rm -rf dist
    echo "✓ Removed dist/"
fi

# Clean extended attributes from OneDrive (fixes code signing issues)
echo "🧹 Cleaning extended attributes (OneDrive fix)..."
xattr -cr .

echo "✓ Cleanup complete!"
echo ""
echo "Now run: ./build.sh"
