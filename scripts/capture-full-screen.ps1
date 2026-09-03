# Automated Pixel-Perfect Seamless Mobile Full-Page Screenshot (Smart Overlap Matcher)
param (
    [string]$Slug = "screen",
    [string]$Suffix = "before",
    [int]$Frames = 3,
    [int]$HeaderHeight = 310,
    [int]$BottomNavHeight = 80,
    [string]$OutputDir = "screenshots"
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

Write-Host "Resetting view to top..."
adb shell input swipe 540 600 540 1800 250
adb shell input swipe 540 600 540 1800 250
Start-Sleep -Milliseconds 600

$tempFiles = @()

# Capture Frame 0
Write-Host "Capturing Frame 0 (Top)..."
adb shell screencap -p /sdcard/temp_frame_0.png
$f0 = "$OutputDir\temp_${Slug}_0.png"
adb pull /sdcard/temp_frame_0.png $f0 | Out-Null
$tempFiles += $f0

# Capture subsequent frames with moderate scroll
for ($idx = 1; $idx -lt $Frames; $idx++) {
    Write-Host "Scrolling to Frame $idx..."
    adb shell input swipe 540 1600 540 800 500
    Start-Sleep -Milliseconds 900
    
    adb shell screencap -p "/sdcard/temp_frame_$idx.png"
    $fn = "$OutputDir\temp_${Slug}_$idx.png"
    adb pull "/sdcard/temp_frame_$idx.png" $fn | Out-Null
    $tempFiles += $fn
}

Write-Host "Analyzing exact pixel overlap..."

$bitmaps = New-Object System.Collections.ArrayList
foreach ($f in $tempFiles) {
    $img = [System.Drawing.Bitmap]::FromFile((Resolve-Path $f).Path)
    [void]$bitmaps.Add($img)
}

$w = $bitmaps[0].Width
$h = $bitmaps[0].Height

# Function to find exact overlap between bmpA and bmpB
function Find-OverlapY ($bmpA, $bmpB, $topCrop, $bottomCrop) {
    # Sample a horizontal feature line from bmpB just below the top header
    $sampleY_B = $topCrop + 40
    $sampleWidth = 200
    $startX = [int]($w / 2) - 100
    
    $samplePixels = @()
    for ($x = 0; $x -lt $sampleWidth; $x += 4) {
        $color = $bmpB.GetPixel($startX + $x, $sampleY_B)
        $samplePixels += @{ X = $startX + $x; R = $color.R; G = $color.G; B = $color.B }
    }
    
    # Search bmpA from (h - bottomCrop - 1) up to topCrop
    $bestMatchY_A = -1
    $minDiff = 99999999
    
    for ($yA = ($h - $bottomCrop - 1); $yA -ge ($topCrop + 50); $yA--) {
        $diff = 0
        foreach ($p in $samplePixels) {
            $cA = $bmpA.GetPixel($p.X, $yA)
            $diff += [Math]::Abs($cA.R - $p.R) + [Math]::Abs($cA.G - $p.G) + [Math]::Abs($cA.B - $p.B)
            if ($diff -gt $minDiff) { break }
        }
        if ($diff -lt $minDiff) {
            $minDiff = $diff
            $bestMatchY_A = $yA
            if ($diff -eq 0) { break }
        }
    }
    
    # If a clean match is found (diff per sampled pixel < 5)
    if ($bestMatchY_A -gt 0 -and ($minDiff / $samplePixels.Count) -lt 15) {
        return @{ MatchInA = $bestMatchY_A; SampleInB = $sampleY_B }
    }
    
    # Fallback to standard scroll distance
    Write-Host "Fallback overlap used"
    return @{ MatchInA = ($h - $bottomCrop - 700); SampleInB = $sampleY_B }
}

# Calculate exact slices
$slices = @()
# Slice 0: Frame 0 from y=0 to overlap point
$overlap1 = Find-OverlapY $bitmaps[0] $bitmaps[1] $HeaderHeight $BottomNavHeight
$slice0_H = $overlap1.MatchInA

$slices += @{ Bmp = $bitmaps[0]; SrcY = 0; Height = $slice0_H }

if ($Frames -eq 2) {
    # Last frame from overlap point down to bottom
    $slice1_SrcY = $overlap1.SampleInB
    $slice1_H = $h - $BottomNavHeight - $slice1_SrcY
    $slices += @{ Bmp = $bitmaps[1]; SrcY = $slice1_SrcY; Height = $slice1_H }
} elseif ($Frames -ge 3) {
    $overlap2 = Find-OverlapY $bitmaps[1] $bitmaps[2] $HeaderHeight $BottomNavHeight
    
    $slice1_SrcY = $overlap1.SampleInB
    $slice1_H = $overlap2.MatchInA - $slice1_SrcY
    $slices += @{ Bmp = $bitmaps[1]; SrcY = $slice1_SrcY; Height = $slice1_H }
    
    $slice2_SrcY = $overlap2.SampleInB
    $slice2_H = $h - $BottomNavHeight - $slice2_SrcY
    $slices += @{ Bmp = $bitmaps[2]; SrcY = $slice2_SrcY; Height = $slice2_H }
}

$totalH = 0
foreach ($s in $slices) { $totalH += $s.Height }
$totalH += $BottomNavHeight

Write-Host "Stitching pixel-perfect image (Total Height: ${totalH}px)..." -ForegroundColor Green

$finalBmp = New-Object System.Drawing.Bitmap $w, $totalH
$g = [System.Drawing.Graphics]::FromImage($finalBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$currDestY = 0
foreach ($s in $slices) {
    $srcRect = New-Object System.Drawing.Rectangle 0, $s.SrcY, $w, $s.Height
    $destRect = New-Object System.Drawing.Rectangle 0, $currDestY, $w, $s.Height
    $g.DrawImage($s.Bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $currDestY += $s.Height
}

# Draw bottom nav handle
$lastBmp = $bitmaps[$bitmaps.Count - 1]
$srcNav = New-Object System.Drawing.Rectangle 0, ($h - $BottomNavHeight), $w, $BottomNavHeight
$destNav = New-Object System.Drawing.Rectangle 0, $currDestY, $w, $BottomNavHeight
$g.DrawImage($lastBmp, $destNav, $srcNav, [System.Drawing.GraphicsUnit]::Pixel)

$outputFile = "$OutputDir\${Slug}-${Suffix}-full.png"
$finalBmp.Save((Resolve-Path .).Path + "\$outputFile", [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$finalBmp.Dispose()
foreach ($b in $bitmaps) { $b.Dispose() }

foreach ($f in $tempFiles) {
    if (Test-Path $f) { Remove-Item $f -Force }
}

$brainTarget = "C:\Users\Khaled\.gemini\antigravity-ide\brain\1b85dd3d-31a2-4ffb-ab62-cc36ae0d0c1b\${Slug}-${Suffix}-full.png"
Copy-Item -Path $outputFile -Destination $brainTarget -Force

Write-Host "SUCCESS: Pixel-perfect seamless full-page saved to $outputFile" -ForegroundColor Green
