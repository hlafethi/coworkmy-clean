@echo off
cd /d %~dp0
npm run sync
echo Synchronisation terminée à %time%
pause 