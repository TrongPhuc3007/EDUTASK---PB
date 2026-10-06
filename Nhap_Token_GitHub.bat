@echo off
chcp 65001 >nul
title ĐẨY CODE LÊN GITHUB BẰNG TOKEN — EDUTASK PRO
color 0B

echo =======================================================
echo     ĐẨY CODE LÊN GITHUB BẰNG PERSONAL ACCESS TOKEN
echo     Kho lưu trữ: https://github.com/TrongPhuc3007/EDUTASK---PB
echo =======================================================
echo.
echo Hướng dẫn lấy Token nhanh nếu chưa có:
echo 1. Vào GitHub.com -> Cài đặt (Settings) -> Developer Settings
echo 2. Chọn "Personal access tokens" -> "Tokens (classic)"
echo 3. Bấm "Generate new token (classic)", tích chọn quyền [repo] và bấm Tạo.
echo.
set /p TOKEN=">> Dán Token của bạn vào đây rồi bấm Enter: "

if "%TOKEN%"=="" (
    echo.
    echo [LỖI] Bạn chưa nhập Token!
    pause
    exit /b
)

set "GIT_EXE=C:\Users\LECOO\AppData\Local\Programs\Git\cmd\git.exe"
if not exist "%GIT_EXE%" set "GIT_EXE=git"

echo.
echo Đang cấu hình và đẩy code lên GitHub...
"%GIT_EXE%" remote set-url origin https://%TOKEN%@github.com/TrongPhuc3007/EDUTASK---PB.git
"%GIT_EXE%" push -u origin main --force

echo.
if %ERRORLEVEL% EQU 0 (
    color 0A
    echo =======================================================
    echo  [THÀNH CÔNG] Toàn bộ mã nguồn đã được tải lên GitHub!
    echo  Xem tại: https://github.com/TrongPhuc3007/EDUTASK---PB
    echo =======================================================
) else (
    color 0C
    echo =======================================================
    echo  [LỖI] Không thể đẩy code. Vui lòng kiểm tra lại Token hoặc kết nối mạng!
    echo =======================================================
)

echo.
pause
