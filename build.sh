#!/bin/bash

echo "======================================"
echo "  Firmware Flasher - Build Script"
echo "  Creating Self-Contained Executables"
echo "======================================"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the electron-app directory"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo ""
fi

# Create assets directory with placeholder icons if they don't exist
if [ ! -d "assets" ]; then
    echo "📁 Creating assets directory..."
    mkdir -p assets
    
    # Create a simple placeholder text file for icons
    cat > assets/README.txt << 'EOF'
Icon Placeholder Files

For best results, add proper icon files:
- icon.icns (macOS, 512x512)
- icon.ico (Windows, 256x256)
- icon.png (Linux, 512x512)

You can use tools like:
- https://www.img2icns.com/ (for .icns)
- https://convertio.co/png-ico/ (for .ico)

The app will build without custom icons, using default Electron icons.
EOF
    
    echo "✅ Assets directory created (using default icons for now)"
    echo ""
fi

echo "🔨 Building self-contained executables..."
echo ""

# Determine platform
PLATFORM=$(uname -s)

case "$PLATFORM" in
    Darwin*)
        echo "Building for macOS..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        MAC_ARCH=$(uname -m)
        if [ "$MAC_ARCH" = "arm64" ]; then
            EB_ARCH_FLAG="--arm64"
            ARTIFACT_HINT="arm64"
        else
            EB_ARCH_FLAG="--x64"
            ARTIFACT_HINT="x64"
        fi

        echo "Target architecture: $ARTIFACT_HINT"
        echo ""

        npx electron-builder --mac dmg zip $EB_ARCH_FLAG
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ macOS Build Complete!"
            echo ""
            echo "📦 Created files in dist/:"
            find dist -maxdepth 1 \( -name "*.dmg" -o -name "*.zip" \) -print0 2>/dev/null | while IFS= read -r -d '' f; do
                size=$(du -h "$f" | awk '{print $1}')
                echo "   $f ($size)"
            done
            echo ""
            echo "📤 Share with users:"
            echo "   • Firmware Flasher-X.X.X.dmg    ← Main installer (drag to Applications)"
            echo "   • Firmware Flasher-X.X.X-mac.zip ← Portable version"
            echo ""
            echo "💡 Users just:"
            echo "   1. Download the .dmg file"
            echo "   2. Double-click to open"
            echo "   3. Drag to Applications folder"
            echo "   4. Done! Double-click to run"
        else
            echo "⚠️  DMG build failed, retrying with ZIP-only fallback..."
            echo ""
            npx electron-builder --mac zip $EB_ARCH_FLAG
            if [ $? -eq 0 ]; then
                echo ""
                echo "✅ macOS ZIP build complete (fallback mode)!"
                echo ""
                echo "📦 Created files in dist/:"
                find dist -maxdepth 1 -name "*.zip" -print0 2>/dev/null | while IFS= read -r -d '' f; do
                    size=$(du -h "$f" | awk '{print $1}')
                    echo "   $f ($size)"
                done
                echo ""
                echo "📤 Share with users:"
                echo "   • Firmware Flasher-*.zip ← Portable app bundle"
                echo ""
                echo "💡 Users on macOS can run the app directly from the extracted .app"
            else
                echo "❌ macOS build failed"
                exit 1
            fi
        fi
        ;;
    
    Linux*)
        echo "Building for Linux..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        npm run build:linux
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Linux Build Complete!"
            echo ""
            echo "📦 Created files in dist/:"
            ls -lh dist/*.AppImage dist/*.deb dist/*.rpm 2>/dev/null | awk '{print "   "$9" ("$5")"}'
            echo ""
            echo "📤 Share with users:"
            echo "   • FirmwareFlasher-X.X.X.AppImage ← Universal (no install needed)"
            echo "   • firmware-flasher_X.X.X_amd64.deb ← Debian/Ubuntu"
            echo "   • firmware-flasher-X.X.X.rpm ← Red Hat/Fedora"
            echo ""
            echo "💡 Users just:"
            echo "   1. Download .AppImage"
            echo "   2. chmod +x FirmwareFlasher-X.X.X.AppImage"
            echo "   3. Double-click to run"
        else
            echo "❌ Linux build failed"
            exit 1
        fi
        ;;
    
    MINGW*|MSYS*|CYGWIN*)
        echo "Building for Windows..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        npm run build:win
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Windows Build Complete!"
            echo ""
            echo "📦 Created files in dist/:"
            ls -lh dist/*.exe 2>/dev/null | awk '{print "   "$9" ("$5")"}'
            echo ""
            echo "📤 Share with users:"
            echo "   • Firmware Flasher Setup X.X.X.exe ← Installer"
            echo "   • FirmwareFlasher-Portable-X.X.X.exe ← No install needed"
            echo ""
            echo "💡 Users just:"
            echo "   1. Download the Portable.exe"
            echo "   2. Double-click to run"
            echo "   3. That's it!"
        else
            echo "❌ Windows build failed"
            exit 1
        fi
        ;;
    
    *)
        echo "⚠️  Unknown platform: $PLATFORM"
        echo "Trying to build for current platform..."
        npm run build
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ BUILD COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 All files are in: dist/"
echo ""
echo "🎯 Next Steps:"
echo "   1. Test the executable on your computer"
echo "   2. Share the file(s) with your users"
echo "   3. Users download and double-click - no setup required!"
echo ""
echo "❓ Want to build for other platforms?"
echo "   npm run build:mac    # macOS"
echo "   npm run build:mac:arm64  # macOS Apple Silicon"
echo "   npm run build:mac:x64    # macOS Intel"
echo "   npm run build:win    # Windows"
echo "   npm run build:linux  # Linux"
echo "   npm run build:all    # All platforms (requires platform tools)"
echo ""
echo "🎉 Happy distributing!"
