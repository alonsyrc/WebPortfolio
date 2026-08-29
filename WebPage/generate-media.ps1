# Script to scan the Media folder and generate media-data.js automatically
# Usage: Run this script or double-click generate-media.bat whenever you add/remove files in Media.

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }

$mediaPath = Join-Path $scriptDir "Media"
$outputJsPath = Join-Path $scriptDir "media-data.js"

if (-not (Test-Path $mediaPath)) {
    Write-Error "No se encontro la carpeta Media en: $mediaPath"
    exit 1
}

$videoExts = @('.mp4', '.webm', '.ogg', '.mov', '.m4v')
$imageExts = @('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg')

function Get-NaturalSortKey($string) {
    return [regex]::Replace($string, '\d+', { $args[0].Value.PadLeft(8, '0') })
}

function Get-TextFileContent($filePath) {
    if (-not (Test-Path $filePath -PathType Leaf)) { return "" }
    try {
        $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
        return $content.Trim()
    } catch {
        return ""
    }
}

$mediaData = [ordered]@{}

# Get all modal category directories under Media
$categories = Get-ChildItem -Path $mediaPath -Directory | Sort-Object { Get-NaturalSortKey $_.Name }

foreach ($cat in $categories) {
    $catName = $cat.Name
    $modalDir = Join-Path $cat.FullName "Modal"

    if (-not (Test-Path $modalDir)) {
        continue
    }

    $carousels = @()

    # 1. Check for subdirectories inside Modal (each subfolder represents a carousel)
    $subdirs = Get-ChildItem -Path $modalDir -Directory | Sort-Object { Get-NaturalSortKey $_.Name }

    foreach ($subdir in $subdirs) {
        $carouselTitle = $subdir.Name
        $items = @()

        # Find carousel-level txt description (matching folder name or any txt not named like a media file)
        $carouselDesc = ""
        $specificTxt = Join-Path $subdir.FullName "$carouselTitle.txt"
        if (Test-Path $specificTxt -PathType Leaf) {
            $carouselDesc = Get-TextFileContent $specificTxt
        } else {
            $anyTxt = Get-ChildItem -Path $subdir.FullName -Filter *.txt -File | Select-Object -First 1
            if ($anyTxt) {
                $carouselDesc = Get-TextFileContent $anyTxt.FullName
            }
        }

        $files = Get-ChildItem -Path $subdir.FullName -File | Sort-Object { Get-NaturalSortKey $_.Name }
        foreach ($file in $files) {
            $ext = $file.Extension.ToLower()
            $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
            $relPath = "Media/$catName/Modal/$carouselTitle/$($file.Name)"
            $type = $null

            if ($videoExts -contains $ext) {
                $type = "video"
            } elseif ($imageExts -contains $ext) {
                $type = "image"
            }

            if ($type) {
                $itemSpecificTxt = Join-Path $subdir.FullName "$baseName.txt"
                $itemDesc = ""
                if (Test-Path $itemSpecificTxt -PathType Leaf) {
                    $itemDesc = Get-TextFileContent $itemSpecificTxt
                }

                $itemObj = [ordered]@{
                    type = $type
                    src = $relPath
                    name = $baseName
                }
                if ($itemDesc) {
                    $itemObj["description"] = $itemDesc
                }

                $items += $itemObj
            }
        }

        if ($items.Count -gt 0) {
            $carouselObj = [ordered]@{
                title = $carouselTitle
            }
            if ($carouselDesc) {
                $carouselObj["description"] = $carouselDesc
            }
            $carouselObj["items"] = $items
            $carousels += $carouselObj
        }
    }

    # 2. Check for direct files in Modal (e.g. Kinu, UmbralLight)
    $directFiles = Get-ChildItem -Path $modalDir -File | Sort-Object { Get-NaturalSortKey $_.Name }
    if ($directFiles.Count -gt 0) {
        $directDesc = ""
        $catTxt = Join-Path $modalDir "$catName.txt"
        if (Test-Path $catTxt -PathType Leaf) {
            $directDesc = Get-TextFileContent $catTxt
        } else {
            $anyTxt = Get-ChildItem -Path $modalDir -Filter *.txt -File | Select-Object -First 1
            if ($anyTxt) {
                $directDesc = Get-TextFileContent $anyTxt.FullName
            }
        }

        $items = @()
        foreach ($file in $directFiles) {
            $ext = $file.Extension.ToLower()
            $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
            $relPath = "Media/$catName/Modal/$($file.Name)"
            $type = $null

            if ($videoExts -contains $ext) {
                $type = "video"
            } elseif ($imageExts -contains $ext) {
                $type = "image"
            }

            if ($type) {
                $itemSpecificTxt = Join-Path $modalDir "$baseName.txt"
                $itemDesc = ""
                if (Test-Path $itemSpecificTxt -PathType Leaf) {
                    $itemDesc = Get-TextFileContent $itemSpecificTxt
                }

                $itemObj = [ordered]@{
                    type = $type
                    src = $relPath
                    name = $baseName
                }
                if ($itemDesc) {
                    $itemObj["description"] = $itemDesc
                }

                $items += $itemObj
            }
        }

        if ($items.Count -gt 0) {
            $directTitle = if ($subdirs.Count -eq 0) { $catName } else { "General" }
            $carouselObj = [ordered]@{
                title = $directTitle
            }
            if ($directDesc) {
                $carouselObj["description"] = $directDesc
            }
            $carouselObj["items"] = $items
            $carousels += $carouselObj
        }
    }

    # 3. Check if Team folder exists directly under category root (e.g. Media/Kinu/Team)
    $teamDirOutside = Join-Path $cat.FullName "Team"
    $teamDirInside = Join-Path $modalDir "Team"
    if ((Test-Path $teamDirOutside) -and (-not (Test-Path $teamDirInside))) {
        $carouselTitle = "Team"
        $items = @()
        $teamDesc = ""
        $teamTxt = Join-Path $teamDirOutside "Team.txt"
        if (Test-Path $teamTxt -PathType Leaf) {
            $teamDesc = Get-TextFileContent $teamTxt
        } else {
            $anyTxt = Get-ChildItem -Path $teamDirOutside -Filter *.txt -File | Select-Object -First 1
            if ($anyTxt) { $teamDesc = Get-TextFileContent $anyTxt.FullName }
        }

        $files = Get-ChildItem -Path $teamDirOutside -File | Sort-Object { Get-NaturalSortKey $_.Name }
        foreach ($file in $files) {
            $ext = $file.Extension.ToLower()
            $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
            $relPath = "Media/$catName/Team/$($file.Name)"
            $type = $null
            if ($videoExts -contains $ext) { $type = "video" }
            elseif ($imageExts -contains $ext) { $type = "image" }

            if ($type) {
                $itemObj = [ordered]@{
                    type = $type
                    src = $relPath
                    name = $baseName
                }
                $items += $itemObj
            }
        }

        if ($items.Count -gt 0) {
            $carouselObj = [ordered]@{
                title = $carouselTitle
            }
            if ($teamDesc) {
                $carouselObj["description"] = $teamDesc
            }
            $carouselObj["items"] = $items
            $carousels += $carouselObj
        }
    }

    # Ensure any carousel with title 'Team' or 'Equipo' is placed at the very end
    $nonTeam = @($carousels | Where-Object { $_.title -notmatch '^(team|equipo)$' })
    $teamCarousels = @($carousels | Where-Object { $_.title -match '^(team|equipo)$' })
    $carousels = $nonTeam + $teamCarousels

    $mediaData[$catName] = $carousels
}

$json = $mediaData | ConvertTo-Json -Depth 6
$jsContent = @"
// =============================================================================
// ARCHIVO AUTOGENERADO POR generate-media.ps1
// No necesitas editar este archivo manualmente.
// Cada vez que agregues, borres o muevas fotos/videos en la carpeta Media,
// ejecuta 'generate-media.bat' para sincronizar los cambios al instante.
// =============================================================================

window.MEDIA_DATA = $json;
"@

[System.IO.File]::WriteAllText($outputJsPath, $jsContent, [System.Text.Encoding]::UTF8)
Write-Output "Sincronizacion completada con exito. Archivo media-data.js generado con $($mediaData.Keys.Count) categorias."
