@echo off
:: create_shortcut.bat
:: Создаёт ярлык MoodBooster.lnk в папке проекта.
:: Запусти этот файл один раз — ярлык появится рядом.

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('D:\Gigarepoman\MoodBooster\MoodBooster.lnk'); $s.TargetPath = 'D:\Gigarepoman\MoodBooster\main.vbs'; $s.WorkingDirectory = 'D:\Gigarepoman\MoodBooster'; $s.Description = 'Mood Booster'; $s.Save()"

echo.
echo Ярлык MoodBooster.lnk создан в папке проекта!
pause
