call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" x64
cd /d D:\claude_todo\crossext\toolchain\EFM8_prog
cl /I. EFM8_prog.c FTD2XX.lib /Fe:EFM8_prog.exe
