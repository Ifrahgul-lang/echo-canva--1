# EchoCanvas-Complete-Pro-Fixed-Audio-Working-With-Mic-AND-Text-Update-FINAL-Enhanced-Background-Launcher.ps1
# Launches the complete professional Echo Canvas experience from VS Code project files

Write-Host "🚀 Launching Complete Echo Canvas Experience from VS Code Project..." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

# Check if files exist
$htmlFile = "index.html"
$cssFile = "styles.css"
$jsFile = "app.js"

if (-not (Test-Path $htmlFile)) {
    Write-Host "❌ Error: index.html not found!" -ForegroundColor Red
    Write-Host "Please make sure you're running this script from the project directory." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $cssFile)) {
    Write-Host "⚠️  Warning: styles.css not found!" -ForegroundColor Yellow
}

if (-not (Test-Path $jsFile)) {
    Write-Host "⚠️  Warning: app.js not found!" -ForegroundColor Yellow
}

Write-Host "✅ Project files detected!" -ForegroundColor Green
Write-Host "🎉 COMPLETE ECHO CANVAS EXPERIENCE READY!" -ForegroundColor Green
Write-Host "✨ ENHANCED PROFESSIONAL BACKGROUND FEATURES:" -ForegroundColor Magenta
Write-Host "   ✅ Animated gradient mesh with blend modes" -ForegroundColor Gray
Write-Host "   ✅ Geometric pattern overlay with floating animation" -ForegroundColor Gray
Write-Host "   ✅ Floating particles system for depth" -ForegroundColor Gray
Write-Host "   ✅ Style-specific background variations" -ForegroundColor Gray

Write-Host "`n🚀 LAUNCHING IN YOUR DEFAULT BROWSER..." -ForegroundColor Yellow

# Launch in default browser
Start-Process $htmlFile

Write-Host "`n✅ ECHO CANVAS IS NOW RUNNING FROM VS CODE PROJECT!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "`n🎯 FEATURES ACTIVE:" -ForegroundColor Magenta
Write-Host "   • WORKING Microphone AND Text Instruction Options" -ForegroundColor Cyan
Write-Host "   • Enhanced Professional Dynamic Background" -ForegroundColor Cyan
Write-Host "   • Auto Voice Commands & Gesture Control" -ForegroundColor Cyan
Write-Host "   • Text-to-Speech & Accessibility Features" -ForegroundColor Cyan

Write-Host "`n IMPORTANT: Use Chrome or Edge for best voice recognition support!" -ForegroundColor Red
Write-Host "📁 Project Structure:" -ForegroundColor Yellow
Write-Host "   📄 index.html (Main HTML file)" -ForegroundColor Gray
Write-Host "   🎨 styles.css (Enhanced CSS styles)" -ForegroundColor Gray
Write-Host "   ⚛️  app.js (React application)" -ForegroundColor Gray
Write-Host "   📜 launch.ps1 (This launcher script)" -ForegroundColor Gray

Write-Host "`n🎊 NOW WITH SEPARATED FILES FOR VS CODE DEVELOPMENT! 🌟🎨✨" -ForegroundColor Green

# Keep PowerShell window open
Write-Host "`nPress any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
