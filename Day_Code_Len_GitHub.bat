@echo off
chcp 65001 >nul
title ĐẨY CODE LÊN GITHUB — EDUTASK PRO
color 0B

echo =======================================================
echo     ĐỒNG BỘ MÃ NGUỒN LÊN GITHUB: EDUTASK - PB
echo     Kho lưu trữ: https://github.com/TrongPhuc3007/EDUTASK---PB
echo =======================================================
echo.
echo Đang tiến hành đẩy code lên GitHub (nhánh main)...
echo.

set "GIT_EXE=C:\Users\LECOO\AppData\Local\Programs\Git\cmd\git.exe"
if not exist "%GIT_EXE%" set "GIT_EXE=git"

"%GIT_EXE%" push -u origin main --force

echo.
if %ERRORLEVEL% EQU 0 (
    color 0A
    echo =======================================================
    echo  [THÀNH CÔNG] Toàn bộ mã nguồn đã được đồng bộ lên GitHub!
    echo  Xem tại: https://github.com/TrongPhuc3007/EDUTASK---PB
    echo =======================================================
) else (
    color 0C
    echo =======================================================
    echo  [LƯU Ý] Nếu GitHub yêu cầu xác thực:
    echo  - Cửa sổ đăng nhập trình duyệt (GitHub Login) sẽ hiện lên.
    echo  - Hãy bấm "Sign in with your browser" để hoàn tất.
    echo  - Hoặc nếu dùng Token, dán Personal Access Token vào ô Password.
    echo =======================================================
)

echo.
pause
