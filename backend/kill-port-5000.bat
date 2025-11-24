@echo off
echo Checking for processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Found process: %%a
    taskkill /F /PID %%a
    echo Process killed successfully!
)
echo Port 5000 is now free.
pause
