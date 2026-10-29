@echo off
chcp 65001 >nul
title Envoi du portfolio vers le serveur du cegep
cd /d "%~dp0"
where py >nul 2>nul && (py envoyer_portfolio.py) || (python envoyer_portfolio.py)
echo.
pause
