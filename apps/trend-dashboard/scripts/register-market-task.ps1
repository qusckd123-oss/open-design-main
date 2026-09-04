param(
  [string]$TaskName = "TrendDashboardVerifiedMarketCollection",
  [string]$At = "09:00"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$collector = Join-Path $scriptDir "collect-verified-market.cmd"

if (-not (Test-Path -LiteralPath $collector)) {
  throw "Collector script not found: $collector"
}

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "Run this script from an elevated PowerShell session to register the scheduled task."
  Write-Host "Collector script: $collector"
  exit 1
}

$action = New-ScheduledTaskAction -Execute $collector
$trigger = New-ScheduledTaskTrigger -Daily -At $At
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "Collect verified MARKET ranking data for END and Rakuten Fashion." -Force | Out-Null

Write-Host "Registered scheduled task: $TaskName"
Write-Host "Schedule: daily at $At"
Write-Host "Logs: $(Join-Path (Split-Path -Parent $scriptDir) 'logs\market-collection')"
