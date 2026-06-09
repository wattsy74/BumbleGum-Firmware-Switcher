#!/bin/bash

echo "🎸 Firmware Flasher - Native App Setup"
echo "======================================"
echo ""

# Check if we're in the electron-app directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the electron-app directory"
    echo "   cd electron-app && ./setup.sh"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  📥 You need to install Node.js first"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📖 Quick Install Guide:"
    echo ""
    echo "1. Go to: https://nodejs.org/"
    echo "2. Click the green 'LTS' button"
    echo "3. Download and install"
    echo "4. Come back and run ./setup.sh again"
    echo ""
    echo "Or see INSTALL-NODEJS.md for detailed instructions"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 Remember: This is ONLY for you (the developer)."
    echo "   Your users will never need Node.js!"
    echo ""
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js version is $NODE_VERSION, but 18+ is recommended"
fi

echo "✅ Node.js $(node --version) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo ""
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To run the app:"
echo "   npm start"
echo ""
echo "📦 To build executables:"
echo "   npm run build        # Build for current platform"
echo "   npm run build:mac    # Build for macOS"
echo "   npm run build:win    # Build for Windows"
echo "   npm run build:linux  # Build for Linux"
echo ""
echo "Happy flashing! 🎸"
