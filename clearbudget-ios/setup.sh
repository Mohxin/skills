#!/bin/bash
# ClearBudget iOS - Setup Script
# Generates Xcode project from project.yml using XcodeGen

set -e

echo "🏗️  Setting up ClearBudget iOS..."

# Check if XcodeGen is installed
if ! command -v xcodegen &> /dev/null; then
    echo "📦 Installing XcodeGen..."
    brew install xcodegen
fi

# Generate project
echo "⚡ Generating Xcode project..."
xcodegen generate

echo ""
echo "✅ Project generated successfully!"
echo ""
echo "📱 To open the app:"
echo "   open ClearBudget.xcodeproj"
echo ""
echo "🔧 Then:"
echo "   1. Select your development team in Signing & Capabilities"
echo "   2. Select an iPhone simulator"
echo "   3. Press ⌘R to run"
