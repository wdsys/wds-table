$appPath = (Get-Location).Path + "\wds-table.exe"
$extension = ".table"
$description = "WDS Table Document"

# Register file extension
New-Item -Path "HKCU:\Software\Classes\$extension" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\$extension" -Name "(Default)" -Value "WDSTable"

# Create application registration
New-Item -Path "HKCU:\Software\Classes\WDSTable" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\WDSTable" -Name "(Default)" -Value $description

# Register icon
New-Item -Path "HKCU:\Software\Classes\WDSTable\DefaultIcon" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\WDSTable\DefaultIcon" -Name "(Default)" -Value "`"$appPath`",0"

# Register command
New-Item -Path "HKCU:\Software\Classes\WDSTable\shell\open\command" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Classes\WDSTable\shell\open\command" -Name "(Default)" -Value "`"$appPath`" `"%1`""