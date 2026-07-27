[CmdletBinding()]
param(
    [ValidateSet("all", "claude", "codex", "opencode")]
    [string]$Agent = "all",

    [ValidateSet("user", "project")]
    [string]$Scope = "user",

    [string]$ProjectPath = (Get-Location).Path,

    [switch]$Replace
)

$ErrorActionPreference = "Stop"
$skillName = "build-polished-websites"
$sourcePath = Join-Path $PSScriptRoot $skillName

if (-not (Test-Path -LiteralPath (Join-Path $sourcePath "SKILL.md") -PathType Leaf)) {
    throw "Invalid package: SKILL.md was not found at $sourcePath"
}

$sourcePath = (Resolve-Path -LiteralPath $sourcePath).Path
$userProfilePath = [Environment]::GetFolderPath([Environment+SpecialFolder]::UserProfile)

if ([string]::IsNullOrWhiteSpace($userProfilePath)) {
    throw "Unable to resolve the current user profile directory."
}

if ($Scope -eq "project") {
    if (-not (Test-Path -LiteralPath $ProjectPath -PathType Container)) {
        throw "Project path does not exist: $ProjectPath"
    }
    $basePath = (Resolve-Path -LiteralPath $ProjectPath).Path
} else {
    $basePath = $userProfilePath
}

function Get-InstallTargets {
    param(
        [string]$SelectedAgent,
        [string]$SelectedScope,
        [string]$Base
    )

    $relative = if ($SelectedScope -eq "user") {
        @{
            claude  = ".claude\skills"
            codex   = ".agents\skills"
            opencode = ".config\opencode\skills"
            shared  = ".agents\skills"
        }
    } else {
        @{
            claude  = ".claude\skills"
            codex   = ".agents\skills"
            opencode = ".opencode\skills"
            shared  = ".agents\skills"
        }
    }

    $roots = switch ($SelectedAgent) {
        "all"      { @($relative.claude, $relative.shared) }
        "claude"   { @($relative.claude) }
        "codex"    { @($relative.codex) }
        "opencode" { @($relative.opencode) }
    }

    return $roots |
        ForEach-Object { Join-Path (Join-Path $Base $_) $skillName } |
        Select-Object -Unique
}

function Install-SkillDirectory {
    param(
        [string]$Source,
        [string]$Destination,
        [bool]$AllowReplace
    )

    $parent = Split-Path -Parent $Destination
    New-Item -ItemType Directory -Force -Path $parent | Out-Null

    $temporary = "$Destination.installing-$PID"
    if (Test-Path -LiteralPath $temporary) {
        throw "Temporary destination already exists: $temporary"
    }

    $backup = $null
    if (Test-Path -LiteralPath $Destination) {
        if (-not $AllowReplace) {
            throw "Destination already exists: $Destination. Re-run with -Replace to back it up and install."
        }
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backup = "$Destination.backup-$timestamp"
        if (Test-Path -LiteralPath $backup) {
            throw "Backup destination already exists: $backup"
        }
        Move-Item -LiteralPath $Destination -Destination $backup
    }

    try {
        Copy-Item -LiteralPath $Source -Destination $temporary -Recurse
        if (-not (Test-Path -LiteralPath (Join-Path $temporary "SKILL.md") -PathType Leaf)) {
            throw "Copied package is incomplete: SKILL.md is missing."
        }
        Move-Item -LiteralPath $temporary -Destination $Destination
    } catch {
        if (Test-Path -LiteralPath $temporary) {
            Remove-Item -LiteralPath $temporary -Recurse -Force
        }
        if ($backup -and -not (Test-Path -LiteralPath $Destination) -and (Test-Path -LiteralPath $backup)) {
            Move-Item -LiteralPath $backup -Destination $Destination
        }
        throw
    }

    [PSCustomObject]@{
        Destination = $Destination
        Backup = $backup
    }
}

$targets = Get-InstallTargets -SelectedAgent $Agent -SelectedScope $Scope -Base $basePath

if (-not $Replace.IsPresent) {
    $existingTargets = @($targets | Where-Object { Test-Path -LiteralPath $_ })
    if ($existingTargets.Count -gt 0) {
        throw "Destination already exists: $($existingTargets -join ', '). Re-run with -Replace to back up and install."
    }
}

$results = foreach ($target in $targets) {
    Install-SkillDirectory -Source $sourcePath -Destination $target -AllowReplace $Replace.IsPresent
}

Write-Host "Installed ${skillName}:"
foreach ($result in $results) {
    Write-Host "  $($result.Destination)"
    if ($result.Backup) {
        Write-Host "  Backup: $($result.Backup)"
    }
}
