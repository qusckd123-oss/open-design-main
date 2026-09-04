param(
  [string]$TaskName = "WackyProductPlanningSalesSync",
  [string]$ProjectDir = $PSScriptRoot + "\.."
)

$ErrorActionPreference = "Stop"

$resolvedProjectDir = (Resolve-Path -LiteralPath $ProjectDir).Path
$resolvedLogDir = Join-Path $resolvedProjectDir ".local-sales-snapshot"
New-Item -ItemType Directory -Force -Path $resolvedLogDir | Out-Null

$npm = (Get-Command npm.cmd).Source
$logFile = Join-Path $resolvedLogDir "task-sales-sync.log"
$argument = "/c cd /d `"$resolvedProjectDir`" && `"$npm`" run sales:sync >> `"$logFile`" 2>&1"

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument $argument
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "Sync Wacky Willy product planning latest.json from authenticated sales dashboard profile." -Force

Write-Host "Registered Task Scheduler task: $TaskName"
Write-Host "Project: $resolvedProjectDir"
Write-Host "Log: $logFile"
Write-Host "If the browser session expires, the task logs '영업기획 대시보드 재로그인이 필요합니다.' and keeps the previous latest.json."
