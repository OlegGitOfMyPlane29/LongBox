Option Explicit

Dim shell, fso, scriptDir, batPath, modeArg, command

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = fso.BuildPath(scriptDir, "zapusk.bat")

If Not fso.FileExists(batPath) Then
    MsgBox "Не найден файл zapusk.bat рядом с zapusk.vbs.", vbCritical, "Ошибка запуска"
    WScript.Quit 1
End If

modeArg = ""
If WScript.Arguments.Count > 0 Then
    If LCase(WScript.Arguments(0)) = "check" Then
        modeArg = " --check"
    End If
End If

If modeArg <> "" Then
    command = "cmd /k cd /d """ & scriptDir & """ && node zapusk.js" & modeArg & " && echo. && pause"
Else
    command = "cmd /k """ & batPath & """"
End If

' 1 = normal window, False = don't wait.
shell.Run command, 1, False
