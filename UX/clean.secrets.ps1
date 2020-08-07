$dir_iso = ForEach-Object { cmd /c dir /s /b .\node_modules\buffer\test .\node_modules\public-encrypt\test }

$dir_iso | % {
    Write-Host "Removing " $_
    Remove-Item $_ -Force -Recurse
}

<#
 These files have strings which are detected as secrets. Files are not needed for the build, so just plainly removing it.

$files = New-Object System.Collections.ArrayList
[void] $files.Add(".\webpack\node_modules\crypto-browserify\c.js")
[void] $files.Add(".\cheerio\node_modules\hawk\README.md")
[void] $files.Add(".\cheerio\node_modules\hawk\lib\server.js")
[void] $files.Add(".\less\node_modules\hawk\README.md")
[void] $files.Add(".\less\node_modules\hawk\lib\server.js")
[void] $files.Add(".\cheerio\node_modules\http-signature\http_signing.md")
[void] $files.Add(".\less\node_modules\http-signature\http_signing.md")

[Environment]::CurrentDirectory = $pwd
foreach ($file in $files) {
	Write-Host "Checking" $file
    $fullPath = [IO.Path]::GetFullPath($file)
    if([System.IO.File]::Exists($fullPath)) {
        Write-Host "Removing " $fullPath
        Remove-Item $fullPath
    }
}
#>