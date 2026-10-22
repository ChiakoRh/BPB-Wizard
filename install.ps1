$ErrorActionPreference = "Stop"

$Binary = "wizard.exe"
$InstallDir = "bpb-wizard"
$Arch = if ([Environment]::Is64BitOperatingSystem) { "amd64" } else { "386" }

if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64" -or $env:PROCESSOR_ARCHITEW6432 -eq "ARM64") {
    $Arch = "arm64"
}

$Archive = "BPB-Wizard-windows-$Arch.zip"
$ForkWizardRepo = "https://github.com/ChiakoRh/BPB-Wizard"
$UpstreamWizardRepo = "https://github.com/bia-pain-bache/BPB-Wizard"
$ForkPanelRepo = "https://github.com/ChiakoRh/BPB-Worker-Panel"
$UpstreamPanelRepo = "https://github.com/bia-pain-bache/BPB-Worker-Panel"
$ArchiveUrl = "$ForkWizardRepo/releases/latest/download/$Archive"
$FallbackArchiveUrl = "$UpstreamWizardRepo/releases/latest/download/$Archive"
$WorkerUrl = "$ForkPanelRepo/releases/latest/download/worker.js"
$FallbackWorkerUrl = "$UpstreamPanelRepo/releases/latest/download/worker.js"

try {
    $LatestVersion = (Invoke-RestMethod -Uri "https://raw.githubusercontent.com/ChiakoRh/BPB-Wizard/main/VERSION").Trim()
} catch {
    $LatestVersion = (Invoke-RestMethod -Uri "https://raw.githubusercontent.com/bia-pain-bache/BPB-Wizard/main/VERSION").Trim()
}

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

$BinaryPath = Join-Path $InstallDir $Binary
$NeedsInstall = $false

if (Test-Path $BinaryPath) {
    $InstalledVersion = (& $BinaryPath --version).Trim()
    Write-Host "Installed version: $InstalledVersion"
    Write-Host "Latest version: $LatestVersion"

    if ($InstalledVersion -eq $LatestVersion) {
        Write-Host "Wizard is up to date."
    } else {
        Write-Host "Updating to version $LatestVersion..."
        $NeedsInstall = $true
    }
} else {
    Write-Host "Wizard not found here. Installing version $LatestVersion..."
    $NeedsInstall = $true
}

if ($NeedsInstall) {
    Write-Host "Downloading $Archive..."

    $zipPath = Join-Path $InstallDir $Archive
    try {
        Invoke-WebRequest -Uri $ArchiveUrl -OutFile $zipPath
    } catch {
        Invoke-WebRequest -Uri $FallbackArchiveUrl -OutFile $zipPath
    }
    Expand-Archive -Path $zipPath -DestinationPath $InstallDir -Force
    Remove-Item $zipPath
}

Write-Host "Downloading worker.js..."
try {
    Invoke-WebRequest -Uri $WorkerUrl -OutFile (Join-Path $InstallDir "worker.js")
} catch {
    Invoke-WebRequest -Uri $FallbackWorkerUrl -OutFile (Join-Path $InstallDir "worker.js")
}

$env:LAUNCHED_BY_SCRIPT = "1"

Push-Location $InstallDir
try {
    & ".\$Binary"
} finally {
    Pop-Location
}